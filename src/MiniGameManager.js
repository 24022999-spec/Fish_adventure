import * as THREE from 'three'

// ================================================================
// MiniGameManager — Nhúng minigame "Con cá qua đường" vào game chính
//
// Cách hoạt động:
//   1. Khi quest được nhận → tạo iframe overlay
//   2. iframe load minigame (đã được port thành module)
//   3. Minigame communicate với game chính qua window.postMessage
//   4. Khi win → đóng iframe → trả về quest complete
//   5. Khi ESC → đóng iframe → quest không tính
//
// Minigame cần được đặt ở: /minigame1/index.html
// (copy thư mục Con-ca-qua-duong-master vào public/minigame1/)
// ================================================================

export class MiniGameManager {
  constructor(mainRenderer, onComplete, onExit, { pauseMainBgm, resumeMainBgm } = {}) {
    this.mainRenderer   = mainRenderer
    this.onComplete     = onComplete  // callback khi thắng
    this.onExit         = onExit      // callback khi thoát (ESC)
    this._pauseMainBgm  = pauseMainBgm  || null
    this._resumeMainBgm = resumeMainBgm || null
    this._isOpen        = false
    this._overlay       = null
    this._iframe        = null
    this._bgm           = null

    this._createOverlay()
    this._listenMessages()
  }

  // — Tạo overlay + iframe ————————————————————————————————————
  _createOverlay() {
    // Nền mờ
    this._overlay = document.createElement('div')
    this._overlay.id = 'minigame-overlay'
    Object.assign(this._overlay.style, {
      display:    'none',
      position:   'fixed',
      inset:      '0',
      zIndex:     '2000',
      background: 'rgba(0,0,0,0.0)',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    })

    // Header bar
    const header = document.createElement('div')
    Object.assign(header.style, {
      position:   'fixed',
      top:        '0',
      left:       '0',
      right:      '0',
      height:     '44px',
      background: 'rgba(0,10,30,0.95)',
      display:    'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding:    '0 16px',
      zIndex:     '2001',
      borderBottom: '2px solid #00ccff',
    })
    header.innerHTML = `
      <div style="color:#00ccff;font-family:sans-serif;font-size:14px;font-weight:bold">
        🎮 Nhiệm vụ: Vượt qua con đường nguy hiểm
      </div>
      <div style="display:flex;align-items:center;gap:10px">
        <span style="color:#aaa;font-family:sans-serif;font-size:12px">
          ESC = Bỏ nhiệm vụ
        </span>
        <button id="mg-exit-btn" style="
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
    // Cho phép pointer lock bên trong iframe
    this._iframe.setAttribute('allow', 'pointer-lock *')
    this._iframe.setAttribute('allowfullscreen', '')

    this._overlay.appendChild(header)
    this._overlay.appendChild(this._iframe)
    document.body.appendChild(this._overlay)

    // Exit button
    document.getElementById('mg-exit-btn')?.addEventListener('click', () => {
      this._exitMinigame(false)
    })
  }

  // — Lắng nghe message từ minigame (postMessage) ——————————————
  _listenMessages() {
    this._msgHandler = (e) => {
      // Chỉ nhận message từ cùng origin
      if (e.data?.type === 'MINIGAME_WIN') {
        this._exitMinigame(true)
      }
      if (e.data?.type === 'MINIGAME_RESTART') {
        // Player restart — không làm gì, game tự chạy tiếp
      }
    }
    window.addEventListener('message', this._msgHandler)

    // ESC handler (khi iframe không có focus)
    this._escHandler = (e) => {
      if (e.code === 'Escape' && this._isOpen) {
        this._exitMinigame(false)
      }
    }
    window.addEventListener('keydown', this._escHandler)
  }

  // — Mở minigame ————————————————————————————————————————————
  open() {
    if (this._isOpen) return
    this._isOpen = true

    // Pause pointer lock của game chính
    if (document.pointerLockElement) {
      document.exitPointerLock()
    }

    // Tạm dừng BGM chính
    this._pauseMainBgm?.()

    // Load minigame vào iframe từ public/minigame1/index.html
    this._iframe.src = '/minigame1/index.html'

    // Phát BGM của minigame1
    if (!this._bgm) {
      this._bgm = new Audio('/minigame1/bgm1.mp3')
      this._bgm.loop = true
    }
    this._bgm.currentTime = 0
    this._bgm.play().catch(() => {})

    this._overlay.style.display = 'flex'

    // Transition mượt
    this._overlay.style.opacity = '0'
    this._overlay.style.transition = 'opacity 0.3s'
    requestAnimationFrame(() => {
      this._overlay.style.opacity = '1'
    })

    // Focus iframe để nhận keyboard
    setTimeout(() => this._iframe.focus(), 100)

    console.log('[MiniGame] Opened')
  }

  // — Đóng minigame ——————————————————————————————————————————
  _exitMinigame(isWin) {
    if (!this._isOpen) return

    this._overlay.style.opacity = '0'

    // Dừng BGM minigame và khôi phục BGM chính
    if (this._bgm) {
      this._bgm.pause()
      this._bgm.currentTime = 0
    }
    this._resumeMainBgm?.()

    setTimeout(() => {
      this._isOpen = false
      this._overlay.style.display = 'none'
      this._iframe.src = 'about:blank'  // unload minigame

      if (isWin) {
        console.log('[MiniGame] Player WON ✓')
        this.onComplete?.()
      } else {
        console.log('[MiniGame] Player exited')
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
