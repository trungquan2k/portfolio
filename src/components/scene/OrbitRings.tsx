import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { usePortfolioStore } from '../../hooks/usePortfolioStore'

function Ring({
  radius,
  tube = 0.008,
  color,
  speed,
  tilt,
  opacity = 0.35,
}: {
  radius: number
  tube?: number
  color: string
  speed: number
  tilt: [number, number, number]
  opacity?: number
}) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.z += dt * speed
  })

  return (
    <mesh ref={ref} rotation={tilt}>
      <torusGeometry args={[radius, tube, 12, 160]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} />
    </mesh>
  )
}

function DashedOrbit({ radius, color, speed }: { radius: number; color: string; speed: number }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * speed
  })
  const dots = 28
  return (
    <group ref={ref} rotation={[Math.PI / 2.3, 0.3, 0.1]}>
      {Array.from({ length: dots }, (_, i) => {
        const a = (i / dots) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * radius, Math.sin(a) * radius, 0]}>
            <boxGeometry args={[0.05, 0.012, 0.012]} />
            <meshBasicMaterial color={color} transparent opacity={0.55} />
          </mesh>
        )
      })}
    </group>
  )
}

export function OrbitRings() {
  const group = useRef<THREE.Group>(null)
  const { phoneFocus } = usePortfolioStore()

  useFrame(() => {
    if (!group.current) return
    const dim = phoneFocus > 0.4 ? THREE.MathUtils.smoothstep(phoneFocus, 0.4, 0.95) : 0
    group.current.visible = dim < 0.92
    group.current.scale.setScalar(THREE.MathUtils.lerp(1, 0.92, dim))
    group.current.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        const mat = obj.material as THREE.MeshBasicMaterial
        if (mat?.opacity != null && mat.userData.baseOpacity == null) {
          mat.userData.baseOpacity = mat.opacity
        }
        if (mat?.userData?.baseOpacity != null) {
          mat.opacity = mat.userData.baseOpacity * (1 - dim * 0.88)
        }
      }
    })
  })

  return (
    <group ref={group}>
      <Ring radius={2.1} color="#2EE6A6" speed={0.18} tilt={[Math.PI / 2.5, 0.15, 0]} opacity={0.4} />
      <Ring radius={2.55} color="#40C4FF" speed={-0.12} tilt={[Math.PI / 2.2, -0.2, 0.3]} opacity={0.35} />
      <Ring
        radius={3.05}
        tube={0.005}
        color="#E8A87C"
        speed={0.08}
        tilt={[Math.PI / 1.95, 0.4, -0.2]}
        opacity={0.28}
      />
      <Ring radius={3.55} color="#FF6B9D" speed={-0.06} tilt={[1.2, -0.5, 0.6]} opacity={0.22} />
      <Ring radius={4.1} tube={0.004} color="#F4D35E" speed={0.045} tilt={[1.4, 0.8, -0.3]} opacity={0.18} />
      <Ring radius={4.7} tube={0.006} color="#7DFFF0" speed={-0.03} tilt={[0.9, -0.3, 1.1]} opacity={0.15} />
      <DashedOrbit radius={3.3} color="#2EE6A6" speed={0.1} />
      <DashedOrbit radius={4.4} color="#40C4FF" speed={-0.07} />

      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[5.2, 0.003, 8, 128]} />
        <meshBasicMaterial color="#2EE6A6" transparent opacity={0.12} />
      </mesh>
    </group>
  )
}
