export class UIManager {
  constructor() {
    this.scoreEl  = document.getElementById('score-display')
    this.heightEl = document.getElementById('height-display')
    this.chargeEl = document.getElementById('charge-bar')
    this.fpsEl    = document.getElementById('fps-display')

    if (this.scoreEl)  this.scoreEl.style.display  = 'none'
    if (this.heightEl) this.heightEl.style.display = 'none'
    if (this.chargeEl?.parentElement) this.chargeEl.parentElement.style.display = 'none'

    this._lastTime = performance.now()
    this._fps      = 0
  }

  update(player, collectibles) {
    if (this.scoreEl) {
      this.scoreEl.textContent = `🍩 ${player.score} / ${collectibles?.total ?? 0}`
    }

    if (this.fpsEl) {
      const now = performance.now()
      const dt  = (now - this._lastTime) / 1000
      this._lastTime = now
      // Exponential moving average để tránh giật số
      this._fps = this._fps * 0.9 + (1 / dt) * 0.1
      this.fpsEl.textContent = `FPS: ${Math.round(this._fps)}`
    }
  }
}
