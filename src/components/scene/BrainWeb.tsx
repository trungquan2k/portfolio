import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { hotspots, sphericalToCartesian } from '../../data/portfolio'
import { usePortfolioStore } from '../../hooks/usePortfolioStore'

const CORE_COUNT = 90

function fibSphere(i: number, n: number, r: number) {
  const y = 1 - (i / (n - 1)) * 2
  const radius = Math.sqrt(1 - y * y)
  const theta = Math.PI * (3 - Math.sqrt(5)) * i
  return new THREE.Vector3(Math.cos(theta) * radius * r, y * r, Math.sin(theta) * radius * r)
}

export function BrainWeb() {
  const linesRef = useRef<THREE.LineSegments>(null)
  const pulseRef = useRef<THREE.Points>(null)
  const nodesRef = useRef<THREE.Points>(null)
  const { selected, hoveredId, phoneFocus } = usePortfolioStore()

  const { lineGeo, nodePositions, pulseSeeds, pulseCount } = useMemo(() => {
    const cores: THREE.Vector3[] = []
    for (let i = 0; i < CORE_COUNT; i++) {
      cores.push(fibSphere(i, CORE_COUNT, 2.1 + (i % 5) * 0.15))
    }

    const hotspotPts = hotspots.map((h) => {
      const [x, y, z] = sphericalToCartesian(h.theta, h.phi, h.radius)
      return new THREE.Vector3(x, y, z)
    })

    const all = [...cores, ...hotspotPts, new THREE.Vector3(0, 0, 0)]
    const positions: number[] = []

    for (let i = 0; i < all.length; i++) {
      const dists: { j: number; d: number }[] = []
      for (let j = 0; j < all.length; j++) {
        if (i === j) continue
        dists.push({ j, d: all[i].distanceTo(all[j]) })
      }
      dists.sort((a, b) => a.d - b.d)
      const links = 2
      for (let k = 0; k < links; k++) {
        const j = dists[k].j
        if (j < i) continue
        positions.push(all[i].x, all[i].y, all[i].z, all[j].x, all[j].y, all[j].z)
      }
    }

    for (const p of hotspotPts) {
      const mid = p.clone().multiplyScalar(0.45)
      const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(), mid, p)
      const pts = curve.getPoints(10)
      for (let i = 0; i < pts.length - 1; i++) {
        positions.push(pts[i].x, pts[i].y, pts[i].z, pts[i + 1].x, pts[i + 1].y, pts[i + 1].z)
      }
    }

    const lineGeo = new THREE.BufferGeometry()
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))

    const nodePositions = new Float32Array(all.length * 3)
    all.forEach((v, i) => {
      nodePositions[i * 3] = v.x
      nodePositions[i * 3 + 1] = v.y
      nodePositions[i * 3 + 2] = v.z
    })

    const pulseCount = 120
    const pulseSeeds = Array.from({ length: pulseCount }, () => ({
      a: Math.floor(Math.random() * (positions.length / 6)),
      t: Math.random(),
      speed: 0.15 + Math.random() * 0.35,
    }))

    return { lineGeo, nodePositions, pulseSeeds, pulseCount }
  }, [])

  const pulsePos = useMemo(() => new Float32Array(pulseCount * 3), [pulseCount])

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    const dim = phoneFocus > 0.4 ? THREE.MathUtils.smoothstep(phoneFocus, 0.4, 0.95) : 0
    const keep = 1 - dim * 0.92

    if (linesRef.current) {
      const mat = linesRef.current.material as THREE.LineBasicMaterial
      const active = selected || hoveredId
      mat.opacity = (active ? 0.28 : 0.14 + Math.sin(t * 1.5) * 0.04) * keep
      mat.color.set(selected?.accent ?? '#2EE6A6')
      linesRef.current.rotation.y = t * 0.03
      linesRef.current.visible = keep > 0.06
    }

    if (nodesRef.current) {
      const mat = nodesRef.current.material as THREE.PointsMaterial
      mat.color.set('#9FFFF0')
      mat.opacity = 0.55 * keep
      nodesRef.current.visible = keep > 0.06
    }

    if (pulseRef.current) {
      pulseRef.current.visible = keep > 0.12
      const pMat = pulseRef.current.material as THREE.PointsMaterial
      pMat.opacity = 0.9 * keep
      if (keep > 0.12) {
        const attr = lineGeo.getAttribute('position') as THREE.BufferAttribute
        for (let i = 0; i < pulseSeeds.length; i++) {
          const seed = pulseSeeds[i]
          seed.t += dt * seed.speed
          if (seed.t > 1) {
            seed.t = 0
            seed.a = Math.floor(Math.random() * (attr.count / 2))
          }
          const i0 = seed.a * 2
          const i1 = i0 + 1
          if (i1 >= attr.count) continue
          const ax = attr.getX(i0)
          const ay = attr.getY(i0)
          const az = attr.getZ(i0)
          const bx = attr.getX(i1)
          const by = attr.getY(i1)
          const bz = attr.getZ(i1)
          const u = seed.t
          pulsePos[i * 3] = ax + (bx - ax) * u
          pulsePos[i * 3 + 1] = ay + (by - ay) * u
          pulsePos[i * 3 + 2] = az + (bz - az) * u
        }
        pulseRef.current.geometry.attributes.position.needsUpdate = true
        pulseRef.current.rotation.copy(linesRef.current?.rotation ?? new THREE.Euler())
      }
    }
  })

  return (
    <group>
      <lineSegments ref={linesRef} geometry={lineGeo}>
        <lineBasicMaterial color="#2EE6A6" transparent opacity={0.16} />
      </lineSegments>

      <points ref={nodesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[nodePositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.04}
          color="#9FFFF0"
          transparent
          opacity={0.55}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>

      <points ref={pulseRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[pulsePos, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.07}
          color="#F4D35E"
          transparent
          opacity={0.9}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
    </group>
  )
}
