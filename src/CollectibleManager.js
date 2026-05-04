import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { COLLECT_DIST, DONUT_COUNT, MAP_SIZE } from './constants.js'
import { randFloat } from './utils.js'

export class CollectibleManager {
  constructor(scene) {
    this.scene = scene
    this.donuts = []
    this.total = DONUT_COUNT || 20 // Sử dụng số lượng từ hằng số, mặc định 20 nếu chưa có
    this._loadedTemplate = null
    this._spawnDonuts()
  }

  _spawnDonuts() {
    const loader = new GLTFLoader()
    
    // Load trực tiếp model donut
    loader.load('/assets/models/donut.glb', 
      (gltf) => {
        this._loadedTemplate = gltf.scene
        this._populateDonuts()
      },
      undefined,
      (err) => {
        console.error("[CollectibleManager] Không thể tải model donut:", err)
      }
    )
  }

  _populateDonuts() {
    if (!this._loadedTemplate) return

    for (let i = 0; i < this.total; i++) {
      let x, z, t = 0
      do {
        x = randFloat(-MAP_SIZE + 5, MAP_SIZE - 5)
        z = randFloat(-MAP_SIZE + 5, MAP_SIZE - 5)
        t++
      } while (Math.hypot(x, z) < 8 && t < 20)

      // Cố định độ cao Y trong khoảng từ -23 đến -15 theo đúng yêu cầu của bạn
      const y = randFloat(-23, -15)

      const donutMesh = this._loadedTemplate.clone(true)
      donutMesh.position.set(x, y, z)
      donutMesh.rotation.set(0, Math.random() * Math.PI * 2, 0)
      donutMesh.scale.setScalar(0.25)

      // Bật bóng đổ
      donutMesh.traverse(child => {
        if (child.isMesh) {
          child.castShadow = true
          child.receiveShadow = true
        }
      })

      donutMesh.name = `donut_${i}`
      this.scene.add(donutMesh)

      this.donuts.push({
        mesh: donutMesh,
        position: new THREE.Vector3(x, y, z),
        collected: false,
        id: i
      })
    }
  }

  update(player) {
    if (!this.donuts || this.donuts.length === 0) return
    const pp = player.position

    this.donuts.forEach((d) => {
      if (d.collected) return

      // Cập nhật animation xoay tròn
      if (d.mesh) {
        d.mesh.rotation.y += 0.02
      }

      // Kiểm tra va chạm
      if (pp.distanceTo(d.position) < COLLECT_DIST) {
        d.collected = true
        player.score++

        if (d.mesh) {
          this.scene.remove(d.mesh) // Xóa ra khỏi scene
        }
      }
    })
  }

  get remaining() {
    return this.donuts.filter(d => !d.collected).length
  }
  
  get collected() {
    return this.donuts.filter(d => d.collected).length
  }
}