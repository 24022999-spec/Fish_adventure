import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const BOAT_POS = { x: 11.9, y: 3.5, z: 22.1 }
const NET_POS  = { x: 13.5, y: 4.5, z: 21.9 }
const NET_SCALE = 15.0

export class TugBoat {
  constructor(scene) {
    this._scene  = scene
    this._loader = new GLTFLoader()
    this._pivot  = null   // Object3D dùng để swing lưới

    this._loadBoat()
    this._loadNet()
  }

  _loadBoat() {
    this._loader.load(
      '/assets/models/decorations/sea_creatures/TugBoat.glb',
      (gltf) => {
        const model = gltf.scene
        model.position.set(BOAT_POS.x, BOAT_POS.y, BOAT_POS.z)
        model.scale.setScalar(2.5)
        model.traverse(c => {
          if (c.isMesh || c.isSkinnedMesh) {
            c.castShadow    = true
            c.receiveShadow = true
          }
        })
        this._scene.add(model)
      },
      undefined,
      (err) => console.error('[TugBoat] Failed to load boat:', err)
    )
  }

  _loadNet() {
    this._pivot = new THREE.Object3D()
    this._pivot.position.set(NET_POS.x, NET_POS.y, NET_POS.z)
    this._scene.add(this._pivot)

    this._loader.load(
      '/assets/models/decorations/sea_creatures/Fishing_net.glb',
      (gltf) => {
        const net = gltf.scene
        net.scale.setScalar(NET_SCALE)
        net.traverse(c => {
          if (c.isMesh || c.isSkinnedMesh) {
            c.castShadow    = true
            c.receiveShadow = true
            c.renderOrder   = 2
          }
        })
        this._pivot.add(net)
      },
      undefined,
      (err) => console.error('[TugBoat] Failed to load net:', err)
    )
  }

  update(time) {
    if (!this._pivot) return
    // Vung qua vung lại theo trục Z (lắc ngang), biên độ ~20 độ
    this._pivot.rotation.z = Math.sin(time * 1.4) * 0.35
  }
}
