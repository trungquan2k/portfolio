import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { usePortfolioStore } from '../../hooks/usePortfolioStore'

const POOL = 28
const COLORS = ['#E8FFF8', '#9FFFF0', '#40C4FF', '#F4D35E', '#FFB4D9', '#FFFFFF']

type Meteor = {
  active: boolean
  life: number
  maxLife: number
  delay: number
  ox: number
  oy: number
  oz: number
  dx: number
  dy: number
  dz: number
  len: number
  color: THREE.Color
}

function spawnFlock(meteors: Meteor[]) {
  // Pick a flight corridor — flock shares direction
  const angle = Math.random() * Math.PI * 2
  const pitch = -0.25 - Math.random() * 0.35
  const dir = new THREE.Vector3(
    Math.cos(angle),
    pitch,
    Math.sin(angle),
  ).normalize()

  // Start far opposite the travel direction
  const startDist = 14 + Math.random() * 4
  const base = dir.clone().multiplyScalar(-startDist)
  base.y += 3 + Math.random() * 4

  // Side vectors for flock spread
  const side = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize()
  const up = new THREE.Vector3().crossVectors(side, dir).normalize()

  const count = 7 + Math.floor(Math.random() * 10)
  let used = 0
  for (let i = 0; i < POOL && used < count; i++) {
    const m = meteors[i]
    if (m.active) continue
    const spread = (Math.random() - 0.5) * 3.2
    const lift = (Math.random() - 0.5) * 1.8
    const along = (Math.random() - 0.5) * 2.5
    m.active = true
    m.delay = used * (0.04 + Math.random() * 0.08)
    m.life = -m.delay
    m.maxLife = 1.6 + Math.random() * 1.1
    m.ox = base.x + side.x * spread + up.x * lift + dir.x * along
    m.oy = base.y + side.y * spread + up.y * lift + dir.y * along
    m.oz = base.z + side.z * spread + up.z * lift + dir.z * along
    // Slight per-meteor direction jitter so flock isn't a rigid grid
    const jx = dir.x + (Math.random() - 0.5) * 0.12
    const jy = dir.y + (Math.random() - 0.5) * 0.08
    const jz = dir.z + (Math.random() - 0.5) * 0.12
    const inv = 1 / Math.hypot(jx, jy, jz)
    const speed = 11 + Math.random() * 7
    m.dx = jx * inv * speed
    m.dy = jy * inv * speed
    m.dz = jz * inv * speed
    m.len = 0.55 + Math.random() * 1.1
    m.color.set(COLORS[Math.floor(Math.random() * COLORS.length)])
    used++
  }
}

/** Occasional flocks of shooting stars streaking across the scene. */
export function MeteorSwarm() {
  const linesRef = useRef<THREE.LineSegments>(null)
  const headsRef = useRef<THREE.Points>(null)
  const nextBurst = useRef(4 + Math.random() * 6)
  const { phoneFocus } = usePortfolioStore()

  const meteors = useMemo<Meteor[]>(
    () =>
      Array.from({ length: POOL }, () => ({
        active: false,
        life: 0,
        maxLife: 2,
        delay: 0,
        ox: 0,
        oy: 0,
        oz: 0,
        dx: 1,
        dy: 0,
        dz: 0,
        len: 0.8,
        color: new THREE.Color('#ffffff'),
      })),
    [],
  )

  const { linePos, lineCol, headPos, headCol } = useMemo(() => {
    return {
      linePos: new Float32Array(POOL * 2 * 3),
      lineCol: new Float32Array(POOL * 2 * 3),
      headPos: new Float32Array(POOL * 3),
      headCol: new Float32Array(POOL * 3),
    }
  }, [])

  useFrame((_, dt) => {
    const dim = phoneFocus > 0.45 ? THREE.MathUtils.smoothstep(phoneFocus, 0.45, 0.95) : 0
    const keep = 1 - dim * 0.95

    nextBurst.current -= dt
    if (nextBurst.current <= 0) {
      spawnFlock(meteors)
      nextBurst.current = 7 + Math.random() * 12
    }

    let any = false
    for (let i = 0; i < POOL; i++) {
      const m = meteors[i]
      const li = i * 6
      const hi = i * 3

      if (!m.active) {
        // Park offscreen
        linePos[li] = linePos[li + 3] = 0
        linePos[li + 1] = linePos[li + 4] = -40
        linePos[li + 2] = linePos[li + 5] = 0
        headPos[hi] = 0
        headPos[hi + 1] = -40
        headPos[hi + 2] = 0
        continue
      }

      m.life += dt
      if (m.life < 0) {
        linePos[li] = linePos[li + 3] = 0
        linePos[li + 1] = linePos[li + 4] = -40
        linePos[li + 2] = linePos[li + 5] = 0
        headPos[hi + 1] = -40
        continue
      }

      any = true
      const u = m.life / m.maxLife
      if (u >= 1) {
        m.active = false
        continue
      }

      const hx = m.ox + m.dx * m.life
      const hy = m.oy + m.dy * m.life
      const hz = m.oz + m.dz * m.life
      const invSp = 1 / Math.hypot(m.dx, m.dy, m.dz)
      const trail = m.len * (0.55 + (1 - u) * 0.7)
      const tx = hx - m.dx * invSp * trail
      const ty = hy - m.dy * invSp * trail
      const tz = hz - m.dz * invSp * trail

      // Fade in / out
      const fade = u < 0.12 ? u / 0.12 : u > 0.7 ? (1 - u) / 0.3 : 1
      const a = fade * keep

      linePos[li] = hx
      linePos[li + 1] = hy
      linePos[li + 2] = hz
      linePos[li + 3] = tx
      linePos[li + 4] = ty
      linePos[li + 5] = tz

      lineCol[li] = m.color.r * a
      lineCol[li + 1] = m.color.g * a
      lineCol[li + 2] = m.color.b * a
      lineCol[li + 3] = m.color.r * a * 0.05
      lineCol[li + 4] = m.color.g * a * 0.05
      lineCol[li + 5] = m.color.b * a * 0.05

      headPos[hi] = hx
      headPos[hi + 1] = hy
      headPos[hi + 2] = hz
      headCol[hi] = m.color.r * a
      headCol[hi + 1] = m.color.g * a
      headCol[hi + 2] = m.color.b * a
    }

    if (linesRef.current) {
      linesRef.current.visible = any && keep > 0.08
      const geo = linesRef.current.geometry
      geo.attributes.position.needsUpdate = true
      geo.attributes.color.needsUpdate = true
    }
    if (headsRef.current) {
      headsRef.current.visible = any && keep > 0.08
      const geo = headsRef.current.geometry
      geo.attributes.position.needsUpdate = true
      geo.attributes.color.needsUpdate = true
      const mat = headsRef.current.material as THREE.PointsMaterial
      mat.opacity = 0.95 * keep
    }
  })

  return (
    <group>
      <lineSegments ref={linesRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePos, 3]} />
          <bufferAttribute attach="attributes-color" args={[lineCol, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          vertexColors
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      <points ref={headsRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[headPos, 3]} />
          <bufferAttribute attach="attributes-color" args={[headCol, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.12}
          vertexColors
          transparent
          opacity={0.95}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
    </group>
  )
}
