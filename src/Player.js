import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MOVE_SPEED, MAP_SIZE, SEA_FLOOR_Y, COLORS } from './constants.js'
import { clamp } from './utils.js'
import { assetUrl } from './assetUrl.js'

export class Player {
  constructor(scene) {
    const geo = new THREE.CapsuleGeometry(0.4, 0.6, 4, 8)
    const mat = new THREE.MeshStandardMaterial({
      color:   COLORS.player,
      visible: false
    })
    this.mesh = new THREE.Mesh(geo, mat)
    this.mesh.position.set(0, 2, 0)
    scene.add(this.mesh)

    this._mixer      = null
    this._idleAction = null
    this._clock      = new THREE.Clock()

    const loader = new GLTFLoader()
    loader.load(assetUrl('/assets/models/stylized_fish_model.glb'), (gltf) => {
      const model = gltf.scene
      model.scale.setScalar(5.0)
      model.traverse(c => {
        if (c.isMesh || c.isSkinnedMesh) c.castShadow = true
      })
      this.mesh.add(model)
      this._model = model

      this._mixer = new THREE.AnimationMixer(model)

      if (gltf.animations.length > 0) {
        this._idleAction = this._mixer.clipAction(gltf.animations[0])
        this._idleAction.play()
      }
    })

    this._getTerrainHeight = null

    this.box   = new THREE.Box3()
    this.score = 0
    this._vel  = new THREE.Vector3()
    this._moveDir   = new THREE.Vector3()
    this._targetQuat = new THREE.Quaternion()
    this._tempEuler  = new THREE.Euler()
  }

  update(input, camController) {
    const dt      = this._clock.getDelta()
    const speed   = MOVE_SPEED
    const friction = 0.88
    const maxSpd  = 0.3

    const forward = camController.getForward()
    const right   = camController.getRight()

    this._moveDir.set(0, 0, 0)
    if (input.up)    this._moveDir.addScaledVector(forward,  speed)
    if (input.down)  this._moveDir.addScaledVector(forward, -speed)
    if (input.right) this._moveDir.addScaledVector(right,    speed)
    if (input.left)  this._moveDir.addScaledVector(right,   -speed)

    if (input.up || input.down) {
      const fwd3D   = camController.getForward3D()
      const vertSpd = fwd3D.y * speed * 1.5
      this._vel.y  += input.up ? vertSpd : -vertSpd
    }

    this._vel.x += this._moveDir.x
    this._vel.z += this._moveDir.z
    this._vel.x *= friction
    this._vel.z *= friction
    this._vel.y *= friction

    const hSpd = Math.sqrt(this._vel.x ** 2 + this._vel.z ** 2)
    if (hSpd > maxSpd) {
      this._vel.x = (this._vel.x / hSpd) * maxSpd
      this._vel.z = (this._vel.z / hSpd) * maxSpd
    }
    this._vel.y = clamp(this._vel.y, -maxSpd, maxSpd)

    this.mesh.position.add(this._vel)
    this.mesh.position.x = clamp(this.mesh.position.x, -MAP_SIZE + 5, MAP_SIZE - 5)
    this.mesh.position.z = clamp(this.mesh.position.z, -MAP_SIZE + 5, MAP_SIZE - 5)

    const groundY = this._getTerrainHeight
      ? SEA_FLOOR_Y + this._getTerrainHeight(this.mesh.position.x, this.mesh.position.z) + 0.8
      : SEA_FLOOR_Y + 0.5
    this.mesh.position.y = clamp(this.mesh.position.y, groundY, SEA_FLOOR_Y + 30)
    if (this.mesh.position.y <= groundY + 0.1) this._vel.y = Math.max(0, this._vel.y)

    const isMoving = this._vel.lengthSq() > 0.001
    if (isMoving) {
      const angle = Math.atan2(this._vel.x, this._vel.z)
      this._tempEuler.set(0, angle, 0)
      this._targetQuat.setFromEuler(this._tempEuler)
      this.mesh.quaternion.slerp(this._targetQuat, 0.12)
    }

    if (this._mixer) {
      const velLen   = this._vel.length()
      this._mixer.timeScale = isMoving ? 1.0 + (velLen / maxSpd) * 1.5 : 0.5
      this._mixer.update(dt)
    }

    this.box.setFromObject(this.mesh)
  }

  get position() { return this.mesh.position }
}
