import { Experience } from './components/scene/Experience'
import { HUD } from './components/HUD'
import { CursorFX } from './components/CursorFX'
import { LoaderOverlay } from './components/LoaderOverlay'
import { PortfolioProvider } from './hooks/usePortfolioStore'

export default function App() {
  return (
    <PortfolioProvider>
      <main className="app-shell">
        <Experience />
        <HUD />
        <CursorFX />
        <LoaderOverlay />
      </main>
    </PortfolioProvider>
  )
}
