import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js'
import { MAP_SIZE, SEA_FLOOR_Y, COLORS } from './constants.js'
import { randFloat } from './utils.js'

export class SeaFloor {
  constructor(scene) {
    this.scene    = scene
    this._noise   = new SimplexNoise()
    this._seaweeds = []
    this._createFloor()
    this._createWalls()
  }

  // ── Chiều cao terrain tại (x,z) ─────────────────────────
  // QUAN TRỌNG: giảm amplitude mạnh để đáy biển gần phẳng
  // Chỉ gợn nhẹ tự nhiên, không nhấp nhô lớn
  getHeightAt(x, z) {
    const n = this._noise
    // Large gentle undulation (đồi cát lớn, chỉ 1.5m cao)
    const large  = n.noise(x * 0.008, z * 0.008) * 1.5
    // Medium ripple (0.4m)
    const medium = n.noise(x * 0.025, z * 0.025) * 0.4
    // Fine detail (0.1m)
    const fine   = n.noise(x * 0.08,  z * 0.08)  * 0.1
    return large + medium + fine
  }

  _createFloor() {
    const loader        = new GLTFLoader()
    const textureLoader = new THREE.TextureLoader()
    const res           = 80  // resolution đủ mịn

    const geo = new THREE.PlaneGeometry(
      MAP_SIZE * 2, MAP_SIZE * 2, res, res
    )

    // Apply noise
    const pos = geo.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      pos.setZ(i, this.getHeightAt(x, y))
    }
    pos.needsUpdate = true
    geo.computeVertexNormals()

    // Load sand material
    loader.load('/assets/models/sand_material.glb', (gltf) => {
      let sandMat = null
      gltf.scene.traverse(c => {
        if (c.isMesh && c.material && !sandMat) {
          sandMat = c.material.clone()
        }
      })

      if (sandMat?.map) {
        sandMat.map.wrapS = sandMat.map.wrapT = THREE.RepeatWrapping
        sandMat.map.repeat.set(16, 16)
        sandMat.map.needsUpdate = true
      }
      if (sandMat?.normalMap) {
        sandMat.normalMap.wrapS = sandMat.normalMap.wrapT = THREE.RepeatWrapping
        sandMat.normalMap.repeat.set(16, 16)
        sandMat.normalMap.needsUpdate = true
      }

      const floor = new THREE.Mesh(geo, sandMat || this._fallbackMat())
      floor.rotation.x = -Math.PI / 2
      floor.position.y = SEA_FLOOR_Y
      floor.receiveShadow = true
      this.scene.add(floor)
    }, undefined, () => {
      const floor = new THREE.Mesh(geo, this._fallbackMat())
      floor.rotation.x = -Math.PI / 2
      floor.position.y = SEA_FLOOR_Y
      floor.receiveShadow = true
      this.scene.add(floor)
    })

    this.scene.background = new THREE.Color(0x006994)
    this.scene.fog = new THREE.FogExp2(0x006994, 0.012)
  }

  _fallbackMat() {
    return new THREE.MeshStandardMaterial({ color: 0xc2a060, roughness: 0.9 })
  }

  _createWalls() {
    const textureLoader = new THREE.TextureLoader()
    const waterTex = textureLoader.load('/assets/textures/water.jpg')
    waterTex.wrapS = waterTex.wrapT = THREE.RepeatWrapping
    waterTex.repeat.set(6, 3)

    const wallH = 35
    const half  = MAP_SIZE
    const defs  = [
      { pos: [0,     SEA_FLOOR_Y + wallH/2, -half], rotY: 0         },
      { pos: [0,     SEA_FLOOR_Y + wallH/2,  half], rotY: Math.PI   },
      { pos: [-half, SEA_FLOOR_Y + wallH/2,  0   ], rotY:  Math.PI/2},
      { pos: [ half, SEA_FLOOR_Y + wallH/2,  0   ], rotY: -Math.PI/2},
    ]

    defs.forEach(({ pos, rotY }) => {
      const tex = waterTex.clone()
      tex.needsUpdate = true
      const geo = new THREE.PlaneGeometry(MAP_SIZE * 2, wallH)
      const mat = new THREE.MeshStandardMaterial({
        map: tex, transparent: true, opacity: 0.88,
        roughness: 0.2, side: THREE.FrontSide,
      })
      const wall = new THREE.Mesh(geo, mat)
      wall.position.set(...pos)
      wall.rotation.y = rotY
      this.scene.add(wall)
    })
  }

  update(time) {
    this._seaweeds.forEach(w => {
      w.rotation.z = Math.sin(time * w.userData.spd + w.userData.off) * 0.04
    })
  }
}