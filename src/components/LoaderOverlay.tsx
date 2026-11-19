import { useEffect, useState } from 'react'
import { usePortfolioStore } from '../hooks/usePortfolioStore'
import { identity } from '../data/portfolio'

export function LoaderOverlay() {
  const { introDone } = usePortfolioStore()
  const [mounted, setMounted] = useState(true)
  const [fade, setFade] = useState(false)

  useEffect(() => {
    if (!introDone) return
    setFade(true)
    const t = window.setTimeout(() => setMounted(false), 700)
    return () => window.clearTimeout(t)
  }, [introDone])

  if (!mounted) return null

  return (
    <div className={`loader ${fade ? 'loader--out' : ''}`}>
      <div className="loader__ring" />
      <p className="loader__brand">{identity.brand}</p>
      <p className="loader__sub">Weaving neural phone lattice…</p>
    </div>
  )
}
