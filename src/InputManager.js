// Tách riêng để dễ thêm gamepad/touch sau này
export class InputManager {
  constructor() {
    this.keys = {}
    window.addEventListener('keydown', e => {
      this.keys[e.code] = true
      const gameKeys = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
      if (gameKeys.includes(e.code)) e.preventDefault()
    })
    window.addEventListener('keyup', e => {
      this.keys[e.code] = false
    })
  }

  isDown(code) { return !!this.keys[code] }

  // Hỗ trợ cả WASD lẫn Arrow keys
  get left()  { return this.isDown('KeyA') || this.isDown('ArrowLeft') }
  get right() { return this.isDown('KeyD') || this.isDown('ArrowRight') }
  get up()    { return this.isDown('KeyW') || this.isDown('ArrowUp') }
  get down()  { return this.isDown('KeyS') || this.isDown('ArrowDown') }
}