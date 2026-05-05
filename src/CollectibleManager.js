import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { COLLECT_DIST, DONUT_COUNT, MAP_SIZE } from './constants.js'
import { randFloat } from './utils.js'
import { assetUrl } from './assetUrl.js'

export class CollectibleManager {
  constructor(scene) {
    this.scene  = scene
    this.donuts = []
    this.total  = DONUT_COUNT || 10
    this._loadedTemplate = null
    this._spawned        = false
    this._pendingSpawn   = false

    // Preload model sẵn, chưa spawn
    const loader = new GLTFLoader()
    loader.load(assetUrl('/assets/models/donut.glb'),
      (gltf) => {
        this._loadedTemplate = gltf.scene
        if (this._pendingSpawn) this._populateDonuts()
      },
      undefined,
      (err) => console.error('[CollectibleManager] Không thể tải model donut:', err)
    )
  }

  // Gọi từ bên ngoài khi quest Hùng được chấp nhận
  spawnDonuts() {
    if (this._spawned) return
    this._spawned = true
    if (this._loadedTemplate) {
      this._populateDonuts()
    } else {
      this._pendingSpawn = true // model chưa load xong, spawn khi load xong
    }
  }

  _populateDonuts() {
    for (let i = 0; i < this.total; i++) {
      let x, z, t = 0
      do {
        x = randFloat(-MAP_SIZE + 5, MAP_SIZE - 5)
        z = randFloat(-MAP_SIZE + 5, MAP_SIZE - 5)
        t++
      } while (Math.hypot(x, z) < 8 && t < 20)

      const y = randFloat(-23, -15)

      const donutMesh = this._loadedTemplate.clone(true)
      donutMesh.position.set(x, y, z)
      donutMesh.rotation.set(0, Math.random() * Math.PI * 2, 0)
      donutMesh.scale.setScalar(0.25)

      donutMesh.traverse(child => {
        if (child.isMesh) {
          child.castShadow    = true
          child.receiveShadow = true
        }
      })

      donutMesh.name = `donut_${i}`
      this.scene.add(donutMesh)

      this.donuts.push({
        mesh:      donutMesh,
        position:  new THREE.Vector3(x, y, z),
        collected: false,
        id:        i,
      })
    }
  }

  update(player) {
    if (!this._spawned || this.donuts.length === 0) return
    const pp = player.position

    this.donuts.forEach(d => {
      if (d.collected) return
      if (d.mesh) d.mesh.rotation.y += 0.02
      if (pp.distanceTo(d.position) < COLLECT_DIST) {
        d.collected = true
        player.score++
        if (d.mesh) this.scene.remove(d.mesh)
      }
    })
  }

  get remaining()  { return this.donuts.filter(d => !d.collected).length }
  get collected()  { return this.donuts.filter(d =>  d.collected).length }
}
