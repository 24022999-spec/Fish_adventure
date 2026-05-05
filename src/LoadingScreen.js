import * as THREE from 'three'

export class LoadingScreen {
  constructor() {
    this._resolve = null
    this._promise = new Promise(r => { this._resolve = r })
    this._fill    = null
    this._label   = null
    this._el      = null
    this._done    = false
    this._build()
    this._hook()
  }

  _build() {
    const fontUrl = import.meta.env.BASE_URL + 'PixelViet.ttf'
    const style = document.createElement('style')
    style.textContent = `
      @font-face {
        font-family: 'PixelViet';
        src: url('${fontUrl}') format('truetype');
      }
      #ls-root {
        position: fixed; inset: 0; z-index: 9999;
        background: #5bc8e8;
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        transition: opacity 0.5s ease;
      }
      @keyframes ls-rotate { to { transform: rotate(360deg); } }
      #ls-spinner {
        position: relative; width: 80px; height: 80px;
        margin-bottom: 36px;
        animation: ls-rotate 1.2s linear infinite;
      }
      #ls-wrap { display: flex; flex-direction: column; align-items: center; gap: 10px; }
      #ls-label {
        color: #fff; font-size: 14px; font-weight: bold;
        letter-spacing: 2px; font-family: 'PixelViet', sans-serif;
      }
      #ls-track {
        width: 220px; height: 14px;
        background: rgba(255,255,255,0.35);
        border-radius: 7px; overflow: hidden;
      }
      #ls-fill {
        height: 100%; width: 0%;
        background: #fff; border-radius: 7px;
        transition: width 0.15s ease;
      }
      #ls-subtitle {
        margin-top: 20px;
        color: rgba(255,255,255,0.85); font-size: 13px;
        font-family: 'PixelViet', sans-serif;
        text-align: center; line-height: 1.6;
      }
    `
    document.head.appendChild(style)

    const root = document.createElement('div')
    root.id = 'ls-root'

    // Circular dot spinner — fades from opaque to transparent
    const spinner = document.createElement('div')
    spinner.id = 'ls-spinner'
    const N = 8
    for (let i = 0; i < N; i++) {
      const ang  = (i / N) * Math.PI * 2
      const r    = 28
      const cx   = 40 + Math.sin(ang) * r
      const cy   = 40 - Math.cos(ang) * r
      const size = Math.max(4, 10 - (i / N) * 6)
      const op   = (1 - (i / N) * 0.85).toFixed(2)
      const dot  = document.createElement('div')
      dot.style.cssText = `position:absolute;border-radius:50%;background:rgba(255,255,255,${op});width:${size}px;height:${size}px;left:${(cx - size / 2).toFixed(1)}px;top:${(cy - size / 2).toFixed(1)}px;`
      spinner.appendChild(dot)
    }

    const wrap = document.createElement('div')
    wrap.id = 'ls-wrap'
    wrap.innerHTML = `
      <div id="ls-label">Loading</div>
      <div id="ls-track"><div id="ls-fill"></div></div>
      <div id="ls-subtitle">Chờ một tí nhé, sắp xong ùi &lt;3</div>
    `

    root.appendChild(spinner)
    root.appendChild(wrap)
    document.body.appendChild(root)

    this._el    = root
    this._fill  = root.querySelector('#ls-fill')
    this._label = root.querySelector('#ls-label')
  }

  _hook() {
    const mgr = THREE.DefaultLoadingManager
    mgr.onProgress = (_url, loaded, total) => {
      if (total > 0) this._setProgress(Math.floor((loaded / total) * 100))
    }
    mgr.onLoad = () => {
      if (this._done) return
      this._done = true
      this._setProgress(100)
      setTimeout(() => this._hide(), 400)
    }
    mgr.onError = () => {}
  }

  _setProgress(pct) {
    if (this._fill)  this._fill.style.width  = pct + '%'
    if (this._label) this._label.textContent = `Loading ${pct}%`
  }

  _hide() {
    this._el.style.opacity = '0'
    setTimeout(() => { this._el.remove(); this._resolve() }, 500)
  }

  get ready() { return this._promise }
}
