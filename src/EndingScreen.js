// Đăng ký font PixelViet một lần
import { assetUrl } from './assetUrl.js'

const _style = document.createElement('style')
_style.textContent = `@font-face{font-family:'PixelViet';src:url('${assetUrl('/PixelViet.ttf')}') format('truetype');}`
document.head.appendChild(_style)

export class EndingScreen {
  constructor() {
    this._triggered = false
    this._el        = null
    this._imgEl     = null
    this._titleEl   = null
    this._subtitleEl= null
    this._createDOM()
  }

  _createDOM() {
    this._el = document.createElement('div')
    Object.assign(this._el.style, {
      display:        'none',
      position:       'fixed',
      inset:          '0',
      background:     '#000',
      zIndex:         '9999',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      opacity:        '0',
      transition:     'opacity 1s ease',
      fontFamily:     "'PixelViet', monospace",
      color:          '#fff',
      textAlign:      'center',
      padding:        '24px',
    })

    this._imgEl = document.createElement('img')
    Object.assign(this._imgEl.style, {
      maxWidth:     '700px',
      maxHeight:    '55vh',
      width:        '100%',
      objectFit:    'contain',
      border:       '4px solid rgb(255, 255, 255)',
      borderRadius: '12px',
      marginBottom: '28px',
    })

    this._titleEl = document.createElement('div')
    Object.assign(this._titleEl.style, {
      fontSize:   'clamp(28px,5vw,52px)',
      fontWeight: 'bold',
      marginBottom: '12px',
      letterSpacing: '2px',
    })

    this._subtitleEl = document.createElement('div')
    Object.assign(this._subtitleEl.style, {
      fontSize:   'clamp(18px,2.8vw,28px)',
      fontFamily: "'PixelViet', monospace",
      opacity:    '0.9',
      lineHeight: '1.5',
    })

    this._el.appendChild(this._imgEl)
    this._el.appendChild(this._titleEl)
    this._el.appendChild(this._subtitleEl)
    document.body.appendChild(this._el)
  }

  _typewriter(text, delay = 1200, speed = 70) {
    this._subtitleEl.textContent = ''
    clearTimeout(this._typeTimer)
    const tick = (i) => {
      if (i >= text.length) return
      this._subtitleEl.textContent += text.charAt(i)
      this._typeTimer = setTimeout(() => tick(i + 1), speed)
    }
    setTimeout(() => tick(0), delay)
  }

  show(type) {
    if (this._triggered) return
    this._triggered = true

    if (type === 'happy') {
      this._imgEl.src           = assetUrl('/Happy.png')
      this._titleEl.textContent  = '🎉 HAPPY ENDING!'
      this._titleEl.style.color  = '#ffd700'
      this._typewriter('Sinh nhật vui vẻ Khánh ơi!!')
    } else {
      this._imgEl.src           = assetUrl('/Sashimi.png')
      this._titleEl.textContent  = 'SASHIMI ENDING...'
      this._titleEl.style.color  = '#ff6b6b'
      this._typewriter('Có những con cá sẽ phải chả cá')
    }

    this._el.style.display = 'flex'
    requestAnimationFrame(() => { this._el.style.opacity = '1' })
  }

  get triggered() { return this._triggered }
}
