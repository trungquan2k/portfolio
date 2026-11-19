import { useEffect, useRef } from 'react'

/** Normalized mouse in [-1, 1], smoothed for parallax. */
export function useMouseParallax(strength = 1) {
  const target = useRef({ x: 0, y: 0 })
  const smooth = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1
      const y = (e.clientY / window.innerHeight) * 2 - 1
      target.current.x = x * strength
      target.current.y = y * strength
    }
    const onLeave = () => {
      target.current.x = 0
      target.current.y = 0
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onLeave)
    }
  }, [strength])

  const tick = (dt = 1 / 60) => {
    const k = 1 - Math.exp(-6 * dt)
    smooth.current.x += (target.current.x - smooth.current.x) * k
    smooth.current.y += (target.current.y - smooth.current.y) * k
    return smooth.current
  }

  return { target, smooth, tick }
}
