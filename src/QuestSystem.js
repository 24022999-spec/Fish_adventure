import * as THREE from 'three'
import { QuestGiver }       from './QuestGiver.js'
import { MiniGameManager }  from './MiniGameManager.js'

// ================================================================
// QuestSystem — Layer kết nối Game chính → QuestGiver → MiniGame
//
// Cách dùng trong Game.js:
//   this.questSystem = new QuestSystem(this.scene, this.renderer)
//
//   // Trong _loop():
//   this.questSystem.update(this.player.position, time)
//
// Quest states:
//   IDLE     → player chưa gặp Linh
//   TALKING  → dialogue đang mở
//   ACTIVE   → đang chơi minigame
//   DONE     → hoàn thành nhiệm vụ
// ================================================================

export const QUEST_STATE = {
  IDLE:    'IDLE',
  TALKING: 'TALKING',
  ACTIVE:  'ACTIVE',
  DONE:    'DONE',
}

export class QuestSystem {
  constructor(scene, renderer, audio = null, camera = null, thirdCam = null, onDialogueStart = null, onDialogueEnd = null, onQuestComplete = null) {
    this.scene           = scene
    this.renderer        = renderer
    this.audio           = audio
    this.onQuestComplete = onQuestComplete
    this.state           = QUEST_STATE.IDLE

    // Vị trí đặt Linh — tâm đáy biển (SEA_FLOOR_Y = -25)
    const linghPos = new THREE.Vector3(-7.8, -22, -10.8)

    // Khởi tạo QuestGiver
    this.questGiver = new QuestGiver(
      scene,
      linghPos,
      () => this._onQuestAccepted(),
      camera,
      thirdCam,
      onDialogueStart,
      onDialogueEnd
    )

    // Khởi tạo MiniGameManager
    this.miniGame = new MiniGameManager(
      renderer,
      () => this._onMiniGameWin(),
      () => this._onMiniGameExit(),
      {
        pauseMainBgm:  () => this.audio?.pauseBGM(),
        resumeMainBgm: () => this.audio?.resumeBGM(),
      }
    )

    // HUD thông báo quest
    this._createQuestHUD()
  }

  // — Callbacks ————————————————————————————————————————————

  _onQuestAccepted() {
    this.state = QUEST_STATE.ACTIVE
    this._showQuestHUD('🎯 Nhiệm vụ đang thực hiện: Vượt qua con đường nguy hiểm')
    // Mở minigame sau 0.5s (để dialogue đóng mượt)
    setTimeout(() => this.miniGame.open(), 500)
  }

  _onMiniGameWin() {
    this.state = QUEST_STATE.DONE
    this.questGiver.markComplete()
    this.onQuestComplete?.()
    this._showQuestHUD('✅ Nhiệm vụ hoàn thành! Cảm ơn cậu đã giúp đỡ!')
    this._hudTimer = setTimeout(() => this._hideQuestHUD(), 3000)
    this._playCompletionEffect()
  }

  _onMiniGameExit() {
    this.state = QUEST_STATE.IDLE
    this._showQuestHUD('⚠️ Nhiệm vụ bị bỏ dở. Hãy nói chuyện với Linh để thử lại.')
    setTimeout(() => this._hideQuestHUD(), 4000)
  }

  // — Quest HUD ————————————————————————————————————————————
  _createQuestHUD() {
    this._hud = document.createElement('div')
    this._hud.id = 'quest-hud'
    Object.assign(this._hud.style, {
      display:      'none',
      position:     'fixed',
      top:          '60px',
      right:        '16px',
      background:   'rgba(0,10,30,0.85)',
      border:       '1px solid #00ccff55',
      borderLeft:   '3px solid #00ccff',
      borderRadius: '8px',
      padding:      '10px 14px',
      color:        '#fff',
      fontFamily:   'sans-serif',
      fontSize:     '13px',
      maxWidth:     '260px',
      lineHeight:   '1.5',
      zIndex:       '500',
      transition:   'opacity 0.3s',
    })
    document.body.appendChild(this._hud)
  }

  _showQuestHUD(text, persistent = false) {
    this._hud.textContent = text
    this._hud.style.display = 'block'
    this._hud.style.opacity = '1'
    if (this._hudTimer) clearTimeout(this._hudTimer)
    if (!persistent) {
      this._hudTimer = setTimeout(() => this._hideQuestHUD(), 6000)
    }
  }

  _hideQuestHUD() {
    this._hud.style.opacity = '0'
    setTimeout(() => { this._hud.style.display = 'none' }, 300)
  }

  // — Hiệu ứng hoàn thành quest ————————————————————————————
  _playCompletionEffect() {
    // Tạo particles vàng tại vị trí Linh
    const geo = new THREE.SphereGeometry(0.1, 4, 4)
    const mat = new THREE.MeshBasicMaterial({ color: 0xffd700 })
    const particles = []

    for (let i = 0; i < 20; i++) {
      const p = new THREE.Mesh(geo, mat)
      p.position.copy(this.questGiver.position)
      p.userData.vel = new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        Math.random() * 4 + 1,
        (Math.random() - 0.5) * 3
      )
      this.scene.add(p)
      particles.push(p)
    }

    let t = 0
    const anim = () => {
      t += 0.016
      particles.forEach(p => {
        p.position.addScaledVector(p.userData.vel, 0.016)
        p.userData.vel.y -= 0.05
        p.material.opacity = 1 - t / 2
        p.material.transparent = true
      })
      if (t < 2) requestAnimationFrame(anim)
      else particles.forEach(p => this.scene.remove(p))
    }
    requestAnimationFrame(anim)
  }

  // — Update (gọi mỗi frame) ————————————————————————————————
  update(playerPos, time) {
    // Không update QuestGiver khi minigame đang mở
    if (!this.miniGame.isOpen) {
      this.questGiver.update(playerPos, time)
    }
  }

  get isMinigameOpen()  { return this.miniGame.isOpen }
  get isDialogueOpen()  { return this.questGiver.isDialogueOpen }

  destroy() {
    this.questGiver.destroy()
    this.miniGame.destroy()
    this._hud?.remove()
  }
}
