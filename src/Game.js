import * as THREE from 'three'
import { RGBELoader }        from 'three/examples/jsm/loaders/RGBELoader.js'
import { GLTFLoader }        from 'three/examples/jsm/loaders/GLTFLoader.js'
import { assetUrl }          from './assetUrl.js'
import { ThirdPersonCamera } from './ThirdPersonCamera.js'
import { Player }            from './Player.js'
import { InputManager }      from './InputManager.js'
import { CollectibleManager} from './CollectibleManager.js'
import { UIManager }         from './UIManager.js'
import { AudioManager }      from './AudioManager.js'
import { ParticleSystem }    from './ParticleSystem.js'
import { SeaFloor }          from './SeaFloor.js'
import { SeaDecorations }    from './SeaDecorations.js'
import { Minimap }           from './Minimap.js'
import { MAP_SIZE }          from './constants.js'
import { QuestSystem }       from './QuestSystem.js'
import { CharacterManager }  from './CharacterManager.js'
import { MiniGameManager }   from './MiniGameManager.js'
import { MainQuestPanel }    from './MainQuestPanel.js'
import { EndingScreen }      from './EndingScreen.js'

export class Game {
  constructor() {
    // --- Renderer ---
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type    = THREE.PCFSoftShadowMap
    this.renderer.toneMapping       = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.0
    document.body.appendChild(this.renderer.domElement)

    // --- Scene ---
    this.scene = new THREE.Scene()

    // --- Camera ---
    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 500)
    this.camera.position.set(0, 5, 15)

    // --- HDR Skybox ---
    this._hdrTexture = null
    const rgbeLoader = new RGBELoader()
    rgbeLoader.load(assetUrl('/assets/textures/sky.hdr'), (hdrTexture) => {
      hdrTexture.mapping      = THREE.EquirectangularReflectionMapping
      this._hdrTexture        = hdrTexture
      this.scene.background   = hdrTexture
      this.scene.environment  = hdrTexture
    })

    this._underwaterBgColor = new THREE.Color()
    this._wasUnderwater     = null

    // --- Ánh sáng ---
    this._ambientLight = new THREE.AmbientLight(0xc8e8ff, 0.4)
    this.scene.add(this._ambientLight)

    this._sunLight = new THREE.DirectionalLight(0xfff5e0, 2.5)
    this._sunLight.position.set(60, 120, 40)
    this._sunLight.castShadow = true
    this._sunLight.shadow.mapSize.set(2048, 2048)
    this._sunLight.shadow.camera.near   = 0.5
    this._sunLight.shadow.camera.far    = 500
    this._sunLight.shadow.camera.left   = -200
    this._sunLight.shadow.camera.right  =  200
    this._sunLight.shadow.camera.top    =  200
    this._sunLight.shadow.camera.bottom = -200
    this._sunLight.shadow.bias = -0.001
    this.scene.add(this._sunLight)

    const fillLight = new THREE.DirectionalLight(0x8bb8ff, 0.6)
    fillLight.position.set(-40, 30, -20)
    this.scene.add(fillLight)

    // --- Mặt nước ---
    this._createWaterSurface()

    // --- Systems ---
    this.input     = new InputManager()
    this.player    = new Player(this.scene)
    this.thirdCam  = new ThirdPersonCamera(this.camera, this.player.mesh, this.renderer)
    this.seaFloor  = new SeaFloor(this.scene)
    this.player._getTerrainHeight = (x, z) => this.seaFloor.getHeightAt(x, z)
    this.decorations = new SeaDecorations(
      this.scene,
      (x, z) => this.seaFloor.getHeightAt(x, z)
    )
    this.collectibles = new CollectibleManager(this.scene)
    this.ui           = new UIManager()
    this.audio        = new AudioManager()
    this.particles    = new ParticleSystem(this.scene)
    this.minimap      = new Minimap(this.player, this.collectibles, MAP_SIZE)
    const hidePlayer = () => { if (this.player?.mesh) this.player.mesh.visible = false }
    const showPlayer = () => { if (this.player?.mesh) this.player.mesh.visible = true }
    const bgmOpts    = {
      pauseMainBgm:  () => this.audio?.pauseBGM(),
      resumeMainBgm: () => this.audio?.resumeBGM(),
    }

    this.mainQuestPanel = new MainQuestPanel()
    this.endingScreen   = new EndingScreen()
    this._endingTriggered    = false
    this._allQuestsBannerShown = false
    this._donutQuestDone     = false

    this.miniGame2 = new MiniGameManager(
      this.renderer,
      () => this.mainQuestPanel.completeTask('dat'),
      null,
      {
        ...bgmOpts,
        url:    '/minigame2/index.html',
        bgmUrl: '/minigame2/bg_music/bgm2.mp3',
        title:  'Nhiệm vụ: Giúp Đạt tìm món quà',
      }
    )

    this.questSystem = new QuestSystem(
      this.scene, this.renderer, this.audio,
      this.camera, this.thirdCam,
      hidePlayer, showPlayer,
      () => this.mainQuestPanel.completeTask('linh')
    )

    this.characters = new CharacterManager(
      this.scene, this.camera, this.thirdCam,
      hidePlayer, showPlayer,
      () => this.collectibles.spawnDonuts(),
      () => this.miniGame2.open(),
      () => this.mainQuestPanel.onKhanhAccepted(),
      () => this.mainQuestPanel.completeTask('spongebob'),
      () => this.mainQuestPanel.allDone,
      () => { this._endingTriggered = true; this.mainQuestPanel.hideKhanhHint(); this.audio.playHappy(); this.endingScreen.show('happy') },
    )

    // --- TugBoatWithNet ---
    new GLTFLoader().load(assetUrl('/assets/models/decorations/sea_creatures/TugBoatWithNet.glb'), (gltf) => {
      const boat = gltf.scene
      boat.position.set(15.8, 3.5, 24.7)
      boat.scale.setScalar(2.5)
      boat.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true } })
      this.scene.add(boat)
    })

    // --- Resize ---
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(window.innerWidth, window.innerHeight)
    })

    this.renderer.domElement.addEventListener('contextmenu', e => e.preventDefault())

    // --- Start BGM on first user interaction (browser autoplay policy) ---
    const startBGM = () => {
      this.audio.playBGM()
      window.removeEventListener('keydown', startBGM)
      window.removeEventListener('pointerdown', startBGM)
    }
    window.addEventListener('keydown', startBGM)
    window.addEventListener('pointerdown', startBGM)
  }

  _createWaterSurface() {
    const waterTex = new THREE.TextureLoader().load(assetUrl('/assets/textures/water.jpg'))
    waterTex.wrapS = waterTex.wrapT = THREE.RepeatWrapping
    waterTex.repeat.set(30, 30)

    this._waterMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(600, 600),
      new THREE.MeshStandardMaterial({
        map:        waterTex,
        color:      0x006994,
        transparent: true,
        opacity:    0.65,
        roughness:  0.05,
        metalness:  0.3,
        side:       THREE.DoubleSide,
        depthWrite: false,
      })
    )
    this._waterMesh.rotation.x  = -Math.PI / 2
    this._waterMesh.position.y  = 2
    this._waterMesh.renderOrder = 1
    this.scene.add(this._waterMesh)
    this._waterMap = waterTex
  }

  _updateUnderwaterEffect() {
    const playerY    = this.player.position.y
    const waterLevel = 2
    const isUnder    = playerY < waterLevel

    if (isUnder) {
      const depthFactor = Math.max(0, Math.min(1,
        (waterLevel - playerY) / 20
      ))

      // Màu nước SÁNG hơn — không quá tối
      const r = THREE.MathUtils.lerp(0.05, 0.02, depthFactor)
      const g = THREE.MathUtils.lerp(0.40, 0.25, depthFactor)
      const b = THREE.MathUtils.lerp(0.65, 0.45, depthFactor)
      const fogColor = new THREE.Color(r, g, b)
      this.scene.background = fogColor

      // Fog xa hơn để thấy rõ hơn
      this.scene.fog = new THREE.Fog(fogColor,
        THREE.MathUtils.lerp(50, 25, depthFactor),   // near
        THREE.MathUtils.lerp(180, 90, depthFactor)   // far
      )

      // Ánh sáng MẠNH hơn dưới nước
      if (this._sunLight) {
        this._sunLight.color.setHex(0x6aadcc)
        this._sunLight.intensity =
          THREE.MathUtils.lerp(1.8, 0.8, depthFactor)
      }
      if (this._ambientLight) {
        this._ambientLight.color.setHex(0x4488aa)
        this._ambientLight.intensity =
          THREE.MathUtils.lerp(1.2, 0.6, depthFactor)
      }

    } else {
      this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.002)
      if (this._hdrTexture) this.scene.background = this._hdrTexture
      if (this._sunLight) {
        this._sunLight.color.setHex(0xfff5e0)
        this._sunLight.intensity = 2.5
      }
      if (this._ambientLight) {
        this._ambientLight.color.setHex(0xc8e8ff)
        this._ambientLight.intensity = 0.6
      }
    }
  }

  start() {
    this._loop()
  }

  _loop() {
    requestAnimationFrame(() => this._loop())
    const time = performance.now() * 0.001

    // 1. Player + Camera (tắt khi minigame hoặc dialogue đang mở)
    const anyDialogue = this.characters.isDialogueOpen || this.questSystem.isDialogueOpen
    if (!this.questSystem.isMinigameOpen && !anyDialogue) {
      this.player.update(this.input, this.thirdCam)
      this.thirdCam.update()
    }

    // 2. Quest System
    this.questSystem.update(this.player.position, time)

    // 3. Collectibles
    const prev = this.player.score
    this.collectibles.update(this.player)
    if (this.player.score > prev) this.audio.playCollect()

    // 4. SeaFloor
    this.seaFloor.update(time)

    // 5. Decorations
    if (this.decorations) this.decorations.update(time)

    // 6. Particles
    this.particles.emit(this.player.position)
    this.particles.update()

    // 7. UI
    this.ui.update(this.player, this.collectibles)

    // 8. Minimap
    this.minimap.update()

    // 9b. NPC characters
    this.characters.update(this.player.position)


    // 9. Donut quest completion (Hùng)
    if (this.collectibles._spawned &&
        this.collectibles.remaining === 0 &&
        this.collectibles.collected > 0 &&
        !this._donutQuestDone) {
      this._donutQuestDone = true
      this.mainQuestPanel.completeTask('hung')
    }

    if (!this._endingTriggered) {
      // Hiện hint "Hãy nói với Khánh" khi all quests done
      if (this.mainQuestPanel.allDone && !this._allQuestsBannerShown) {
        this._allQuestsBannerShown = true
        this.mainQuestPanel.showKhanhHint()
      }

      // Sashimi ending: vùng cầu bán kính 3 quanh TugBoatWithNet
      const pp = this.player.position
      const dx = pp.x - 15.8, dy = pp.y - 3.5, dz = pp.z - 24.7
      if (dx * dx + dy * dy + dz * dz < 9) {
        this._endingTriggered = true
        this.audio.playSashimi()
        this.endingScreen.show('sashimi')
      }
    }

    // 10. Underwater effect
    this._updateUnderwaterEffect()

    // 11. Animate mặt nước
    if (this._waterMap) {
      this._waterMap.offset.x += 0.0003
      this._waterMap.offset.y += 0.0002
    }

    // 12. Render
    this.renderer.render(this.scene, this.camera)
  }
}
