import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { createElement } from 'react'
import type { Hotspot } from '../data/portfolio'

type PortfolioStore = {
  selected: Hotspot | null
  hoveredId: string | null
  introDone: boolean
  autoRotate: boolean
  /** 0..1 how close the camera is to the phone */
  phoneFocus: number
  select: (hotspot: Hotspot | null) => void
  setHovered: (id: string | null) => void
  setIntroDone: (v: boolean) => void
  toggleAutoRotate: () => void
  setPhoneFocus: (v: number) => void
}

const PortfolioContext = createContext<PortfolioStore | null>(null)

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<Hotspot | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [introDone, setIntroDone] = useState(false)
  const [autoRotate, setAutoRotate] = useState(true)
  const [phoneFocus, setPhoneFocusState] = useState(0)

  const value = useMemo<PortfolioStore>(
    () => ({
      selected,
      hoveredId,
      introDone,
      autoRotate,
      phoneFocus,
      select: (hotspot) => {
        setSelected(hotspot)
        if (hotspot) setAutoRotate(false)
      },
      setHovered: setHoveredId,
      setIntroDone,
      toggleAutoRotate: () => setAutoRotate((v) => !v),
      setPhoneFocus: (v) => {
        setPhoneFocusState((prev) => (Math.abs(prev - v) > 0.04 ? v : prev))
      },
    }),
    [selected, hoveredId, introDone, autoRotate, phoneFocus],
  )

  return createElement(PortfolioContext.Provider, { value }, children)
}

export function usePortfolioStore() {
  const ctx = useContext(PortfolioContext)
  if (!ctx) throw new Error('usePortfolioStore must be used within PortfolioProvider')
  return ctx
}
