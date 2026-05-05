import * as THREE from 'three'
import { Game } from './Game.js'
import { assetUrl } from './assetUrl.js'
import { LoadingScreen } from './LoadingScreen.js'

// ── START SCREEN với background Three.js ──────────────────────
const container   = document.getElementById('start-canvas-container')
const startScreen = document.getElementById('start-screen')
const menuContainer = document.getElementById('menu-container')
const introPopup  = document.getElementById('intro-popup')
const closeBtn    = document.getElementById('close-btn')
const introBtn    = document.getElementById('intro-btn')
const startBtn    = document.getElementById('start-btn')

// Render background ảnh bằng Three.js (giống UI gốc)
const bgScene    = new THREE.Scene()
const bgCamera   = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
bgCamera.position.z = 5

const bgRenderer = new THREE.WebGLRenderer({ antialias: true })
bgRenderer.setPixelRatio(window.devicePixelRatio)
bgRenderer.setSize(window.innerWidth, window.innerHeight)
container.appendChild(bgRenderer.domElement)

const texLoader = new THREE.TextureLoader()
const bgTex     = texLoader.load(assetUrl('/start-screen.png'))
bgTex.colorSpace = THREE.SRGBColorSpace

const dist      = 10
const vFov      = (bgCamera.fov * Math.PI) / 180
let   planeH    = 2 * Math.tan(vFov / 2) * dist
let   planeW    = planeH * bgCamera.aspect
const bgGeo     = new THREE.PlaneGeometry(planeW, planeH)
const bgMat     = new THREE.MeshBasicMaterial({ map: bgTex, side: THREE.DoubleSide })
const bgMesh    = new THREE.Mesh(bgGeo, bgMat)
bgMesh.position.z = -5
bgScene.add(bgMesh)

// Animate background
let bgAnimId
function animateBg() {
  bgAnimId = requestAnimationFrame(animateBg)
  bgRenderer.render(bgScene, bgCamera)
}
animateBg()

// Resize handler cho start screen
window.addEventListener('resize', () => {
  bgCamera.aspect = window.innerWidth / window.innerHeight
  bgCamera.updateProjectionMatrix()
  bgRenderer.setSize(window.innerWidth, window.innerHeight)

  const newH = 2 * Math.tan(vFov / 2) * dist
  const newW = newH * bgCamera.aspect
  bgMesh.geometry.dispose()
  bgMesh.geometry = new THREE.PlaneGeometry(newW, newH)
})

// ── Nút INTRODUCTION ─────────────────────────────────────────
introBtn.addEventListener('click', () => {
  introPopup.style.display = 'block'
})
closeBtn.addEventListener('click', () => {
  introPopup.style.display = 'none'
})

// ── Nút START ────────────────────────────────────────────────
startBtn.addEventListener('click', () => {
  startScreen.style.transition = 'opacity 0.5s'
  startScreen.style.opacity    = '0'

  setTimeout(() => {
    cancelAnimationFrame(bgAnimId)
    bgRenderer.dispose()
    startScreen.style.display = 'none'

    // Hiện loading screen, tạo game (kích hoạt tất cả loader)
    const loadingScreen = new LoadingScreen()
    const game = new Game()

    // Khi toàn bộ asset load xong → hiện HUD và bắt đầu game
    loadingScreen.ready.then(() => {
      document.getElementById('hud').style.display = 'block'
      document.getElementById('charge-wrap').style.display = 'flex'
      game.start()
    })
  }, 500)
})