export class Minimap {
  constructor(player, collectibles, mapSize) {
    this.player       = player
    this.collectibles = collectibles
    this.mapSize      = mapSize

    this.size   = 180
    this.canvas = document.createElement('canvas')
    this.canvas.width  = this.size
    this.canvas.height = this.size
    this.ctx    = this.canvas.getContext('2d')

    // Offscreen canvas for donut dots — only redrawn when count changes
    this._donutCanvas = document.createElement('canvas')
    this._donutCanvas.width  = this.size
    this._donutCanvas.height = this.size
    this._donutCtx    = this._donutCanvas.getContext('2d')
    this._lastDonutCount = -1
    this._frame = 0

    Object.assign(this.canvas.style, {
      position:      'fixed',
      bottom:        '20px',
      right:         '20px',
      width:         this.size + 'px',
      height:        this.size + 'px',
      borderRadius:  '50%',
      border:        '3px solid rgba(255,255,255,0.5)',
      background:    'rgba(0, 50, 80, 0.75)',
      pointerEvents: 'none',
      zIndex:        '100',
    })

    document.body.appendChild(this.canvas)
  }

  _worldToMap(x, z) {
    const half = this.mapSize
    const px = ((x + half) / (half * 2)) * this.size
    const py = ((z + half) / (half * 2)) * this.size
    return { px, py }
  }

  _redrawDonutLayer() {
    const ctx  = this._donutCtx
    const size = this.size
    ctx.clearRect(0, 0, size, size)
    ctx.fillStyle = '#ffd166'
    this.collectibles.donuts.forEach(d => {
      if (d.collected) return
      const { px, py } = this._worldToMap(d.position.x, d.position.z)
      ctx.beginPath()
      ctx.arc(px, py, 3, 0, Math.PI * 2)
      ctx.fill()
    })
  }

  update() {
    // Minimap doesn't need 60fps — redraw every 3 frames (~20fps)
    this._frame++
    if (this._frame % 3 !== 0) return

    const ctx  = this.ctx
    const size = this.size

    // Redraw static donut layer only when a donut is collected
    const donutCount = this.collectibles.remaining
    if (donutCount !== this._lastDonutCount) {
      this._redrawDonutLayer()
      this._lastDonutCount = donutCount
    }

    ctx.clearRect(0, 0, size, size)

    ctx.save()
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
    ctx.clip()

    ctx.fillStyle = 'rgba(0, 80, 120, 0.9)'
    ctx.fillRect(0, 0, size, size)

    // Composite pre-rendered donut layer
    ctx.drawImage(this._donutCanvas, 0, 0)

    // Player
    const pp = this.player.position
    const { px, py } = this._worldToMap(pp.x, pp.z)

    ctx.beginPath()
    ctx.arc(px, py, 6, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.fill()

    ctx.beginPath()
    ctx.arc(px, py, 3, 0, Math.PI * 2)
    ctx.fillStyle = '#ffffff'
    ctx.fill()

    ctx.restore()

    ctx.beginPath()
    ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'
    ctx.lineWidth   = 2
    ctx.stroke()

    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.font      = '10px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(
      `🍩 ${this.collectibles.collected}/${this.collectibles.total}`,
      size / 2,
      size - 8
    )
  }

  destroy() {
    document.body.removeChild(this.canvas)
  }
}
