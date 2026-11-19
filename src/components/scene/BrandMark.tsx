import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { identity } from '../../data/portfolio'

export function BrandMark() {
  const ref = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!ref.current) return
    ref.current.position.y = -2.35 + Math.sin(state.clock.elapsedTime * 0.9) * 0.04
  })

  return (
    <group ref={ref} position={[0, -2.35, 0]}>
      <Text
        fontSize={0.22}
        letterSpacing={0.22}
        color="#2EE6A6"
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.85}
      >
        {identity.brand}
      </Text>
      <Text
        position={[0, -0.28, 0]}
        fontSize={0.09}
        letterSpacing={0.22}
        color="#E8A87C"
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.7}
      >
        {identity.role.toUpperCase()}
      </Text>
    </group>
  )
}
