import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { assetUrl } from './assetUrl.js'

// ================================================================
// QuestGiver — Nhân vật sad đứng dưới đáy biển
// Khi player bơi đến gần → hiện dialogue → nhận quest → mở minigame
// ================================================================

const INTERACT_RADIUS = 4.0   // khoảng cách kích hoạt interact
const INTERACT_KEY    = 'KeyE' // phím tương tác

export class QuestGiver {
  constructor(scene, position, onQuestAccepted, camera = null, thirdCam = null, onDialogueStart = null, onDialogueEnd = null) {
    this.scene            = scene
    this.position         = position  // THREE.Vector3
    this.onQuestAccepted  = onQuestAccepted
    this._camera          = camera
    this._thirdCam        = thirdCam
    this._onDialogueStart = onDialogueStart
    this._onDialogueEnd   = onDialogueEnd
    this._mixer          = null
    this._mesh           = null
    this._isNearPlayer   = false
    this._questDone      = false
    this._clock          = new THREE.Clock()
    this._targetCamPos   = new THREE.Vector3()
    this._targetCamQuat  = new THREE.Quaternion()

    this._createMesh()
    this._createUI()
    this._bindKeys()
  }

  // — Load model Linh ——————————————————————————————————————
  _createMesh() {
    const loader = new GLTFLoader()
    loader.load(assetUrl('/assets/models/decorations/sea_creatures/quest_giver.glb'), (gltf) => {
      this._mesh = gltf.scene
      this._mesh.scale.setScalar(0.010)
      this._mesh.position.copy(this.position)
      this._mesh.rotation.y = Math.PI / 6

      this._mesh.traverse(c => {
        if (c.isMesh) { c.castShadow = true; c.receiveShadow = true }
      })

      // Animation idle nếu có
      if (gltf.animations?.length) {
        this._mixer = new THREE.AnimationMixer(this._mesh)
        this._mixer.clipAction(gltf.animations[0]).play()
      }

      this.scene.add(this._mesh)

      // Vòng tròn chỉ dẫn bên dưới
      this._createIndicator()
    }, undefined, () => {
      // Fallback: hình trụ màu vàng nếu không load được
      const geo = new THREE.CylinderGeometry(0.4, 0.4, 2, 8)
      const mat = new THREE.MeshStandardMaterial({ color: 0xffd700 })
      this._mesh = new THREE.Mesh(geo, mat)
      this._mesh.position.copy(this.position)
      this.scene.add(this._mesh)
      this._createIndicator()
    })
  }

  // — Vòng tròn phát sáng dưới chân Linh ——————————————————
  _createIndicator() {
    const geo = new THREE.RingGeometry(0.8, 1.2, 32)
    const mat = new THREE.MeshBasicMaterial({
      color: 0x00ffff, transparent: true, opacity: 0.6,
      side: THREE.DoubleSide,
    })
    this._indicator = new THREE.Mesh(geo, mat)
    this._indicator.rotation.x = -Math.PI / 2
    this._indicator.position.copy(this.position)
    this._indicator.position.y += 0.05
    this.scene.add(this._indicator)

    // Dấu [E] nổi trên đầu
    this._floatingE = this._createFloatingText()
    this._floatingE.visible = false
    this.scene.add(this._floatingE)
  }

  _createFloatingText() {
    // Sprite [E] interact hint
    const canvas  = document.createElement('canvas')
    canvas.width  = 128
    canvas.height = 64
    const ctx     = canvas.getContext('2d')
    ctx.fillStyle = 'rgba(0,0,0,0.7)'
    ctx.roundRect(4, 4, 120, 56, 12)
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.font      = 'bold 28px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('[E] Talk', 64, 38)

    const tex     = new THREE.CanvasTexture(canvas)
    const mat     = new THREE.SpriteMaterial({ map: tex, transparent: true })
    const sprite  = new THREE.Sprite(mat)
    sprite.scale.set(2.5, 1.2, 1)
    sprite.position.copy(this.position)
    sprite.position.y += 3.5
    return sprite
  }

  // — HTML Dialogue UI ——————————————————————————————————————
  _createUI() {
    this._ui = document.createElement('div')
    this._ui.id = 'quest-dialogue'
    Object.assign(this._ui.style, {
      display:       'none',
      position:      'fixed',
      top:           '0',
      left:          '0',
      transform:     'translate(-50%, -100%)',
      flexDirection: 'column',
      alignItems:    'center',
      gap:           '14px',
      zIndex:        '1000',
      fontFamily:    'sans-serif',
    })

    this._ui.innerHTML = `
      <div style="
        background:white; color:#1a365d;
        padding:20px 28px; border-radius:18px;
        font-size:16px; font-weight:bold;
        box-shadow:0 4px 16px rgba(0,0,0,0.25);
        max-width:500px; text-align:center; position:relative;
      ">
        <div style="font-size:13px;color:#0088bb;margin-bottom:7px;font-weight:normal;">Linh</div>
        <div id="quest-text">
          Chào cậu! Ta cần cậu giúp một việc —
          hãy vượt qua con đường nguy hiểm phía trước
          mà không bị cá mập bắt.<br><br>
          Cậu có dám thử không?
        </div>
        <div style="
          position:absolute; bottom:-14px; left:50%; transform:translateX(-50%);
          border-width:14px 14px 0; border-style:solid;
          border-color:white transparent transparent transparent;
        "></div>
      </div>
      <div id="quest-options" style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;"></div>
      <div style="font-size:12px;color:rgba(255,255,255,0.65);margin-top:-4px;">Nhấn số để chọn</div>
    `
    document.body.appendChild(this._ui)

    this._renderButtons()
  }

  _renderButtons() {
    const optionsEl = document.getElementById('quest-options')
    if (!optionsEl) return
    optionsEl.innerHTML = ''

    const buttons = [
      { label: '[1] Để sau vậy',      action: () => { this._closeDialogue() } },
      { label: '[2] Nhận nhiệm vụ! 🐟', action: () => { this._closeDialogue(); this.onQuestAccepted?.() } },
    ]

    buttons.forEach(({ label, action }) => {
      const btn = document.createElement('button')
      btn.textContent = label
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
      btn.addEventListener('click', action)
      optionsEl.appendChild(btn)
    })
  }

  _openDialogue() {
    this._ui.style.display = 'flex'
    this._dialogueOpen = true
    this._onDialogueStart?.()
    this._thirdCam?.setDialogueMode(true)
    this._setupCameraTarget()
    this._updateChatPosition()
  }

  _closeDialogue() {
    this._ui.style.display = 'none'
    this._dialogueOpen = false
    this._onDialogueEnd?.()
    this._thirdCam?.setDialogueMode(false)
  }

  get isDialogueOpen() { return !!this._dialogueOpen }

  _setupCameraTarget() {
    if (!this._camera) return
    const npcPos = this.position.clone()
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

  _projectToScreen(worldPos) {
    const vec = worldPos.clone()
    vec.project(this._camera)
    return {
      x: (vec.x + 1) / 2 * window.innerWidth,
      y: -(vec.y - 1) / 2 * window.innerHeight,
    }
  }

  _updateChatPosition() {
    if (!this._camera) return
    const bodyWorld = this.position.clone()
    bodyWorld.y += 1
    const screen = this._projectToScreen(bodyWorld)
    const safeY  = Math.max(260, Math.min(window.innerHeight * 0.72, screen.y))
    this._ui.style.left = screen.x + 'px'
    this._ui.style.top  = safeY + 'px'
  }

  // — Key binding ——————————————————————————————————————————
  _bindKeys() {
    this._onKey = (e) => {
      if (e.code === INTERACT_KEY && this._isNearPlayer && !this._questDone) {
        if (!this._dialogueOpen) this._openDialogue()
        return
      }
      if (this._dialogueOpen) {
        if (e.key === '1') { this._closeDialogue() }
        if (e.key === '2') { this._closeDialogue(); this.onQuestAccepted?.() }
      }
    }
    window.addEventListener('keydown', this._onKey)
  }

  // — Gọi mỗi frame từ Game.js ————————————————————————————
  update(playerPos, time) {
    const delta = this._clock.getDelta()

    // Update animation
    if (this._mixer) {
      this._mixer.update(delta)
    }

    // Camera lerp + chat position khi dialogue đang mở
    if (this._dialogueOpen && this._camera) {
      this._camera.position.lerp(this._targetCamPos, 0.07)
      this._camera.quaternion.slerp(this._targetCamQuat, 0.07)
      this._updateChatPosition()
      return
    }

    // Kiểm tra khoảng cách
    if (!this._mesh) return
    const dist = playerPos.distanceTo(this.position)
    const near = dist < INTERACT_RADIUS

    if (near !== this._isNearPlayer) {
      this._isNearPlayer = near
      if (this._floatingE) this._floatingE.visible = near && !this._questDone
      if (!near) this._closeDialogue()
    }

    // Pulse indicator
    if (this._indicator) {
      const pulse = 0.7 + Math.sin(time * 3) * 0.3
      this._indicator.material.opacity = pulse * 0.6
      this._indicator.rotation.z = time * 0.5
    }

    // Bob model nhẹ
    if (this._mesh) {
      this._mesh.position.y = this.position.y + Math.sin(time * 1.5) * 0.15
    }
  }

  // Đánh dấu quest xong (ẩn indicator)
  markComplete() {
    this._questDone = true
    if (this._indicator) this._indicator.material.color.set(0x00ff88)
    if (this._floatingE) this._floatingE.visible = false
  }

  destroy() {
    window.removeEventListener('keydown', this._onKey)
    this._ui?.remove()
    if (this._mesh) this.scene.remove(this._mesh)
    if (this._indicator) this.scene.remove(this._indicator)
    if (this._floatingE) this.scene.remove(this._floatingE)
  }
}
