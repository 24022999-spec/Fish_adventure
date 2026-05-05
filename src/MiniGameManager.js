import * as THREE from 'three'
import { assetUrl } from './assetUrl.js'

// ================================================================
// MiniGameManager — Generic iframe overlay cho mọi minigame
//
// Options:
//   url    — đường dẫn tới index.html của minigame
//   bgmUrl — đường dẫn tới file nhạc nền
//   title  — tiêu đề hiển thị trên header
// ================================================================

export class MiniGameManager {
  constructor(mainRenderer, onComplete, onExit, {
    pauseMainBgm,
    resumeMainBgm,
    url    = '/minigame1/index.html',
    bgmUrl = '/minigame1/bgm1.mp3',
    title  = 'Nhiệm vụ: Vượt qua con đường nguy hiểm',
  } = {}) {
    this.mainRenderer   = mainRenderer
    this.onComplete     = onComplete
    this.onExit         = onExit
    this._pauseMainBgm  = pauseMainBgm  || null
    this._resumeMainBgm = resumeMainBgm || null
    this._url           = url
    this._bgmUrl        = bgmUrl
    this._title         = title
    this._isOpen        = false
    this._overlay       = null
    this._iframe        = null
    this._bgm           = null

    this._createOverlay()
    this._listenMessages()
  }

  // — Tạo overlay + iframe ————————————————————————————————————
  _createOverlay() {
    this._overlay = document.createElement('div')
    Object.assign(this._overlay.style, {
      display:        'none',
      position:       'fixed',
      inset:          '0',
      zIndex:         '2000',
      background:     'rgba(0,0,0,0.0)',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
    })

    // Header bar
    const header = document.createElement('div')
    Object.assign(header.style, {
      position:       'fixed',
      top:            '0',
      left:           '0',
      right:          '0',
      height:         '44px',
      background:     'rgba(0,10,30,0.95)',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'space-between',
      padding:        '0 16px',
      zIndex:         '2001',
      borderBottom:   '2px solid #00ccff',
    })
    header.innerHTML = `
      <div style="color:#00ccff;font-family:sans-serif;font-size:14px;font-weight:bold">
        🎮 ${this._title}
      </div>
      <div style="display:flex;align-items:center;gap:10px">
        <span style="color:#aaa;font-family:sans-serif;font-size:12px">
          ESC = Bỏ nhiệm vụ
        </span>
        <button class="mg-exit-btn" style="
          background:transparent;border:1px solid #666;
          color:#ccc;padding:4px 12px;border-radius:6px;
          cursor:pointer;font-size:12px;font-family:sans-serif">
          ✕ Thoát
        </button>
      </div>
    `

    // iframe chứa minigame
    this._iframe = document.createElement('iframe')
    Object.assign(this._iframe.style, {
      position:   'fixed',
      top:        '44px',
      left:       '0',
      right:      '0',
      bottom:     '0',
      width:      '100%',
      height:     'calc(100% - 44px)',
      border:     'none',
      background: '#000',
    })
    this._iframe.setAttribute('allow', 'pointer-lock *')
    this._iframe.setAttribute('allowfullscreen', '')

    this._overlay.appendChild(header)
    this._overlay.appendChild(this._iframe)
    document.body.appendChild(this._overlay)

    // Dùng querySelector trên header để tránh xung đột khi có nhiều instance
    header.querySelector('.mg-exit-btn')?.addEventListener('click', () => {
      this._exitMinigame(false)
    })
  }

  // — Lắng nghe message từ minigame (postMessage) ——————————————
  _listenMessages() {
    this._msgHandler = (e) => {
      if (!this._isOpen) return
      if (e.data?.type === 'MINIGAME_WIN') {
        this._exitMinigame(true)
      }
    }
    window.addEventListener('message', this._msgHandler)

    // ESC = thoát không tính; L = skip và tính hoàn thành
    this._escHandler = (e) => {
      if (!this._isOpen) return
      if (e.code === 'Escape') this._exitMinigame(false)
      if (e.code === 'KeyL')   this._exitMinigame(true)
    }
    window.addEventListener('keydown', this._escHandler)
  }

  // — Mở minigame ————————————————————————————————————————————
  open() {
    if (this._isOpen) return
    this._isOpen = true

    if (document.pointerLockElement) document.exitPointerLock()

    this._pauseMainBgm?.()

    this._iframe.src = assetUrl(this._url)

    if (!this._bgm) {
      this._bgm = new Audio(assetUrl(this._bgmUrl))
      this._bgm.loop = true
    }
    this._bgm.currentTime = 0
    this._bgm.play().catch(() => {})

    this._overlay.style.display = 'flex'
    this._overlay.style.opacity = '0'
    this._overlay.style.transition = 'opacity 0.3s'
    requestAnimationFrame(() => { this._overlay.style.opacity = '1' })

    setTimeout(() => this._iframe.focus(), 100)
  }

  // — Đóng minigame ——————————————————————————————————————————
  _exitMinigame(isWin) {
    if (!this._isOpen) return

    this._overlay.style.opacity = '0'

    if (this._bgm) {
      this._bgm.pause()
      this._bgm.currentTime = 0
    }
    this._resumeMainBgm?.()

    setTimeout(() => {
      this._isOpen = false
      this._overlay.style.display = 'none'
      this._iframe.src = 'about:blank'

      if (isWin) {
        this.onComplete?.()
      } else {
        this.onExit?.()
      }
    }, 300)
  }

  get isOpen() { return this._isOpen }

  destroy() {
    window.removeEventListener('message', this._msgHandler)
    window.removeEventListener('keydown', this._escHandler)
    this._overlay?.remove()
  }
}
