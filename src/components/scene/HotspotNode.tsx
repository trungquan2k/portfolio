import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, Billboard } from '@react-three/drei'
import * as THREE from 'three'
import {
  relatedIds,
  sphericalToCartesian,
  type Hotspot,
} from '../../data/portfolio'
import { usePortfolioStore } from '../../hooks/usePortfolioStore'

export function HotspotNode({ hotspot }: { hotspot: Hotspot }) {
  const { selected, hoveredId, select, setHovered, introDone, phoneFocus } = usePortfolioStore()
  const group = useRef<THREE.Group>(null)
  const core = useRef<THREE.Mesh>(null)
  const ring = useRef<THREE.Mesh>(null)
  const [localHover, setLocalHover] = useState(false)
  const phoneDim = phoneFocus > 0.45 ? THREE.MathUtils.smoothstep(phoneFocus, 0.45, 0.95) : 0

  const position = useMemo(
    () => sphericalToCartesian(hotspot.theta, hotspot.phi, hotspot.radius),
    [hotspot],
  )

  const focusId = selected?.id ?? hoveredId
  const active = selected?.id === hotspot.id || hoveredId === hotspot.id || localHover
  const linked = Boolean(focusId && focusId !== hotspot.id && relatedIds(focusId).has(hotspot.id))
  const dimmed = Boolean(focusId) && !active && !linked

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (ring.current) {
      ring.current.rotation.z = t * (active || linked ? 1.2 : 0.35)
    }
    if (core.current) {
      const pulse = active ? 1.28 : linked ? 1.12 : 1 + Math.sin(t * 2 + hotspot.theta) * 0.05
      core.current.scale.setScalar(pulse)
    }
    if (group.current && introDone) {
      group.current.position.y = position[1] + Math.sin(t * 0.9 + hotspot.theta) * 0.05
      group.current.visible = phoneDim < 0.92
    }
  })

  return (
    <group
      ref={group}
      position={position}
      visible={phoneDim < 0.95}
      onPointerOver={(e) => {
        e.stopPropagation()
        document.body.style.cursor = 'pointer'
        setLocalHover(true)
        setHovered(hotspot.id)
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto'
        setLocalHover(false)
        setHovered(null)
      }}
      onClick={(e) => {
        e.stopPropagation()
        select(selected?.id === hotspot.id ? null : hotspot)
      }}
    >
      <mesh ref={core}>
        <sphereGeometry args={[0.095, 20, 20]} />
        <meshStandardMaterial
          color={hotspot.accent}
          emissive={hotspot.accent}
          emissiveIntensity={(dimmed ? 0.25 : active ? 1.9 : linked ? 1.35 : 0.9) * (1 - phoneDim * 0.85)}
          roughness={0.2}
          metalness={0.65}
          transparent
          opacity={(dimmed ? 0.28 : 0.95) * (1 - phoneDim * 0.9)}
        />
      </mesh>

      <mesh scale={active ? 2.5 : linked ? 2 : 1.55}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial
          color={hotspot.accent}
          transparent
          opacity={(dimmed ? 0.03 : active ? 0.22 : linked ? 0.14 : 0.08) * (1 - phoneDim)}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.2, 0.01, 10, 48]} />
        <meshBasicMaterial
          color={hotspot.accent}
          transparent
          opacity={(dimmed ? 0.08 : active ? 0.9 : linked ? 0.55 : 0.28) * (1 - phoneDim * 0.95)}
        />
      </mesh>

      <Billboard follow>
        <Html
          center
          distanceFactor={9}
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
            opacity: Math.max(0, 1 - phoneDim * 1.15),
          }}
        >
          <div
            className={[
              'hotspot-label',
              active ? 'hotspot-label--active' : '',
              linked ? 'hotspot-label--linked' : '',
              dimmed ? 'hotspot-label--dim' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={{ ['--accent' as string]: hotspot.accent }}
          >
            <span className="hotspot-label__kind">{hotspot.kind}</span>
            <span className="hotspot-label__text">{hotspot.label}</span>
          </div>
        </Html>
      </Billboard>
    </group>
  )
}
