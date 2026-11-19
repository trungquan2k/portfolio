import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

type Bit = {
  position: [number, number, number]
  rotation: [number, number, number]
  scale: number
  speed: number
  color: string
  kind: 'box' | 'tetra' | 'ring'
}

const COLORS = ['#2EE6A6', '#40C4FF', '#E8A87C', '#FF6B9D', '#F4D35E']

export function DataDebris() {
  const group = useRef<THREE.Group>(null)
  const bits = useMemo<Bit[]>(() => {
    return Array.from({ length: 48 }, (_, i) => {
      const r = 2.8 + Math.random() * 5.5
      const theta = Math.random() * Math.PI * 2
      const phi = (Math.random() - 0.5) * 1.6
      return {
        position: [
          r * Math.cos(phi) * Math.sin(theta),
          r * Math.sin(phi) * 0.85,
          r * Math.cos(phi) * Math.cos(theta),
        ],
        rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
        scale: 0.04 + Math.random() * 0.14,
        speed: 0.2 + Math.random() * 0.8,
        color: COLORS[i % COLORS.length],
        kind: (['box', 'tetra', 'ring'] as const)[i % 3],
      }
    })
  }, [])

  useFrame((state, dt) => {
    if (!group.current) return
    group.current.rotation.y += dt * 0.04
    group.current.children.forEach((child, i) => {
      child.rotation.x += dt * bits[i].speed
      child.rotation.y += dt * bits[i].speed * 0.6
      child.position.y += Math.sin(state.clock.elapsedTime * bits[i].speed + i) * 0.0015
    })
  })

  return (
    <group ref={group}>
      {bits.map((bit, i) => (
        <mesh key={i} position={bit.position} rotation={bit.rotation} scale={bit.scale}>
          {bit.kind === 'box' && <boxGeometry args={[1, 1, 1]} />}
          {bit.kind === 'tetra' && <tetrahedronGeometry args={[1, 0]} />}
          {bit.kind === 'ring' && <torusGeometry args={[0.7, 0.12, 8, 24]} />}
          <meshBasicMaterial color={bit.color} wireframe transparent opacity={0.55} />
        </mesh>
      ))}
    </group>
  )
}
