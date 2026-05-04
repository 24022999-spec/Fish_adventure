import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { SEA_FLOOR_Y, MAP_SIZE } from './constants.js'

export class SeaDecorations {
  constructor(scene, getHeightAt) {
    this.scene       = scene
    this.getHeightAt = getHeightAt
    this._mixers     = []
    this._clock      = new THREE.Clock()

    this._setupLighting()
    this._load()
  }

  // ── Ánh sáng cho map ────────────────────────────────────────
  _setupLighting() {
    // Ambient — ánh sáng nền, đủ sáng để thấy toàn bộ chi tiết
    const ambient = new THREE.AmbientLight(0x88bbdd, 2.0)
    ambient.name  = 'deco_ambient'
    this.scene.add(ambient)

    // Mặt trời — ánh sáng chính lọc qua mặt nước
    const sun = new THREE.DirectionalLight(0x99ddff, 2.2)
    sun.name  = 'deco_sun'
    sun.position.set(20, 40, 10)
    sun.castShadow              = true
    sun.shadow.mapSize.set(2048, 2048)
    sun.shadow.camera.near      = 0.5
    sun.shadow.camera.far       = 200
    sun.shadow.camera.left      = -60
    sun.shadow.camera.right     =  60
    sun.shadow.camera.top       =  60
    sun.shadow.camera.bottom    = -60
    sun.shadow.bias             = -0.001
    this.scene.add(sun)

    // Fill light từ phía đối diện — tránh vùng tối hoàn toàn
    const fill = new THREE.DirectionalLight(0x4488aa, 0.9)
    fill.name  = 'deco_fill'
    fill.position.set(-15, 10, -20)
    this.scene.add(fill)

    // Point light gần đáy — highlight chi tiết san hô
    const bottom = new THREE.PointLight(0x00aaff, 1.2, 80)
    bottom.name  = 'deco_bottom'
    bottom.position.set(0, SEA_FLOOR_Y + 5, 0)
    this.scene.add(bottom)

    // Hemisphere light — gradient trời/đất tạo cảm giác dưới nước
    const hemi = new THREE.HemisphereLight(0x0077aa, 0x004433, 0.8)
    hemi.name  = 'deco_hemi'
    this.scene.add(hemi)

    // Lưu refs để update sau
    this._sun    = sun
    this._ambient = ambient
    this._bottom  = bottom
  }

  // ── Load map.glb ────────────────────────────────────────────
  _load() {
    const loader = new GLTFLoader()

    loader.load(
      '/assets/models/decorations/map.glb',

      // onLoad
      (gltf) => {
        const model = gltf.scene

        // Scale model vừa đáy biển, cách biên MAP_SIZE*2 một khoảng nhỏ
        const box = new THREE.Box3().setFromObject(model)
        const size = new THREE.Vector3()
        box.getSize(size)
        const targetSize = MAP_SIZE * 2 - 8   // 4 units margin mỗi bên
        const maxHoriz   = Math.max(size.x, size.z)
        const autoScale  = maxHoriz > 0 ? targetSize / maxHoriz : 1
        model.scale.setScalar(autoScale)

        // Đặt model sát đáy biển
        model.position.set(0, SEA_FLOOR_Y, 0)

        // Bật shadow + frustum culling cho tất cả mesh
        model.traverse(c => {
          if (c.isMesh) {
            c.castShadow    = true
            c.receiveShadow = true
            c.frustumCulled = true

            // Đảm bảo material nhận ánh sáng
            if (c.material) {
              // Nếu material dùng MeshBasicMaterial (không nhận light)
              // thì convert sang MeshStandardMaterial
              if (c.material.isMeshBasicMaterial) {
                const oldMat = c.material
                c.material   = new THREE.MeshStandardMaterial({
                  map:          oldMat.map,
                  color:        oldMat.color,
                  transparent:  oldMat.transparent,
                  opacity:      oldMat.opacity,
                  side:         oldMat.side,
                  roughness:    0.8,
                  metalness:    0.0,
                })
                oldMat.dispose()
              }
              c.material.needsUpdate = true
            }
          }
        })

        // Play tất cả animation nếu có (rong biển vẫy, san hô animated...)
        if (gltf.animations?.length) {
          const mixer = new THREE.AnimationMixer(model)
          gltf.animations.forEach(clip => {
            const action = mixer.clipAction(clip)
            action.play()
          })
          this._mixers.push(mixer)
          console.log(`[SeaDeco] ${gltf.animations.length} animation(s) playing`)
        }

        this.scene.add(model)
        this._model = model
        console.log('[SeaDeco] map.glb loaded ✓')
      },

      // onProgress
      (progress) => {
        if (progress.total > 0) {
          const pct = Math.round(progress.loaded / progress.total * 100)
          console.log(`[SeaDeco] Loading map.glb: ${pct}%`)
        }
      },

      // onError
      (err) => {
        console.error('[SeaDeco] Failed to load map.glb:', err)
      }
    )
  }

  // ── Update mỗi frame ─────────────────────────────────────────
  update(time) {
    const dt = this._clock.getDelta()

    // Update animation mixers
    this._mixers.forEach(m => m.update(dt))

    // Point light ở đáy nhấp nháy nhẹ như ánh sáng lọc qua nước
    if (this._bottom) {
      this._bottom.intensity = 1.0 + Math.sin(time * 1.5) * 0.25
    }
  }

  // ── Dọn dẹp ─────────────────────────────────────────────────
  dispose() {
    this._mixers.forEach(m => m.stopAllAction())
    if (this._model) this.scene.remove(this._model)

    // Xóa các light đã thêm
    ;['deco_ambient','deco_sun','deco_fill','deco_bottom','deco_hemi'].forEach(name => {
      const obj = this.scene.getObjectByName(name)
      if (obj) this.scene.remove(obj)
    })
  }
}