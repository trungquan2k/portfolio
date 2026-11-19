import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  connections,
  hotspots,
  relatedIds,
  sphericalToCartesian,
} from '../../data/portfolio'
import { usePortfolioStore } from '../../hooks/usePortfolioStore'

function curveBetween(a: THREE.Vector3, b: THREE.Vector3, segments = 14) {
  const mid = a.clone().add(b).multiplyScalar(0.5)
  mid.multiplyScalar(0.72)
  mid.y += (a.y + b.y) * 0.08
  const curve = new THREE.QuadraticBezierCurve3(a, mid, b)
  return curve.getPoints(segments)
}

export function ConnectionLines() {
  const { selected, hoveredId, phoneFocus } = usePortfolioStore()
  const baseRef = useRef<THREE.LineSegments>(null)
  const activeRef = useRef<THREE.LineSegments>(null)

  const { baseGeo, edgeMeta } = useMemo(() => {
    const byId = new Map(
      hotspots.map((h) => {
        const [x, y, z] = sphericalToCartesian(h.theta, h.phi, h.radius)
        return [h.id, new THREE.Vector3(x, y, z)] as const
      }),
    )

    const positions: number[] = []
    const edgeMeta: { from: string; to: string; start: number; count: number }[] = []

    for (const [from, to] of connections) {
      const a = byId.get(from)
      const b = byId.get(to)
      if (!a || !b) continue
      const pts = curveBetween(a, b)
      const start = positions.length / 3
      for (let i = 0; i < pts.length - 1; i++) {
        positions.push(pts[i].x, pts[i].y, pts[i].z)
        positions.push(pts[i + 1].x, pts[i + 1].y, pts[i + 1].z)
      }
      edgeMeta.push({ from, to, start, count: (pts.length - 1) * 2 })
    }

    const baseGeo = new THREE.BufferGeometry()
    baseGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    return { baseGeo, edgeMeta }
  }, [])

  const activeGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(new Float32Array(baseGeo.getAttribute('position').array), 3),
    )
    geo.setDrawRange(0, 0)
    return geo
  }, [baseGeo])

  useFrame(() => {
    const focusId = selected?.id ?? hoveredId
    const matBase = baseRef.current?.material as THREE.LineBasicMaterial | undefined
    const matActive = activeRef.current?.material as THREE.LineBasicMaterial | undefined
    if (!matBase || !matActive) return

    const dim = phoneFocus > 0.4 ? THREE.MathUtils.smoothstep(phoneFocus, 0.4, 0.95) : 0
    const keep = 1 - dim * 0.95

    matBase.color.set('#5CE1E6')
    matActive.color.set(selected?.accent ?? '#2EE6A6')

    if (!focusId) {
      matBase.opacity = 0.18 * keep
      activeGeo.setDrawRange(0, 0)
      return
    }

    const related = relatedIds(focusId)
    related.add(focusId)
    matBase.opacity = 0.06 * keep

    const src = baseGeo.getAttribute('position') as THREE.BufferAttribute
    const dst = activeGeo.getAttribute('position') as THREE.BufferAttribute
    let write = 0
    for (const edge of edgeMeta) {
      if (!(related.has(edge.from) && related.has(edge.to))) continue
      for (let i = 0; i < edge.count; i++) {
        const si = edge.start + i
        dst.setXYZ(write, src.getX(si), src.getY(si), src.getZ(si))
        write++
      }
    }
    dst.needsUpdate = true
    activeGeo.setDrawRange(0, write)
    matActive.opacity = 0.75 * keep
  })

  return (
    <group>
      <lineSegments ref={baseRef} geometry={baseGeo}>
        <lineBasicMaterial color="#5CE1E6" transparent opacity={0.18} depthWrite={false} />
      </lineSegments>
      <lineSegments ref={activeRef} geometry={activeGeo}>
        <lineBasicMaterial color="#2EE6A6" transparent opacity={0.75} depthWrite={false} />
      </lineSegments>
    </group>
  )
}
