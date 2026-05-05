import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { assetUrl } from './assetUrl.js'

const INTERACT_RADIUS = 5.0

const CHARACTERS = [
  {
    name:        'SpongeBob',
    displayName: 'SpongeBob',
    file:        '/assets/models/decorations/sea_creatures/sponge_bob.glb',
    pos:         { x: -5.2,  y: -24,   z:  15.8 },
    scale:       1.5,
    headY:       4,
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
    headY:       3,
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
    headY:       3,
    dialogue: {
      text:    'Ôi khônggg, món quà của tớ bị cái máy này nuốt mất rồi TT huhu',
      options: ['Để tớ giúp', 'Haha đáng đời chưa :P'],
    },
  },
  {
    name:        'Hung',
    displayName: 'Hùng',
    file:        '/assets/models/decorations/sea_creatures/cute_octopus.glb',
    pos:         { x: -11.8, y: -21.3, z:  -3.3 },
    scale:       5.0,
    headY:       2,
    dialogue: {
      text:    'Không xong rồi!! Tớ làm rơi donut để ăn sinh nhật Khánh rồi!!!',
      options: ['Tự đi tìm lại đi', 'Để tớ giúp tìm lại cho'],
    },
  },
  {
    name:        'Khanh',
    displayName: 'Khánh',
    file:        '/assets/models/decorations/sea_creatures/patsy_the_turtle.glb',
    pos:         { x: 4.4, y: -21.1, z: -5.7 },
    scale:       1.0,
    headY:       2,
    dialogue: {
      text:    'Chào mừng cậu đã đến với tiệc sinh nhật của tớ! Chúng ta sẽ bắt đầu ngay khi mọi người chuẩn bị xong, cậu hãy đến hỏi mọi người xem họ chuẩn bị xong chưa nhá!',
      options: ['Ok, để tớ đi hỏi ngay!'],
    },
  },
]

export class CharacterManager {
  constructor(scene, camera, thirdCam, onDialogueStart = null, onDialogueEnd = null, onDonutQuestAccepted = null, onDatQuestAccepted = null, onKhanhAccepted = null, onGaryQuestDone = null, getAllQuestsDone = null, onKhanhFinalAccepted = null) {
    this._scene                 = scene
    this._camera                = camera
    this._thirdCam              = thirdCam
    this._onDialogueStart       = onDialogueStart
    this._onDialogueEnd         = onDialogueEnd
    this._onDonutQuestAccepted  = onDonutQuestAccepted
    this._onDatQuestAccepted    = onDatQuestAccepted
    this._onKhanhAccepted       = onKhanhAccepted
    this._onGaryQuestDone       = onGaryQuestDone
    this._getAllQuestsDone       = getAllQuestsDone
    this._onKhanhFinalAccepted  = onKhanhFinalAccepted
    this._khanhTalked           = false
    this._khanhFinalPhase       = false
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
      assetUrl(data.file),
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

        // Place floating sprite above character head
        const sprite = this._createHintSprite()
        sprite.position.set(data.pos.x, data.pos.y + (data.headY ?? 2) + 0.5, data.pos.z)
        sprite.visible = false
        this._scene.add(sprite)

        this._npcs.push({ data, mesh: model, sprite, originalQuat: new THREE.Quaternion() })
      },
      undefined,
      (err) => console.error(`[CharacterManager] Failed to load ${data.name}:`, err)
    )
  }

  // ── World-to-screen chat positioning ────────────────────────────────────

  _projectToScreen(worldPos) {
    const vec = worldPos.clone()
    vec.project(this._camera)
    return {
      x: (vec.x + 1) / 2 * window.innerWidth,
      y: -(vec.y - 1) / 2 * window.innerHeight,
    }
  }

  _updateChatPosition() {
    if (!this._activeNPC) return
    const p         = this._activeNPC.data.pos
    const headY     = this._activeNPC.data.headY ?? 2
    // Project body center (not head top) so box stays on screen after zoom
    const bodyWorld = new THREE.Vector3(p.x, p.y + headY * 0.4, p.z)
    const screen    = this._projectToScreen(bodyWorld)
    // Clamp Y: box bottom must be at least 260px from top so the box stays visible
    const safeY = Math.max(260, Math.min(window.innerHeight * 0.72, screen.y))
    this._chatEl.style.left = screen.x + 'px'
    this._chatEl.style.top  = safeY + 'px'
    // transform: translate(-50%, -100%) → box bottom = safeY, box extends upward
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
    this._onGaryQuestDone?.()
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
      top:            '0',
      left:           '0',
      transform:      'translate(-50%, -100%)',
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
        const opts = this._resolveDialogue(this._activeNPC).options
        if (!isNaN(idx) && idx >= 0 && idx < opts.length) {
          this._endChat(idx)
        }
      }
    })
  }

  // ── Dialogue ─────────────────────────────────────────────────────────────

  // Trả về dialogue phù hợp với phase hiện tại của Khánh
  _resolveDialogue(npc) {
    if (npc.data.name !== 'Khanh' || !this._khanhTalked) {
      this._khanhFinalPhase = false
      return npc.data.dialogue
    }
    if (this._getAllQuestsDone?.()) {
      this._khanhFinalPhase = true
      return {
        text:    'OK, Hãy bắt đầu nàoooo!!!',
        options: ['🎉 Bắt đầu thôi!'],
      }
    }
    this._khanhFinalPhase = false
    return {
      text:    'Chờ mọi người chuẩn bị xong đã nhé! 😊',
      options: ['Ok, tớ sẽ đi hỏi thêm!'],
    }
  }

  _startChat(npc) {
    this.isDialogueOpen = true
    this._activeNPC     = npc
    this._onDialogueStart?.()

    this._thirdCam?.setDialogueMode(true)

    const dialogue = this._resolveDialogue(npc)

    document.getElementById('npc-name').textContent = npc.data.displayName
    document.getElementById('npc-text').textContent = dialogue.text

    const optionsEl = document.getElementById('npc-options')
    optionsEl.innerHTML = ''
    dialogue.options.forEach((label, i) => {
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
    this._updateChatPosition()
    if (npc.sprite) npc.sprite.visible = false

    npc.originalQuat.copy(npc.mesh.quaternion)
    const npcPos = new THREE.Vector3(npc.data.pos.x, npc.data.pos.y, npc.data.pos.z)

    const camDir = new THREE.Vector3().subVectors(this._camera.position, npcPos)
    camDir.y = 0
    if (camDir.lengthSq() < 0.01) camDir.set(0, 0, 1)
    camDir.normalize()

    const headY = npc.data.headY ?? 2
    this._targetCamPos.copy(npcPos).addScaledVector(camDir, 4)
    this._targetCamPos.y = npcPos.y + headY * 0.5 + 1

    const dummy = this._camera.clone()
    dummy.position.copy(this._targetCamPos)
    dummy.lookAt(npcPos.x, npcPos.y + headY * 0.4, npcPos.z)
    this._targetCamQuat.copy(dummy.quaternion)
  }

  _endChat(selectedIdx = -1) {
    const activeNPC = this._activeNPC
    this.isDialogueOpen        = false
    this._chatEl.style.display = 'none'
    this._onDialogueEnd?.()

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

      // Hùng option 1 = "Để tớ giúp tìm lại cho" → spawn donut
      if (activeNPC.data.name === 'Hung' && selectedIdx === 1) {
        this._onDonutQuestAccepted?.()
      }

      // Đạt option 0 = "Để tớ giúp" → mở minigame2
      if (activeNPC.data.name === 'Dat' && selectedIdx === 0) {
        this._onDatQuestAccepted?.()
      }

      // Khánh: lần đầu → quest tổng; lần cuối (all done) → happy ending
      if (activeNPC.data.name === 'Khanh' && selectedIdx === 0) {
        if (!this._khanhTalked) {
          this._khanhTalked = true
          this._onKhanhAccepted?.()
        } else if (this._khanhFinalPhase) {
          this._onKhanhFinalAccepted?.()
        }
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
      this._updateChatPosition()
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
