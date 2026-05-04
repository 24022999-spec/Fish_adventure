import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const INTERACT_RADIUS = 5.0

const CHARACTERS = [
  {
    name:        'SpongeBob',
    displayName: 'SpongeBob',
    file:        '/assets/models/decorations/sea_creatures/sponge_bob.glb',
    pos:         { x: -5.2,  y: -24,   z:  15.8 },
    scale:       1.5,
    dialogue: {
      text:    'Cậu có thể giúp tớ tìm Gary không ? (có thể cậu ấy đã bị bắt bởi người đàn ông khó tính nào đó -.-)',
      options: ['Không, cậu tự tìm đi', 'Ok bro!'],
    },
  },
  {
    name:        'Gary',
    displayName: 'Gary',
    file:        '/assets/models/decorations/sea_creatures/Gary.glb',
    pos:         { x: -15.7, y: -19.4, z: -23.2 },
    scale:       1.0,
    dialogue: {
      text:    'Meow?',
      options: ['Tìm thấy cậu rồi Gary!'],
    },
  },
  {
    name:        'Dat',
    displayName: 'Đạt',
    file:        '/assets/models/decorations/sea_creatures/stupid.glb',
    pos:         { x:  19.1, y: -20.5, z:  -2.5 },
    scale:       0.03,
    rotY:        100,
    dialogue: {
      text:    'Ôi khônggg, món của của tớ bị cái máy này nuốt mất rồi TT',
      options: ['Để tớ giúp', 'Haha đáng đời chưa :P'],
    },
  },
  {
    name:        'Hung',
    displayName: 'Hùng',
    file:        '/assets/models/decorations/sea_creatures/cute_octopus.glb',
    pos:         { x: -11.8, y: -21.3, z:  -3.3 },
    scale:       5.0,
    dialogue: {
      text:    'Tôi háo hức tới bữa tiệc của Khánh quá!',
      options: ['Tôi thì không.'],
    },
  },
]

export class CharacterManager {
  constructor(scene, camera, thirdCam) {
    this._scene    = scene
    this._camera   = camera
    this._thirdCam = thirdCam
    this._mixers   = []
    this._clock    = new THREE.Clock()
    this._loader   = new GLTFLoader()
    this._npcs     = []

    this.isDialogueOpen = false
    this._activeNPC     = null
    this._nearestNPC    = null

    this._targetCamPos  = new THREE.Vector3()
    this._targetCamQuat = new THREE.Quaternion()

    this._garyQuestState = 'NONE' // NONE | ACTIVE | DONE

    this._createUI()
    this._createQuestPanel()
    this._bindKeys()

    for (const char of CHARACTERS) this._loadCharacter(char)
  }

  // ── Floating hint sprite ─────────────────────────────────────────────────

  _createHintSprite() {
    const canvas  = document.createElement('canvas')
    canvas.width  = 256
    canvas.height = 80
    const ctx     = canvas.getContext('2d')
    ctx.fillStyle = 'rgba(0,0,0,0.75)'
    ctx.roundRect(4, 4, 248, 72, 14)
    ctx.fill()
    ctx.fillStyle  = '#ffffff'
    ctx.font       = 'bold 28px sans-serif'
    ctx.textAlign  = 'center'
    ctx.fillText('[E] Nói chuyện', 128, 48)

    const tex    = new THREE.CanvasTexture(canvas)
    const mat    = new THREE.SpriteMaterial({ map: tex, transparent: true })
    const sprite = new THREE.Sprite(mat)
    sprite.scale.set(3.5, 1.1, 1)
    return sprite
  }

  // ── Load character model ─────────────────────────────────────────────────

  _loadCharacter(data) {
    this._loader.load(
      data.file,
      (gltf) => {
        const model = gltf.scene
        model.name  = data.name
        model.scale.setScalar(data.scale)
        model.position.set(data.pos.x, data.pos.y, data.pos.z)
        if (data.rotY != null) model.rotation.y = THREE.MathUtils.degToRad(data.rotY)
        model.traverse(c => {
          if (c.isMesh || c.isSkinnedMesh) {
            c.castShadow    = true
            c.receiveShadow = true
          }
        })
        this._scene.add(model)

        if (gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(model)
          mixer.clipAction(gltf.animations[0]).play()
          this._mixers.push(mixer)
        }

        // Place floating sprite at character position Y+1
        const sprite = this._createHintSprite()
        sprite.position.set(data.pos.x, data.pos.y + 1, data.pos.z)
        sprite.visible = false
        this._scene.add(sprite)

        this._npcs.push({ data, mesh: model, sprite, originalQuat: new THREE.Quaternion() })
      },
      undefined,
      (err) => console.error(`[CharacterManager] Failed to load ${data.name}:`, err)
    )
  }

  // ── Quest Panel (Find Gary) ──────────────────────────────────────────────

  _createQuestPanel() {
    this._questPanel = document.createElement('div')
    Object.assign(this._questPanel.style, {
      display:      'none',
      position:     'fixed',
      top:          '60px',
      right:        '16px',
      background:   'rgba(10,15,30,0.90)',
      border:       '1px solid #f5a62388',
      borderLeft:   '3px solid #f5a623',
      borderRadius: '8px',
      padding:      '12px 16px',
      color:        '#fff',
      fontFamily:   'sans-serif',
      fontSize:     '13px',
      minWidth:     '230px',
      lineHeight:   '1.5',
      zIndex:       '500',
      opacity:      '0',
      transition:   'opacity 0.4s',
      boxShadow:    '0 0 18px rgba(245,166,35,0.2)',
    })
    this._questPanel.innerHTML = `
      <div style="font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#f5a623;margin-bottom:6px">📋 Nhiệm vụ</div>
      <div style="font-weight:bold;margin-bottom:10px;font-size:14px">Tìm Gary cho SpongeBob</div>
      <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:#ccc">
        <span id="gary-quest-check" style="font-size:16px">☐</span>
        <span id="gary-quest-label">Tương tác với Gary &nbsp;<span style="color:#f5a623;font-weight:bold">[E]</span></span>
      </div>
    `
    document.body.appendChild(this._questPanel)
  }

  _showQuestPanel() {
    this._questPanel.style.display = 'block'
    requestAnimationFrame(() => { this._questPanel.style.opacity = '1' })
  }

  _completeGaryQuest() {
    this._garyQuestState = 'DONE'
    const checkEl = document.getElementById('gary-quest-check')
    const labelEl = document.getElementById('gary-quest-label')
    if (checkEl) checkEl.textContent = '✅'
    if (labelEl) {
      labelEl.textContent = 'Gary đã được tìm thấy!'
      labelEl.style.color = '#88ff88'
    }
    setTimeout(() => {
      this._questPanel.style.opacity = '0'
      setTimeout(() => { this._questPanel.style.display = 'none' }, 400)
    }, 5000)
  }

  // ── UI ──────────────────────────────────────────────────────────────────

  _createUI() {
    this._chatEl = document.createElement('div')
    Object.assign(this._chatEl.style, {
      display:        'none',
      position:       'fixed',
      bottom:         '250px',
      left:           '40%',
      transform:      'translateX(-50%)',
      flexDirection:  'column',
      alignItems:     'center',
      gap:            '14px',
      zIndex:         '600',
      fontFamily:     'sans-serif',
    })
    this._chatEl.innerHTML = `
      <div style="
        background: white; color: #1a365d;
        padding: 20px 28px; border-radius: 18px;
        font-size: 16px; font-weight: bold;
        box-shadow: 0 4px 16px rgba(0,0,0,0.25);
        max-width: 500px; text-align: center; position: relative;
      ">
        <div id="npc-name" style="font-size:13px;color:#0088bb;margin-bottom:7px;font-weight:normal;"></div>
        <div id="npc-text"></div>
        <div style="
          position:absolute; bottom:-14px; left:50%; transform:translateX(-50%);
          border-width:14px 14px 0; border-style:solid;
          border-color:white transparent transparent transparent;
        "></div>
      </div>
      <div id="npc-options" style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;"></div>
      <div style="font-size:12px;color:rgba(255,255,255,0.65);margin-top:-4px;">Nhấn số để chọn</div>
    `
    document.body.appendChild(this._chatEl)
  }

  _bindKeys() {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyE' && this._nearestNPC && !this.isDialogueOpen) {
        this._startChat(this._nearestNPC)
        return
      }
      if (this.isDialogueOpen && this._activeNPC) {
        const idx  = parseInt(e.key) - 1
        const opts = this._activeNPC.data.dialogue.options
        if (!isNaN(idx) && idx >= 0 && idx < opts.length) {
          this._endChat(idx)
        }
      }
    })
  }

  // ── Dialogue ─────────────────────────────────────────────────────────────

  _startChat(npc) {
    this.isDialogueOpen = true
    this._activeNPC     = npc

    this._thirdCam?.setDialogueMode(true)

    document.getElementById('npc-name').textContent = npc.data.displayName
    document.getElementById('npc-text').textContent = npc.data.dialogue.text

    const optionsEl = document.getElementById('npc-options')
    optionsEl.innerHTML = ''
    npc.data.dialogue.options.forEach((label, i) => {
      const btn = document.createElement('button')
      btn.textContent = `[${i + 1}] ${label}`
      Object.assign(btn.style, {
        background:   'white',
        border:       'none',
        padding:      '10px 22px',
        borderRadius: '20px',
        fontSize:     '15px',
        fontWeight:   'bold',
        color:        '#d17a45',
        cursor:       'pointer',
        boxShadow:    '0 4px 10px rgba(0,0,0,0.15)',
        transition:   'transform 0.1s',
      })
      btn.addEventListener('mouseover', () => { btn.style.transform = 'scale(1.06)' })
      btn.addEventListener('mouseout',  () => { btn.style.transform = 'scale(1)' })
      btn.addEventListener('click', () => this._endChat(i))
      optionsEl.appendChild(btn)
    })

    this._chatEl.style.display = 'flex'
    if (npc.sprite) npc.sprite.visible = false

    npc.originalQuat.copy(npc.mesh.quaternion)
    const npcPos = new THREE.Vector3(npc.data.pos.x, npc.data.pos.y, npc.data.pos.z)

    const camDir = new THREE.Vector3().subVectors(this._camera.position, npcPos)
    camDir.y = 0
    if (camDir.lengthSq() < 0.01) camDir.set(0, 0, 1)
    camDir.normalize()

    this._targetCamPos.copy(npcPos).addScaledVector(camDir, 5)
    this._targetCamPos.y = npcPos.y + 2

    const dummy = this._camera.clone()
    dummy.position.copy(this._targetCamPos)
    dummy.lookAt(npcPos.x, npcPos.y + 1, npcPos.z)
    this._targetCamQuat.copy(dummy.quaternion)
  }

  _endChat(selectedIdx = -1) {
    const activeNPC = this._activeNPC
    this.isDialogueOpen        = false
    this._chatEl.style.display = 'none'

    this._thirdCam?.setDialogueMode(false)

    if (activeNPC) {
      activeNPC.mesh.quaternion.copy(activeNPC.originalQuat)

      // SpongeBob option 1 = "Ok bro!" → bắt đầu quest tìm Gary
      if (activeNPC.data.name === 'SpongeBob' && selectedIdx === 1 && this._garyQuestState === 'NONE') {
        this._garyQuestState = 'ACTIVE'
        this._showQuestPanel()
      }

      // Tương tác với Gary khi quest đang active → hoàn thành
      if (activeNPC.data.name === 'Gary' && this._garyQuestState === 'ACTIVE') {
        this._completeGaryQuest()
      }

      this._activeNPC = null
    }
  }

  // ── Per-frame ─────────────────────────────────────────────────────────────

  update(playerPos) {
    const dt = this._clock.getDelta()
    for (const mixer of this._mixers) mixer.update(dt)

    if (this.isDialogueOpen) {
      this._camera.position.lerp(this._targetCamPos, 0.07)
      this._camera.quaternion.slerp(this._targetCamQuat, 0.07)
      return
    }

    let nearest = null
    let minDist = INTERACT_RADIUS
    for (const npc of this._npcs) {
      const dist = playerPos.distanceTo(npc.mesh.position)
      if (dist < minDist) { minDist = dist; nearest = npc }
    }

    this._nearestNPC = nearest

    for (const npc of this._npcs) {
      if (npc.sprite) npc.sprite.visible = (npc === nearest)
    }
  }
}
