import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const COUNT = 220

export function DataStreams() {
  const ref = useRef<THREE.Points>(null)
  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3)
    const speeds = new Float32Array(COUNT)
    for (let i = 0; i < COUNT; i++) {
      const a = Math.random() * Math.PI * 2
      const r = 0.4 + Math.random() * 1.6
      positions[i * 3] = Math.cos(a) * r
      positions[i * 3 + 1] = -2 + Math.random() * 4
      positions[i * 3 + 2] = Math.sin(a) * r
      speeds[i] = 0.6 + Math.random() * 1.4
    }
    return { positions, speeds }
  }, [])

  useFrame((_, dt) => {
    if (!ref.current) return
    const pos = ref.current.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3
      pos[i3 + 1] += speeds[i] * dt
      if (pos[i3 + 1] > 2.8) {
        pos[i3 + 1] = -2.2
        const a = Math.random() * Math.PI * 2
        const r = 0.4 + Math.random() * 1.6
        pos[i3] = Math.cos(a) * r
        pos[i3 + 2] = Math.sin(a) * r
      }
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.028}
        color="#40C4FF"
        transparent
        opacity={0.7}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
