import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const COUNT = 2800

export function NeuralField() {
  const points = useRef<THREE.Points>(null)
  const points2 = useRef<THREE.Points>(null)
  const { positions, velocities, positions2 } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3)
    const velocities = new Float32Array(COUNT)
    const positions2 = new Float32Array(800 * 3)
    for (let i = 0; i < COUNT; i++) {
      const r = 5 + Math.random() * 12
      const theta = Math.random() * Math.PI * 2
      const phi = (Math.random() - 0.5) * Math.PI
      positions[i * 3] = r * Math.cos(phi) * Math.sin(theta)
      positions[i * 3 + 1] = r * Math.sin(phi)
      positions[i * 3 + 2] = r * Math.cos(phi) * Math.cos(theta)
      velocities[i] = 0.12 + Math.random() * 0.5
    }
    for (let i = 0; i < 800; i++) {
      const r = 3 + Math.random() * 4
      const theta = Math.random() * Math.PI * 2
      const phi = (Math.random() - 0.5) * 1.2
      positions2[i * 3] = r * Math.cos(phi) * Math.sin(theta)
      positions2[i * 3 + 1] = r * Math.sin(phi)
      positions2[i * 3 + 2] = r * Math.cos(phi) * Math.cos(theta)
    }
    return { positions, velocities, positions2 }
  }, [])

  useFrame((_, dt) => {
    if (points.current) {
      const pos = points.current.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < COUNT; i++) {
        const i3 = i * 3
        const x = pos[i3]
        const y = pos[i3 + 1]
        const z = pos[i3 + 2]
        const swirl = velocities[i] * dt
        pos[i3] = x * Math.cos(swirl) - z * Math.sin(swirl)
        pos[i3 + 1] = y + Math.sin(Math.hypot(x, z) + performance.now() * 0.0003) * 0.002
        pos[i3 + 2] = x * Math.sin(swirl) + z * Math.cos(swirl)
      }
      points.current.geometry.attributes.position.needsUpdate = true
      points.current.rotation.y += dt * 0.025
    }
    if (points2.current) points2.current.rotation.y -= dt * 0.04
  })

  return (
    <group>
      <points ref={points}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.032}
          color="#7DFFF0"
          transparent
          opacity={0.5}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <points ref={points2}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions2, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.05}
          color="#E8A87C"
          transparent
          opacity={0.35}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  )
}
