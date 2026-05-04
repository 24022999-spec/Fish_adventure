import * as THREE from 'three'

export class ThirdPersonCamera {
  constructor(camera, target, renderer) {
    this.camera   = camera
    this.target   = target
    this.renderer = renderer

    this._yaw     = 0
    this._pitch   = -0.3
    this._dist    = 10

    this._minPitch = -Math.PI / 2.5
    this._maxPitch =  Math.PI / 4

    this._isLocked = false

    this._setupPointerLock()
  }

  _setupPointerLock() {
    const canvas = this.renderer.domElement
    this._dialogueMode = false

    canvas.addEventListener('click', () => {
      if (!this._dialogueMode) canvas.requestPointerLock()
    })

    document.addEventListener('pointerlockchange', () => {
      this._isLocked = document.pointerLockElement === canvas
      if (!this._dialogueMode) {
        this._overlay.style.display = this._isLocked ? 'none' : 'flex'
      }
    })

    document.addEventListener('mousemove', (e) => {
      if (!this._isLocked) return
      this._yaw   -= e.movementX * 0.002
      this._pitch -= e.movementY * 0.002
      this._pitch  = Math.max(this._minPitch, Math.min(this._maxPitch, this._pitch))
    })

    canvas.addEventListener('wheel', (e) => {
      this._dist += e.deltaY * 0.01
      this._dist  = Math.max(3, Math.min(20, this._dist))
    })

    this._createOverlay()
  }

  _createOverlay() {
    this._overlay = document.createElement('div')
    Object.assign(this._overlay.style, {
      position:       'fixed',
      inset:          '0',
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      background:     'rgba(0,0,0,0.6)',
      color:          '#fff',
      fontFamily:     'sans-serif',
      zIndex:         '999',
      cursor:         'pointer',
    })
    this._overlay.innerHTML = `
      <div style="font-size:48px;margin-bottom:16px">🐟</div>
      <div style="font-size:24px;font-weight:bold;margin-bottom:12px">Darwin's Adventure</div>
      <div style="font-size:16px;opacity:0.8;margin-bottom:8px">Click để bắt đầu chơi</div>
      <div style="font-size:13px;opacity:0.6;text-align:center;line-height:1.8">
        🖱️ Di chuyển chuột → xoay camera<br>
        WASD → bơi theo hướng nhìn<br>
        Scroll → zoom in/out<br>
        ESC → tạm dừng
      </div>
    `
    document.body.appendChild(this._overlay)

    this._overlay.addEventListener('click', () => {
      if (!this._dialogueMode) this.renderer.domElement.requestPointerLock()
    })
  }

  getForward() {
    return new THREE.Vector3(
      -Math.sin(this._yaw), 0, -Math.cos(this._yaw)
    ).normalize()
  }

  getForward3D() {
    return new THREE.Vector3(
      -Math.sin(this._yaw) * Math.cos(this._pitch),
       Math.sin(this._pitch),
      -Math.cos(this._yaw) * Math.cos(this._pitch)
    ).normalize()
  }

  getRight() {
    const fwd = this.getForward()
    return new THREE.Vector3(-fwd.z, 0, fwd.x).normalize()
  }

  setDialogueMode(active) {
    this._dialogueMode = active
    if (active) {
      document.exitPointerLock()
      this._overlay.style.display = 'none'
    }
  }

  get yaw() { return this._yaw }

  update() {
    const pos  = this.target.position
    const camX = pos.x + this._dist * Math.sin(this._yaw) * Math.cos(this._pitch)
    const camY = pos.y - this._dist * Math.sin(this._pitch)
    const camZ = pos.z + this._dist * Math.cos(this._yaw) * Math.cos(this._pitch)

    this.camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.1)
    this.camera.lookAt(pos.x, pos.y, pos.z)
  }

  destroy() {
    if (this._overlay) document.body.removeChild(this._overlay)
  }
}
