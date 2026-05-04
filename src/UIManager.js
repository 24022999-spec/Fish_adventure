export class UIManager {
  constructor() {
    this.scoreEl  = document.getElementById('score-display')
    this.heightEl = document.getElementById('height-display')
    this.chargeEl = document.getElementById('charge-bar')
    this.coordEl  = document.getElementById('coord-display')

    // Ẩn các UI không còn dùng trong gameplay mới
    if (this.heightEl) this.heightEl.style.display = 'none'
    if (this.chargeEl?.parentElement) this.chargeEl.parentElement.style.display = 'none'
  }

  update(player, collectibles) {
    if (this.scoreEl) {
      this.scoreEl.textContent = `🍩 ${player.score} / ${collectibles?.total ?? 0}`
    }

    if (this.coordEl) {
      const p = player.position
      this.coordEl.textContent =
        `X: ${p.x.toFixed(1)}   Y: ${p.y.toFixed(1)}   Z: ${p.z.toFixed(1)}`
    }
  }
}
