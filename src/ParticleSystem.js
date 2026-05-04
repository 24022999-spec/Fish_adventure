import * as THREE from 'three'

/** Bong bóng đơn giản khi player ở trong nước */
export class ParticleSystem {
  constructor(scene) {
    this.scene     = scene
    this.particles = []
    this._pool     = [] // reusable mesh pool — tránh tạo/xóa liên tục
    this.geo       = new THREE.SphereGeometry(0.06, 4, 4)
    this.mat       = new THREE.MeshBasicMaterial({
      color: 0xaaddff,
      transparent: true,
      opacity: 0.6,
    })
  }

  _acquire() {
    const p = this._pool.length > 0 ? this._pool.pop() : new THREE.Mesh(this.geo, this.mat)
    p.material.opacity = 0.6
    return p
  }

  _release(p) {
    this.scene.remove(p)
    this._pool.push(p)
  }

  emit(position) {
    if (Math.random() > 0.3) return
    const p = this._acquire()
    p.position.set(
      position.x + (Math.random() - 0.5) * 0.5,
      position.y,
      position.z + (Math.random() - 0.5) * 0.5
    )
    p.userData.vy  = 0.02 + Math.random() * 0.04
    p.userData.ttl = 60
    this.scene.add(p)
    this.particles.push(p)
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.position.y       += p.userData.vy
      p.userData.ttl     -= 1
      p.material.opacity  = (p.userData.ttl / 60) * 0.6
      if (p.userData.ttl <= 0) {
        this._release(p)
        this.particles.splice(i, 1)
      }
    }
  }
}