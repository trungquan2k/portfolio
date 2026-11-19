import { useEffect, useRef, type RefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import * as THREE from 'three'
import { usePortfolioStore } from '../../hooks/usePortfolioStore'

const MIN_DIST = 3.5
const MAX_DIST = 15
const PHONE_TARGET = new THREE.Vector3(0, 0.15, 0)

type Props = {
  controls: RefObject<OrbitControlsImpl | null>
}

/** Smooth FOV dive + pull target toward phone while zooming in */
export function ZoomFocus({ controls }: Props) {
  const { camera, gl } = useThree()
  const { introDone, autoRotate } = usePortfolioStore()
  const focus = useRef(0)
  const userZooming = useRef(false)
  const zoomTimer = useRef(0)

  useEffect(() => {
    const el = gl.domElement
    const onWheel = () => {
      userZooming.current = true
      zoomTimer.current = 0.9
    }
    el.addEventListener('wheel', onWheel, { passive: true })
    return () => el.removeEventListener('wheel', onWheel)
  }, [gl])

  useFrame((_, dt) => {
    if (!introDone) return
    if (!(camera instanceof THREE.PerspectiveCamera)) return

    const dist = camera.position.length()
    const raw = 1 - THREE.MathUtils.clamp((dist - MIN_DIST) / (MAX_DIST - MIN_DIST), 0, 1)
    const target = raw * raw * (3 - 2 * raw)
    focus.current = THREE.MathUtils.damp(focus.current, target, 4.2, dt)
    const f = focus.current

    // Cinematic FOV: wider far away, tighter when focused on phone
    const fov = THREE.MathUtils.lerp(48, 28, f)
    camera.fov = THREE.MathUtils.damp(camera.fov, fov, 5.8, dt)
    camera.updateProjectionMatrix()

    if (zoomTimer.current > 0) {
      zoomTimer.current -= dt
      if (zoomTimer.current <= 0) userZooming.current = false
    }

    if (controls.current) {
      const hold = userZooming.current || f > 0.55
      controls.current.autoRotate = autoRotate && !hold
      controls.current.dampingFactor = THREE.MathUtils.lerp(0.06, 0.11, f)

      // Soft pull look-at toward phone when diving in
      if (f > 0.35) {
        const pull = (f - 0.35) / 0.65
        controls.current.target.lerp(PHONE_TARGET, 1 - Math.exp(-3.2 * pull * dt))
      }
    }
  })

  return null
}
