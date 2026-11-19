import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

const GLYPHS = [
  '0x2F', 'RN', 'FPS', 'AI', 'KIT', '∞', '∇', 'λ', '01', 'Swift',
  'Dart', 'GPU', 'AR', '64', 'ml', '///', '<>', '::', '≠', 'Σ',
]

export function FloatingGlyphs() {
  const group = useRef<THREE.Group>(null)
  const items = useMemo(
    () =>
      GLYPHS.map((text, i) => {
        const a = (i / GLYPHS.length) * Math.PI * 2
        const r = 3.2 + (i % 4) * 0.55
        return {
          text,
          position: [
            Math.cos(a) * r,
            Math.sin(i * 1.7) * 1.4,
            Math.sin(a) * r,
          ] as [number, number, number],
          color: i % 3 === 0 ? '#2EE6A6' : i % 3 === 1 ? '#40C4FF' : '#E8A87C',
          speed: 0.3 + (i % 5) * 0.1,
        }
      }),
    [],
  )

  useFrame((state) => {
    if (!group.current) return
    group.current.rotation.y = state.clock.elapsedTime * 0.05
    group.current.children.forEach((child, i) => {
      child.position.y =
        items[i].position[1] + Math.sin(state.clock.elapsedTime * items[i].speed + i) * 0.25
    })
  })

  return (
    <group ref={group}>
      {items.map((item) => (
        <Text
          key={item.text + item.position.join()}
          position={item.position}
          fontSize={0.14}
          color={item.color}
          anchorX="center"
          anchorY="middle"
          fillOpacity={0.45}
          outlineWidth={0.004}
          outlineColor="#03060a"
        >
          {item.text}
        </Text>
      ))}
    </group>
  )
}
