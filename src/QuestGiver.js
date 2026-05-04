import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

// ================================================================
// QuestGiver — Nhân vật sad đứng dưới đáy biển
// Khi player bơi đến gần → hiện dialogue → nhận quest → mở minigame
// ================================================================

const INTERACT_RADIUS = 4.0   // khoảng cách kích hoạt interact
const INTERACT_KEY    = 'KeyE' // phím tương tác

export class QuestGiver {
  constructor(scene, position, onQuestAccepted) {
    this.scene          = scene
    this.position       = position  // THREE.Vector3
    this.onQuestAccepted = onQuestAccepted
    this._mixer         = null
    this._mesh          = null
    this._isNearPlayer  = false
    this._questDone     = false
    this._clock         = new THREE.Clock()

    this._createMesh()
    this._createUI()
    this._bindKeys()
  }

  // — Load model Linh ——————————————————————————————————————
  _createMesh() {
    const loader = new GLTFLoader()
    loader.load('/assets/models/decorations/sea_creatures/quest_giver.glb', (gltf) => {
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
      display:        'none',
      position:       'fixed',
      bottom:         '80px',
      left:           '50%',
      transform:      'translateX(-50%)',
      width:          '520px',
      background:     'rgba(10,20,40,0.92)',
      border:         '2px solid #00ccff',
      borderRadius:   '12px',
      padding:        '20px 24px',
      color:          '#fff',
      fontFamily:     'sans-serif',
      zIndex:         '1000',
      boxShadow:      '0 0 20px rgba(0,200,255,0.3)',
    })

    this._ui.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
        <div style="font-size:28px">🐠</div>
        <div>
          <div style="font-weight:bold;font-size:16px;color:#00ccff">Linh</div>
          <div style="font-size:13px;opacity:0.7">Người dẫn đường</div>
        </div>
      </div>
      <p id="quest-text" style="font-size:15px;line-height:1.6;margin:0 0 16px">
        Chào cậu! Ta cần cậu giúp một việc —
        hãy vượt qua con đường nguy hiểm phía trước
        mà không bị cá mập bắt.<br><br>
        Cậu có dám thử không?
      </p>
      <div style="display:flex;gap:10px;justify-content:flex-end">
        <button id="quest-decline" style="
          padding:8px 20px;border-radius:8px;border:1px solid #666;
          background:transparent;color:#aaa;cursor:pointer;font-size:14px">
          Để sau vậy
        </button>
        <button id="quest-accept" style="
          padding:8px 20px;border-radius:8px;border:none;
          background:linear-gradient(135deg,#00aaff,#0055ff);
          color:#fff;cursor:pointer;font-size:14px;font-weight:bold">
          Nhận nhiệm vụ! 🐟
        </button>
      </div>
    `
    document.body.appendChild(this._ui)

    document.getElementById('quest-accept').addEventListener('click', () => {
      this._closeDialogue()
      this.onQuestAccepted?.()
    })
    document.getElementById('quest-decline').addEventListener('click', () => {
      this._closeDialogue()
    })
  }

  _openDialogue() {
    this._ui.style.display = 'block'
    this._dialogueOpen = true
  }

  _closeDialogue() {
    this._ui.style.display = 'none'
    this._dialogueOpen = false
  }

  // — Key binding ——————————————————————————————————————————
  _bindKeys() {
    this._onKey = (e) => {
      if (e.code === INTERACT_KEY && this._isNearPlayer && !this._questDone) {
        if (!this._dialogueOpen) this._openDialogue()
      }
    }
    window.addEventListener('keydown', this._onKey)
  }

  // — Gọi mỗi frame từ Game.js ————————————————————————————
  update(playerPos, time) {
    // Update animation
    if (this._mixer) {
      this._mixer.update(this._clock.getDelta())
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
