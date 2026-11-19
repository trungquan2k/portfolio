import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { usePortfolioStore } from '../../hooks/usePortfolioStore'

export function WireCage() {
  const group = useRef<THREE.Group>(null)
  const { phoneFocus } = usePortfolioStore()

  useFrame(() => {
    if (!group.current) return
    const dim = phoneFocus > 0.4 ? THREE.MathUtils.smoothstep(phoneFocus, 0.4, 0.95) : 0
    const keep = 1 - dim * 0.9
    group.current.visible = keep > 0.08
    group.current.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        const mat = obj.material as THREE.MeshBasicMaterial
        if (mat?.opacity != null && mat.userData.baseOpacity == null) {
          mat.userData.baseOpacity = mat.opacity
        }
        if (mat?.userData?.baseOpacity != null) {
          mat.opacity = mat.userData.baseOpacity * keep
        }
      }
    })
  })

  return (
    <group ref={group}>
      <mesh rotation={[0.4, 0.2, 0.1]}>
        <icosahedronGeometry args={[6.2, 1]} />
        <meshBasicMaterial color="#2EE6A6" wireframe transparent opacity={0.07} />
      </mesh>
      <mesh rotation={[-0.3, 0.6, -0.2]}>
        <octahedronGeometry args={[5.4, 0]} />
        <meshBasicMaterial color="#40C4FF" wireframe transparent opacity={0.05} />
      </mesh>
      <mesh rotation={[0.1, -0.4, 0.5]}>
        <dodecahedronGeometry args={[4.8, 0]} />
        <meshBasicMaterial color="#E8A87C" wireframe transparent opacity={0.08} />
      </mesh>
    </group>
  )
}
