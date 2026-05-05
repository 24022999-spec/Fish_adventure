export class MainQuestPanel {
  constructor() {
    this._tasks = {
      spongebob: { label: 'Giúp SpongeBob', done: false },
      linh:      { label: 'Giúp Linh',      done: false },
      dat:       { label: 'Giúp Đạt',       done: false },
      hung:      { label: 'Giúp Hùng',      done: false },
    }
    this._panelVisible  = false
    this._khanhHintShown = false

    this._createBanner()
    this._createPanel()
    this._createKhanhHint()
  }

  // ── Banner "Hãy nói chuyện với Khánh" — góc PHẢI ───────────
  _createBanner() {
    this._banner = document.createElement('div')
    Object.assign(this._banner.style, {
      display:      'block',
      position:     'fixed',
      top:          '60px',
      right:        '16px',
      background:   'rgba(0,10,30,0.92)',
      border:       '1px solid #00ccff55',
      borderLeft:   '3px solid #00ccff',
      borderRadius: '8px',
      padding:      '10px 16px',
      color:        '#fff',
      fontFamily:   'sans-serif',
      fontSize:     '13px',
      fontWeight:   'bold',
      zIndex:       '510',
      boxShadow:    '0 4px 20px rgba(0,200,255,0.15)',
      opacity:      '0',
      transition:   'opacity 0.5s',
    })
    this._banner.innerHTML = `🎂 Hãy nói chuyện với <span style="color:#00ccff">Khánh</span>`
    document.body.appendChild(this._banner)

    setTimeout(() => { this._banner.style.opacity = '1' }, 1000)
  }

  hideBanner() {
    this._banner.style.opacity = '0'
    setTimeout(() => { this._banner.style.display = 'none' }, 500)
  }

  // ── Quest panel 4 nhiệm vụ ─────────────────────────────────
  _createPanel() {
    this._panel = document.createElement('div')
    Object.assign(this._panel.style, {
      display:      'none',
      position:     'fixed',
      top:          '60px',
      right:        '16px',
      background:   'rgba(10,15,30,0.92)',
      border:       '1px solid #00ccff33',
      borderLeft:   '3px solid #00ccff',
      borderRadius: '8px',
      padding:      '12px 16px',
      color:        '#fff',
      fontFamily:   'sans-serif',
      fontSize:     '13px',
      minWidth:     '220px',
      lineHeight:   '1.6',
      zIndex:       '510',
      opacity:      '0',
      transition:   'opacity 0.4s',
      boxShadow:    '0 0 20px rgba(0,200,255,0.12)',
    })
    document.body.appendChild(this._panel)
  }

  _renderPanel() {
    const allDone = this.allDone
    const rows = Object.values(this._tasks).map(t => `
      <div style="display:flex;align-items:center;gap:8px;padding:2px 0;
           color:${t.done ? '#88ff88' : '#ccc'}">
        <span style="font-size:14px;min-width:18px">${t.done ? '✅' : '☐'}</span>
        <span style="${t.done ? 'text-decoration:line-through;opacity:0.65' : ''}">${t.label}</span>
      </div>
    `).join('')

    this._panel.innerHTML = `
      <div style="font-size:10px;text-transform:uppercase;letter-spacing:1.5px;
           color:#00ccff;margin-bottom:6px">🎂 Sinh nhật Khánh</div>
      <div style="font-weight:bold;margin-bottom:10px;font-size:13px;color:#eee">
        Hãy giúp mọi người chuẩn bị
      </div>
      ${rows}
    `
  }

  // ── Banner gợi ý quay lại Khánh sau khi all done ───────────
  _createKhanhHint() {
    this._khanhHint = document.createElement('div')
    Object.assign(this._khanhHint.style, {
      display:      'none',
      position:     'fixed',
      top:          '60px',
      right:        '16px',
      background:   'rgba(10,30,10,0.95)',
      border:       '1px solid #88ff8855',
      borderLeft:   '3px solid #88ff88',
      borderRadius: '8px',
      padding:      '10px 16px',
      color:        '#fff',
      fontFamily:   'sans-serif',
      fontSize:     '13px',
      fontWeight:   'bold',
      zIndex:       '511',
      boxShadow:    '0 0 20px rgba(100,255,100,0.15)',
      opacity:      '0',
      transition:   'opacity 0.5s',
    })
    this._khanhHint.innerHTML = `🎉 Hãy nói với <span style="color:#88ff88">Khánh</span> mọi người đã sẵn sàng!`
    document.body.appendChild(this._khanhHint)
  }

  showKhanhHint() {
    if (this._khanhHintShown) return
    this._khanhHintShown = true
    // Ẩn panel nhiệm vụ, hiện hint
    this._panel.style.opacity = '0'
    setTimeout(() => {
      this._panel.style.display = 'none'
      this._khanhHint.style.display = 'block'
      requestAnimationFrame(() => { this._khanhHint.style.opacity = '1' })
    }, 400)
  }

  hideKhanhHint() {
    this._khanhHint.style.opacity = '0'
    setTimeout(() => { this._khanhHint.style.display = 'none' }, 500)
  }

  onKhanhAccepted() {
    this.hideBanner()
    this._panelVisible = true
    this._renderPanel()
    this._panel.style.display = 'block'
    requestAnimationFrame(() => { this._panel.style.opacity = '1' })
  }

  completeTask(key) {
    if (!this._tasks[key] || this._tasks[key].done) return
    this._tasks[key].done = true
    if (this._panelVisible) this._renderPanel()
  }

  get allDone() {
    return Object.values(this._tasks).every(t => t.done)
  }
}
