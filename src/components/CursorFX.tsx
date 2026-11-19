import { useEffect, useRef } from 'react'
import { usePortfolioStore } from '../hooks/usePortfolioStore'

/** Pretty custom mouse only — no scene/UI overlay. */
export function CursorFX() {
  const root = useRef<HTMLDivElement>(null)
  const tip = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const { selected, hoveredId } = usePortfolioStore()

  const accent = selected?.accent ?? '#2EE6A6'
  const hot = Boolean(hoveredId || selected)

  useEffect(() => {
    const coarse = window.matchMedia('(pointer: coarse)').matches
    if (coarse) {
      document.documentElement.classList.remove('has-cursor-fx')
      return
    }

    document.documentElement.classList.add('has-cursor-fx')

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const tipPos = { ...target }
    const ringPos = { ...target }
    let raf = 0

    const place = (el: HTMLDivElement | null, x: number, y: number) => {
      if (!el) return
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`
    }

    root.current?.classList.add('is-on')
    place(tip.current, target.x, target.y)
    place(ring.current, target.x, target.y)

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX
      target.y = e.clientY
      root.current?.classList.add('is-on')
    }
    const onLeave = () => root.current?.classList.remove('is-on', 'is-press')
    const onDown = () => root.current?.classList.add('is-press')
    const onUp = () => root.current?.classList.remove('is-press')

    const loop = () => {
      tipPos.x += (target.x - tipPos.x) * 0.85
      tipPos.y += (target.y - tipPos.y) * 0.85
      place(tip.current, tipPos.x, tipPos.y)

      ringPos.x += (target.x - ringPos.x) * 0.28
      ringPos.y += (target.y - ringPos.y) * 0.28
      place(ring.current, ringPos.x, ringPos.y)

      raf = requestAnimationFrame(loop)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerleave', onLeave)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    raf = requestAnimationFrame(loop)

    return () => {
      document.documentElement.classList.remove('has-cursor-fx')
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
    }
  }, [])

  return (
    <div
      ref={root}
      className={`cursor-fx ${hot ? 'is-hot' : ''}`}
      style={{ ['--cursor-accent' as string]: accent }}
      aria-hidden
    >
      <div ref={ring} className="cursor-fx__ring" />
      <div ref={tip} className="cursor-fx__tip">
        <svg className="cursor-fx__arrow" viewBox="0 0 24 24" width="22" height="22" aria-hidden>
          <path
            className="cursor-fx__arrow-fill"
            d="M4.5 2.8 L4.5 19.2 L9.4 14.8 L13.2 22.1 L15.8 20.8 L11.9 13.2 L18.6 13.2 Z"
          />
          <path
            className="cursor-fx__arrow-stroke"
            d="M4.5 2.8 L4.5 19.2 L9.4 14.8 L13.2 22.1 L15.8 20.8 L11.9 13.2 L18.6 13.2 Z"
            fill="none"
          />
        </svg>
      </div>
    </div>
  )
}
