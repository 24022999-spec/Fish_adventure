import { assetUrl } from './assetUrl.js'

export class AudioManager {
  constructor() {
    this._ctx           = null
    this._collectBuffer = null
    this._collectGain   = 0.5

    // BGM dùng HTML Audio (streaming, loop dài)
    this._bgm         = new Audio(assetUrl('/assets/sounds/bgm.mp3'))
    this._bgm.loop    = true
    this._bgm.volume  = 0.3
    this._bgm.preload = 'auto'
    this._bgm.load()

    this._bubbles         = new Audio(assetUrl('/assets/sounds/bubbles.mp3'))
    this._bubbles.volume  = 0.5
    this._bubbles.preload = 'auto'
    this._bubbles.load()

    // Unlock AudioContext + preload collect buffer ngay khi user tương tác lần đầu
    const unlock = () => {
      if (this._ctx) return
      this._ctx = new (window.AudioContext || window.webkitAudioContext)()
      this._loadCollectBuffer()
      window.removeEventListener('keydown',      unlock)
      window.removeEventListener('pointerdown',  unlock)
    }
    window.addEventListener('keydown',     unlock)
    window.addEventListener('pointerdown', unlock)
  }

  _loadCollectBuffer() {
    fetch(assetUrl('/assets/sounds/collect.mp3'))
      .then(r  => r.arrayBuffer())
      .then(ab => this._ctx.decodeAudioData(ab))
      .then(buf => { this._collectBuffer = buf })
      .catch(() => {})
  }

  playBGM() {
    if (this._bgm.paused) this._bgm.play().catch(() => {})
  }

  stopBGM() {
    this._bgm.pause()
    this._bgm.currentTime = 0
  }

  pauseBGM() {
    this._bgm.pause()
  }

  resumeBGM() {
    if (this._bgm.paused) this._bgm.play().catch(() => {})
  }

  // Zero-latency collect sound via Web Audio API
  playCollect() {
    if (this._ctx && this._collectBuffer) {
      const src  = this._ctx.createBufferSource()
      src.buffer = this._collectBuffer
      const gain = this._ctx.createGain()
      gain.gain.value = this._collectGain
      src.connect(gain)
      gain.connect(this._ctx.destination)
      src.start(0)
    }
  }

  playBubbles() {
    this._bubbles.currentTime = 0
    this._bubbles.play().catch(() => {})
  }
}
