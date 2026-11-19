import { useEffect, useRef, useState } from 'react'
import { identity, hotspots } from '../data/portfolio'
import { usePortfolioStore } from '../hooks/usePortfolioStore'
import { useMouseParallax } from '../hooks/useMouseParallax'

function useTicker(ms = 90) {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), ms)
    return () => window.clearInterval(id)
  }, [ms])
  return tick
}

function randHex(n = 4) {
  return Math.floor(Math.random() * 16 ** n)
    .toString(16)
    .padStart(n, '0')
    .toUpperCase()
}

export function HUD() {
  const { selected, select, autoRotate, toggleAutoRotate, introDone, hoveredId, phoneFocus } =
    usePortfolioStore()
  const phoneMode = phoneFocus > 0.55
  const tick = useTicker(110)
  const fps = 58 + (tick % 7)
  const signal = 72 + ((tick * 3) % 24)
  const timeline = hotspots.filter((h) => h.kind === 'experience')
  const parallax = useMouseParallax(1)
  const gridRef = useRef<HTMLDivElement>(null)
  const brandRef = useRef<HTMLElement>(null)
  const leftRef = useRef<HTMLElement>(null)
  const rightRef = useRef<HTMLElement>(null)

  useEffect(() => {
    let raf = 0
    const loop = () => {
      const p = parallax.tick(1 / 60)
      const apply = (el: HTMLElement | null, d: number) => {
        if (!el) return
        el.style.setProperty('--px', `${p.x * d}px`)
        el.style.setProperty('--py', `${p.y * d}px`)
      }
      apply(gridRef.current, 8)
      apply(brandRef.current, 12)
      apply(leftRef.current, 16)
      apply(rightRef.current, -12)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [parallax])

  return (
    <div className="hud" aria-live="polite">
      <div className="hud__scanlines" aria-hidden />
      <div className="hud__grid" aria-hidden ref={gridRef} />
      <div className="hud__vignette" aria-hidden />

      {/* Corner brackets */}
      <span className="hud__corner hud__corner--tl" />
      <span className="hud__corner hud__corner--tr" />
      <span className="hud__corner hud__corner--bl" />
      <span className="hud__corner hud__corner--br" />

      <header className="hud__brand" ref={brandRef}>
        <div className="hud__brand-meta">
          <span>SYS://PORTFOLIO</span>
          <span>NODE_{randHex(2)}</span>
          <span className="hud__pulse">● LIVE</span>
        </div>
        <p className="hud__brand-name" data-text={identity.brand}>
          {identity.brand}
        </p>
        <p className="hud__brand-role">{identity.role}</p>
        <div className="hud__brand-rail">
          {hotspots.map((h) => (
            <span
              key={h.id}
              className={`hud__rail-dot ${hoveredId === h.id || selected?.id === h.id ? 'is-on' : ''}`}
              style={{ background: h.accent }}
            />
          ))}
        </div>
      </header>

      {/* Left profile / stack */}
      <aside
        ref={leftRef}
        className={`hud__telemetry hud__telemetry--left ${introDone ? 'is-in' : ''}`}
      >
        <p className="hud__tele-title">// PROFILE</p>
        <p className="hud__profile-name">{identity.name}</p>
        <p className="hud__profile-role">{identity.role}</p>
        <p className="hud__profile-meta">{identity.location}</p>

        <div className="hud__contact">
          <a className="hud__contact-link" href={`mailto:${identity.email}`}>
            <span className="hud__contact-key">Gmail</span>
            <span className="hud__contact-val">{identity.email}</span>
          </a>
          <a className="hud__contact-link" href={identity.phoneHref}>
            <span className="hud__contact-key">Phone</span>
            <span className="hud__contact-val">{identity.phone}</span>
          </a>
        </div>

        <div className="hud__status-row">
          <span className="hud__status-dot" />
          <span>Available · {autoRotate ? 'Orbit AUTO' : 'Orbit MANUAL'}</span>
        </div>

        <div className="hud__left-divider" />

        <p className="hud__tele-title">// STACK</p>
        <ul className="hud__stack-chips">
          {['Flutter', 'RN', 'Kotlin', 'React', 'Next.js', 'Java', 'MySQL', 'Firebase'].map(
            (tech) => (
              <li key={tech}>{tech}</li>
            ),
          )}
        </ul>

        <div className="hud__left-divider" />

        <p className="hud__tele-title">// STATS</p>
        <div className="hud__stats">
          {identity.stats.map((s) => (
            <div key={s.key} className="hud__stat">
              <b>{s.value}</b>
              <span>{s.key}</span>
            </div>
          ))}
        </div>

        <div className="hud__left-divider" />

        <p className="hud__tele-title">// SIGNAL</p>
        <div className="hud__tele-row">
          <span>SYS</span>
          <b>{fps} FPS</b>
        </div>
        <div className="hud__bar">
          <i style={{ width: `${signal}%` }} />
        </div>
      </aside>

      {/* Right radar / stream */}
      <aside
        ref={rightRef}
        className={`hud__telemetry hud__telemetry--right ${introDone && !selected ? 'is-in' : ''}`}
      >
        <p className="hud__tele-title">// CAREER PATH</p>
        <ul className="hud__timeline">
          {timeline.map((h) => (
            <li key={h.id}>
              <button
                type="button"
                className={`hud__timeline-item ${selected?.id === h.id ? 'is-active' : ''}`}
                style={{ ['--accent' as string]: h.accent }}
                onClick={() => select(selected?.id === h.id ? null : h)}
              >
                <em style={{ background: h.accent }} />
                <span>
                  <b>{h.label}</b>
                  <small>{h.subtitle.replace(/^.*?·\s*/, '')}</small>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <p className="hud__tele-title">// NODES {hotspots.length}</p>
        <div className="hud__node-list">
          {(
            [
              ['about', 'ABOUT'],
              ['experience', 'EXP'],
              ['skill', 'SKILL'],
              ['project', 'PROJ'],
              ['contact', 'CONTACT'],
            ] as const
          ).map(([kind, title]) => {
            const group = hotspots.filter((h) => h.kind === kind)
            if (!group.length) return null
            return (
              <div key={kind} className="hud__node-group">
                <p className="hud__node-group-title">{title}</p>
                {group.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    className={`hud__node-btn ${selected?.id === h.id ? 'is-active' : ''}`}
                    style={{ ['--accent' as string]: h.accent }}
                    onClick={() => select(selected?.id === h.id ? null : h)}
                  >
                    <em style={{ background: h.accent }} />
                    {h.label}
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      </aside>

      <div
        className={`hud__hint ${introDone ? 'hud__hint--visible' : ''} ${phoneMode ? 'hud__hint--phone' : ''}`}
      >
        <span className="hud__hint-code">
          {phoneMode
            ? 'PHONE MODE · tap app · scroll out to orbit'
            : '[DRAG] xoay · [SCROLL] focus phone · [PHONE] tap app · [CLICK] neuron'}
        </span>
        <button type="button" className="hud__chip" onClick={toggleAutoRotate}>
          {autoRotate ? '⏸ freeze' : '▶ spin'}
        </button>
      </div>

      <aside className={`hud__panel ${selected ? 'hud__panel--open' : ''}`}>
        {selected && (
          <>
            <div className="hud__panel-chrome">
              <span>FILE://{selected.id}.orb</span>
              <span>{randHex(8)}</span>
            </div>
            <button
              type="button"
              className="hud__close"
              onClick={() => select(null)}
              aria-label="Close"
            >
              ✕
            </button>
            <p className="hud__kind" style={{ color: selected.accent }}>
              {selected.kind}
            </p>
            <h2 className="hud__title">{selected.title}</h2>
            <p className="hud__subtitle">{selected.subtitle}</p>
            <div className="hud__panel-scroll">
              <p className="hud__body">{selected.body}</p>
              {selected.bullets && selected.bullets.length > 0 && (
                <ul className="hud__bullets">
                  {selected.bullets.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
              {selected.link && (
                <a
                  className="hud__link"
                  href={selected.link}
                  {...(selected.id === 'about'
                    ? { download: '[Mobile Engineering]_HoangTrungQuan.pdf' }
                    : { target: '_blank', rel: 'noopener noreferrer' })}
                  style={{ color: selected.accent, borderColor: selected.accent }}
                >
                  {selected.linkLabel ?? 'Open link'}
                  {selected.id === 'about' ? '' : ' ↗'}
                </a>
              )}
              <ul className="hud__tags">
                {selected.tags.map((tag) => (
                  <li key={tag} style={{ borderColor: selected.accent }}>
                    {tag}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </aside>

      <footer className="hud__footer">
        <span>{identity.tagline}</span>
        <span className="hud__footer-mid">
          SEQ {String(tick).padStart(5, '0')} · HASH {randHex(5)}
        </span>
        <span>{identity.location}</span>
      </footer>
    </div>
  )
}
