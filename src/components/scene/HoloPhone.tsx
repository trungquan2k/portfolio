import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

export function HoloPhone() {
  const group = useRef<THREE.Group>(null)
  const screen = useRef<THREE.Mesh>(null)
  const scan = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (group.current) {
      group.current.rotation.y = Math.sin(t * 0.35) * 0.25
      group.current.position.y = Math.sin(t * 0.8) * 0.08
    }
    if (screen.current) {
      const mat = screen.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.55 + Math.sin(t * 2.2) * 0.25
    }
    if (scan.current) {
      scan.current.position.y = Math.sin(t * 1.8) * 0.75
      const mat = scan.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.15 + Math.sin(t * 3) * 0.08
    }
  })

  return (
    <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.4}>
      <group ref={group} position={[0, 0.1, 0]}>
        <RoundedBox args={[1.15, 2.3, 0.12]} radius={0.12} smoothness={8}>
          <meshStandardMaterial
            color="#0c1218"
            metalness={0.85}
            roughness={0.25}
            envMapIntensity={1.2}
          />
        </RoundedBox>

        <RoundedBox args={[1.18, 2.33, 0.08]} radius={0.13} smoothness={8} position={[0, 0, -0.01]}>
          <meshBasicMaterial color="#2EE6A6" transparent opacity={0.18} />
        </RoundedBox>

        {/* Ghost duplicates */}
        <RoundedBox args={[1.15, 2.3, 0.12]} radius={0.12} position={[0.08, 0.04, -0.15]}>
          <meshBasicMaterial color="#40C4FF" wireframe transparent opacity={0.12} />
        </RoundedBox>
        <RoundedBox args={[1.15, 2.3, 0.12]} radius={0.12} position={[-0.1, -0.05, -0.22]}>
          <meshBasicMaterial color="#E8A87C" wireframe transparent opacity={0.1} />
        </RoundedBox>

        <mesh ref={screen} position={[0, 0.02, 0.065]}>
          <planeGeometry args={[0.95, 1.95]} />
          <meshStandardMaterial
            color="#061018"
            emissive="#0a3d36"
            emissiveIntensity={0.6}
            metalness={0.2}
            roughness={0.4}
          />
        </mesh>

        {/* Dense fake UI grid */}
        {Array.from({ length: 9 }, (_, i) => (
          <mesh key={`row-${i}`} position={[0, 0.78 - i * 0.18, 0.07]}>
            <planeGeometry args={[0.78 - (i % 3) * 0.1, 0.035]} />
            <meshBasicMaterial
              color={i % 2 === 0 ? '#2EE6A6' : '#40C4FF'}
              transparent
              opacity={0.22 + (i % 4) * 0.04}
            />
          </mesh>
        ))}
        {Array.from({ length: 6 }, (_, i) => (
          <mesh key={`chip-${i}`} position={[-0.28 + (i % 3) * 0.28, -0.55 + Math.floor(i / 3) * 0.22, 0.072]}>
            <planeGeometry args={[0.2, 0.16]} />
            <meshBasicMaterial
              color={i % 2 ? '#E8A87C' : '#FF6B9D'}
              transparent
              opacity={0.25}
            />
          </mesh>
        ))}

        <mesh ref={scan} position={[0, 0, 0.075]}>
          <planeGeometry args={[0.92, 0.04]} />
          <meshBasicMaterial color="#7DFFF0" transparent opacity={0.2} depthWrite={false} />
        </mesh>

        <RoundedBox args={[0.32, 0.08, 0.02]} radius={0.04} position={[0, 0.88, 0.07]}>
          <meshStandardMaterial color="#05080c" metalness={0.9} roughness={0.2} />
        </RoundedBox>

        {/* Side antennas */}
        {[1, -1].map((side) => (
          <mesh key={side} position={[side * 0.62, 0.4, 0]} rotation={[0, 0, side * 0.2]}>
            <cylinderGeometry args={[0.01, 0.01, 0.9, 6]} />
            <meshBasicMaterial color="#2EE6A6" transparent opacity={0.35} />
          </mesh>
        ))}

        <pointLight position={[0, 0, 1.2]} intensity={1.6} distance={6} color="#2EE6A6" />
        <pointLight position={[0.8, 0.6, 0.5]} intensity={0.7} distance={4} color="#E8A87C" />
        <pointLight position={[-0.6, -0.4, 0.8]} intensity={0.5} distance={3.5} color="#FF6B9D" />
      </group>
    </Float>
  )
}
