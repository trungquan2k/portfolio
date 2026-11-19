import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function Platform() {
  const ring = useRef<THREE.Mesh>(null)

  useFrame((_, dt) => {
    if (ring.current) ring.current.rotation.z += dt * 0.15
  })

  return (
    <group position={[0, -1.6, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[2.2, 64]} />
        <meshStandardMaterial
          color="#071018"
          metalness={0.9}
          roughness={0.35}
          transparent
          opacity={0.85}
        />
      </mesh>

      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[1.85, 1.95, 64]} />
        <meshBasicMaterial color="#2EE6A6" transparent opacity={0.45} side={THREE.DoubleSide} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[1.2, 1.25, 64]} />
        <meshBasicMaterial color="#E8A87C" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>

      <pointLight position={[0, 0.5, 0]} intensity={0.8} distance={5} color="#2EE6A6" />
    </group>
  )
}
