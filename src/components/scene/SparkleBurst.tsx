import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const N = 400

export function SparkleBurst() {
  const ref = useRef<THREE.Points>(null)
  const { positions, phases } = useMemo(() => {
    const positions = new Float32Array(N * 3)
    const phases = new Float32Array(N)
    for (let i = 0; i < N; i++) {
      const r = 1.5 + Math.random() * 7
      const theta = Math.random() * Math.PI * 2
      const phi = (Math.random() - 0.5) * Math.PI
      positions[i * 3] = r * Math.cos(phi) * Math.sin(theta)
      positions[i * 3 + 1] = r * Math.sin(phi)
      positions[i * 3 + 2] = r * Math.cos(phi) * Math.cos(theta)
      phases[i] = Math.random() * Math.PI * 2
    }
    return { positions, phases }
  }, [])

  useFrame((state) => {
    if (!ref.current) return
    const mat = ref.current.material as THREE.PointsMaterial
    const t = state.clock.elapsedTime
    // Twinkle size via opacity oscillation
    mat.opacity = 0.25 + Math.sin(t * 3) * 0.1
    ref.current.rotation.y = t * 0.08
    // Individual sparkle by shifting Y slightly
    const pos = ref.current.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < N; i++) {
      const blink = Math.sin(t * 6 + phases[i])
      if (blink > 0.92) pos[i * 3 + 1] += 0.002
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.055}
        color="#ffffff"
        transparent
        opacity={0.35}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  )
}
