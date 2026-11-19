import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { hotspots, identity, type Hotspot } from '../../data/portfolio'
import { usePortfolioStore } from '../../hooks/usePortfolioStore'

const MIN_DIST = 3.5
const MAX_DIST = 15
const CW = 720
const CH = 1440

/** Inter — neutral, high legibility on small 3D screens */
const FONT_UI = '"Inter", system-ui, -apple-system, sans-serif'

function font(weight: number, size: number) {
  return `${weight} ${size}px ${FONT_UI}`
}

let fontsReady = false
function ensureFonts() {
  if (fontsReady || typeof document === 'undefined') return Promise.resolve()
  return Promise.all([
    document.fonts.load(`400 24px ${FONT_UI}`),
    document.fonts.load(`600 28px ${FONT_UI}`),
    document.fonts.load(`700 48px ${FONT_UI}`),
    document.fonts.load(`800 58px ${FONT_UI}`),
  ]).then(() => {
    fontsReady = true
  })
}

type HitId =
  | 'back'
  | 'dock-about'
  | 'dock-skill'
  | 'dock-project'
  | 'dock-contact'
  | 'app-spark'
  | 'app-green'
  | 'app-iot'
  | 'app-insida'
  | 'app-shop'
  | 'app-track'
  | null

const APP_HOTSPOT: Record<Exclude<HitId, 'back' | null>, string> = {
  'app-spark': 'proj-sparkfix',
  'app-green': 'proj-greencheck',
  'app-iot': 'proj-iot',
  'app-insida': 'proj-insida',
  'app-shop': 'proj-ecommerce',
  'app-track': 'proj-auto',
  'dock-about': 'about',
  'dock-skill': 'skill-flutter',
  'dock-project': 'proj-sparkfix',
  'dock-contact': 'contact',
}

type IconKind = 'spark' | 'leaf' | 'iot' | 'home' | 'shop' | 'track' | 'user' | 'code' | 'grid' | 'mail'

const APPS: { id: Exclude<HitId, 'back' | null>; label: string; color: string; icon: IconKind }[] = [
  { id: 'app-spark', label: 'Spark', color: '#34D399', icon: 'spark' },
  { id: 'app-green', label: 'Green', color: '#A3E635', icon: 'leaf' },
  { id: 'app-iot', label: 'IoT', color: '#22D3EE', icon: 'iot' },
  { id: 'app-insida', label: 'Insida', color: '#60A5FA', icon: 'home' },
  { id: 'app-shop', label: 'Shop', color: '#F0ABFC', icon: 'shop' },
  { id: 'app-track', label: 'Track', color: '#FB7185', icon: 'track' },
]

const DOCK: { id: Exclude<HitId, 'back' | null>; label: string; color: string; icon: IconKind }[] = [
  { id: 'dock-about', label: 'About', color: '#34D399', icon: 'user' },
  { id: 'dock-skill', label: 'Skill', color: '#38BDF8', icon: 'code' },
  { id: 'dock-project', label: 'Work', color: '#FBBF24', icon: 'grid' },
  { id: 'dock-contact', label: 'Ping', color: '#FB923C', icon: 'mail' },
]

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

function createScreenTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = CW
  canvas.height = CH
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 16
  texture.generateMipmaps = false
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  return { canvas, ctx, texture }
}

/** Soft radial glow used as a backlight behind the phone */
function createGlowTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')!
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.35, 'rgba(255,255,255,0.35)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 256, 256)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** Rounded-corner screen plane with proper 0..1 UVs (so corners match the bezel) */
function createRoundedPlane(w: number, h: number, r: number) {
  const x = -w / 2
  const y = -h / 2
  const s = new THREE.Shape()
  s.moveTo(x + r, y)
  s.lineTo(x + w - r, y)
  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false)
  s.lineTo(x + w, y + h - r)
  s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false)
  s.lineTo(x + r, y + h)
  s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false)
  s.lineTo(x, y + r)
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false)
  const geo = new THREE.ShapeGeometry(s, 14)
  const pos = geo.attributes.position
  const uv = geo.attributes.uv
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, pos.getX(i) / w + 0.5, pos.getY(i) / h + 0.5)
  }
  uv.needsUpdate = true
  return geo
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

function appIconRect(i: number) {
  const col = i % 3
  const row = Math.floor(i / 3)
  const size = 128
  const gapX = 56
  const gapY = 48
  const startX = 78
  const startY = 520
  return {
    x: startX + col * (size + gapX),
    y: startY + row * (size + gapY + 36),
    w: size,
    h: size + 36,
    size,
  }
}

function dockIconRect(i: number) {
  const size = 92
  const total = 4 * size + 3 * 28
  const startX = (CW - total) / 2
  return {
    x: startX + i * (size + 28),
    y: CH - 210,
    w: size,
    h: size + 28,
    size,
  }
}

function hitTest(ux: number, uy: number, detail: boolean): HitId {
  const x = ux * CW
  const y = (1 - uy) * CH

  if (detail) {
    if (x >= 48 && x <= 200 && y >= 120 && y <= 190) return 'back'
    return null
  }

  for (let i = 0; i < APPS.length; i++) {
    const r = appIconRect(i)
    if (x >= r.x && x <= r.x + r.size && y >= r.y && y <= r.y + r.size + 28) return APPS[i].id
  }
  for (let i = 0; i < DOCK.length; i++) {
    const r = dockIconRect(i)
    if (x >= r.x && x <= r.x + r.size && y >= r.y && y <= r.y + r.size) return DOCK[i].id
  }
  return null
}

function paintWallpaper(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  accent: string,
) {
  const bg = ctx.createLinearGradient(0, 0, w * 0.15, h)
  bg.addColorStop(0, '#030a11')
  bg.addColorStop(0.3, '#091723')
  bg.addColorStop(0.65, '#0b1e2b')
  bg.addColorStop(1, '#040b11')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  // Soft aurora bands
  for (let i = 0; i < 5; i++) {
    const y = h * (0.12 + i * 0.16) + Math.sin(t * 0.4 + i) * 28
    const band = ctx.createLinearGradient(0, y - 80, w, y + 80)
    const c = i % 2 === 0 ? accent : i % 3 === 0 ? '#38BDF8' : '#A78BFA'
    band.addColorStop(0, 'transparent')
    band.addColorStop(0.35, hexAlpha(c, 0.04 + i * 0.01))
    band.addColorStop(0.55, hexAlpha(c, 0.1))
    band.addColorStop(0.75, hexAlpha(c, 0.03))
    band.addColorStop(1, 'transparent')
    ctx.fillStyle = band
    ctx.fillRect(0, y - 100, w, 200)
  }

  const blobs = [
    { x: 0.22, y: 0.2, r: 340, c: accent, a: 0.24 },
    { x: 0.82, y: 0.32, r: 290, c: '#38BDF8', a: 0.16 },
    { x: 0.48, y: 0.7, r: 360, c: '#A78BFA', a: 0.12 },
    { x: 0.12, y: 0.88, r: 250, c: accent, a: 0.09 },
  ]
  blobs.forEach((b, i) => {
    const x = w * b.x + Math.sin(t * 0.35 + i) * 40
    const y = h * b.y + Math.cos(t * 0.28 + i * 0.7) * 32
    const g = ctx.createRadialGradient(x, y, 8, x, y, b.r)
    g.addColorStop(0, hexAlpha(b.c, b.a))
    g.addColorStop(0.5, hexAlpha(b.c, b.a * 0.4))
    g.addColorStop(1, 'transparent')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  })

  // Fine mesh grid
  ctx.save()
  ctx.globalAlpha = 0.045
  ctx.strokeStyle = '#9FFFF0'
  ctx.lineWidth = 1
  const step = 36
  const ox = Math.sin(t * 0.15) * 8
  for (let x = -step; x < w + step; x += step) {
    ctx.beginPath()
    ctx.moveTo(x + ox, 0)
    ctx.lineTo(x + ox - 40, h)
    ctx.stroke()
  }
  for (let y = -step; y < h + step; y += step) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y + 18)
    ctx.stroke()
  }
  ctx.restore()

  // Twinkling particles
  for (let i = 0; i < 30; i++) {
    const px = ((i * 137.5) % 1) * 0 + ((i * 97) % w)
    const py = ((i * 211) % h) + Math.sin(t * 0.5 + i) * 10
    const tw = 0.25 + 0.75 * Math.abs(Math.sin(t * 0.9 + i * 1.7))
    ctx.fillStyle = `rgba(200,255,245,${0.05 + tw * 0.22})`
    ctx.beginPath()
    ctx.arc(px, py, 1 + (i % 3) * 0.7, 0, Math.PI * 2)
    ctx.fill()
  }

  const vig = ctx.createRadialGradient(w / 2, h * 0.38, h * 0.08, w / 2, h * 0.5, h * 0.78)
  vig.addColorStop(0, 'transparent')
  vig.addColorStop(1, 'rgba(0,0,0,0.5)')
  ctx.fillStyle = vig
  ctx.fillRect(0, 0, w, h)
}

function hexAlpha(hex: string, a: number) {
  const n = Math.round(THREE.MathUtils.clamp(a, 0, 1) * 255)
  return `${hex}${n.toString(16).padStart(2, '0')}`
}

function paintStatusBar(ctx: CanvasRenderingContext2D, w: number, accent: string) {
  ctx.fillStyle = 'rgba(255,255,255,0.95)'
  ctx.font = font(600, 30)
  ctx.fillText('9:41', 52, 72)

  // Cellular
  for (let i = 0; i < 4; i++) {
    const bh = 8 + i * 5
    ctx.fillStyle = i < 3 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)'
    ctx.fillRect(w - 198 + i * 10, 72 - bh, 6, bh)
  }
  // Wifi
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.arc(w - 142, 66, 12, Math.PI * 1.15, Math.PI * 1.85)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(w - 142, 66, 6, Math.PI * 1.15, Math.PI * 1.85)
  ctx.stroke()
  // Battery
  roundRect(ctx, w - 112, 52, 58, 22, 6)
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'
  ctx.lineWidth = 2
  ctx.stroke()
  roundRect(ctx, w - 108, 56, 42, 14, 3)
  ctx.fillStyle = accent
  ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.fillRect(w - 52, 58, 4, 10)
}

function drawGlyph(ctx: CanvasRenderingContext2D, kind: IconKind, cx: number, cy: number, s: number) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.strokeStyle = '#fff'
  ctx.fillStyle = '#fff'
  ctx.shadowColor = 'rgba(0,0,0,0.28)'
  ctx.shadowBlur = 6
  ctx.shadowOffsetY = 2
  ctx.lineWidth = Math.max(2.5, s * 0.08)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  switch (kind) {
    case 'spark': {
      ctx.beginPath()
      ctx.moveTo(-s * 0.05, -s * 0.42)
      ctx.lineTo(s * 0.12, -s * 0.02)
      ctx.lineTo(-s * 0.06, -s * 0.02)
      ctx.lineTo(s * 0.08, s * 0.42)
      ctx.lineTo(-s * 0.14, s * 0.04)
      ctx.lineTo(s * 0.08, s * 0.04)
      ctx.closePath()
      ctx.fill()
      break
    }
    case 'leaf': {
      ctx.beginPath()
      ctx.moveTo(0, s * 0.38)
      ctx.bezierCurveTo(s * 0.42, s * 0.1, s * 0.38, -s * 0.35, 0, -s * 0.4)
      ctx.bezierCurveTo(-s * 0.38, -s * 0.35, -s * 0.42, s * 0.1, 0, s * 0.38)
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(0, s * 0.3)
      ctx.lineTo(0, -s * 0.28)
      ctx.stroke()
      break
    }
    case 'iot': {
      ctx.beginPath()
      ctx.arc(0, 0, s * 0.12, 0, Math.PI * 2)
      ctx.fill()
      for (const r of [0.26, 0.4]) {
        ctx.beginPath()
        ctx.arc(0, 0, s * r, -Math.PI * 0.75, -Math.PI * 0.25)
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(0, 0, s * r, Math.PI * 0.25, Math.PI * 0.75)
        ctx.stroke()
      }
      break
    }
    case 'home': {
      ctx.beginPath()
      ctx.moveTo(0, -s * 0.36)
      ctx.lineTo(s * 0.36, -s * 0.02)
      ctx.lineTo(s * 0.36, s * 0.36)
      ctx.lineTo(s * 0.12, s * 0.36)
      ctx.lineTo(s * 0.12, s * 0.08)
      ctx.lineTo(-s * 0.12, s * 0.08)
      ctx.lineTo(-s * 0.12, s * 0.36)
      ctx.lineTo(-s * 0.36, s * 0.36)
      ctx.lineTo(-s * 0.36, -s * 0.02)
      ctx.closePath()
      ctx.fill()
      break
    }
    case 'shop': {
      roundRect(ctx, -s * 0.28, -s * 0.08, s * 0.56, s * 0.42, s * 0.06)
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(-s * 0.22, -s * 0.08)
      ctx.lineTo(-s * 0.14, -s * 0.34)
      ctx.lineTo(s * 0.14, -s * 0.34)
      ctx.lineTo(s * 0.22, -s * 0.08)
      ctx.stroke()
      break
    }
    case 'track': {
      ctx.beginPath()
      ctx.arc(0, 0, s * 0.34, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(0, 0, s * 0.14, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(s * 0.22, -s * 0.18)
      ctx.stroke()
      break
    }
    case 'user': {
      ctx.beginPath()
      ctx.arc(0, -s * 0.16, s * 0.16, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(0, s * 0.38, s * 0.32, Math.PI * 1.05, Math.PI * 1.95)
      ctx.stroke()
      break
    }
    case 'code': {
      ctx.beginPath()
      ctx.moveTo(-s * 0.08, -s * 0.32)
      ctx.lineTo(s * 0.16, 0)
      ctx.lineTo(-s * 0.08, s * 0.32)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(-s * 0.28, -s * 0.18)
      ctx.lineTo(-s * 0.42, 0)
      ctx.lineTo(-s * 0.28, s * 0.18)
      ctx.stroke()
      break
    }
    case 'grid': {
      const g = s * 0.14
      for (let r = -1; r <= 1; r++) {
        for (let c = -1; c <= 1; c++) {
          roundRect(ctx, c * g * 1.7 - g * 0.55, r * g * 1.7 - g * 0.55, g * 1.1, g * 1.1, g * 0.25)
          ctx.fill()
        }
      }
      break
    }
    case 'mail': {
      roundRect(ctx, -s * 0.34, -s * 0.22, s * 0.68, s * 0.44, s * 0.06)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(-s * 0.3, -s * 0.16)
      ctx.lineTo(0, s * 0.06)
      ctx.lineTo(s * 0.3, -s * 0.16)
      ctx.stroke()
      break
    }
  }
  ctx.restore()
}

function drawIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  icon: IconKind,
  hover: boolean,
) {
  ctx.save()
  // Hover = gentle pop-out from icon centre
  if (hover) {
    const cx = x + size / 2
    const cy = y + size / 2
    ctx.translate(cx, cy)
    ctx.scale(1.08, 1.08)
    ctx.translate(-cx, -cy)
  }

  const ix = Math.round(x)
  const iy = Math.round(y)
  const s = Math.round(size)
  const r = s * 0.28

  // Coloured drop shadow / glow
  ctx.save()
  ctx.shadowColor = hexAlpha(color, hover ? 0.7 : 0.38)
  ctx.shadowBlur = hover ? 34 : 20
  ctx.shadowOffsetY = 10
  roundRect(ctx, ix, iy, s, s, r)
  ctx.fillStyle = 'rgba(0,0,0,0.5)'
  ctx.fill()
  ctx.restore()

  // Body
  roundRect(ctx, ix, iy, s, s, r)
  const g = ctx.createLinearGradient(ix, iy, ix + s, iy + s)
  g.addColorStop(0, lighten(color, 0.22))
  g.addColorStop(0.45, color)
  g.addColorStop(1, darken(color, 0.26))
  ctx.fillStyle = g
  ctx.fill()

  ctx.save()
  roundRect(ctx, ix, iy, s, s, r)
  ctx.clip()

  // Inner bottom shade for depth
  const shade = ctx.createLinearGradient(0, iy + s * 0.55, 0, iy + s)
  shade.addColorStop(0, 'rgba(0,0,0,0)')
  shade.addColorStop(1, 'rgba(0,0,0,0.24)')
  ctx.fillStyle = shade
  ctx.fillRect(ix, iy, s, s)

  // Top gloss
  const gloss = ctx.createLinearGradient(ix, iy, ix, iy + s * 0.55)
  gloss.addColorStop(0, 'rgba(255,255,255,0.42)')
  gloss.addColorStop(0.6, 'rgba(255,255,255,0.07)')
  gloss.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gloss
  ctx.fillRect(ix, iy, s, s * 0.58)

  // Soft corner light
  const corner = ctx.createRadialGradient(ix + s * 0.2, iy + s * 0.12, 2, ix + s * 0.2, iy + s * 0.12, s * 0.7)
  corner.addColorStop(0, 'rgba(255,255,255,0.28)')
  corner.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = corner
  ctx.fillRect(ix, iy, s, s)
  ctx.restore()

  // Glass border (light top, dark bottom)
  roundRect(ctx, ix + 0.75, iy + 0.75, s - 1.5, s - 1.5, r)
  const border = ctx.createLinearGradient(ix, iy, ix, iy + s)
  border.addColorStop(0, 'rgba(255,255,255,0.6)')
  border.addColorStop(0.5, 'rgba(255,255,255,0.12)')
  border.addColorStop(1, 'rgba(255,255,255,0.28)')
  ctx.strokeStyle = border
  ctx.lineWidth = 1.5
  ctx.stroke()

  if (hover) {
    roundRect(ctx, ix - 4, iy - 4, s + 8, s + 8, r + 3)
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'
    ctx.lineWidth = 2.5
    ctx.stroke()
  }

  drawGlyph(ctx, icon, ix + s / 2, iy + s / 2, s * 0.42)
  ctx.restore()
}

function lighten(hex: string, amt: number) {
  const c = new THREE.Color(hex)
  c.offsetHSL(0, 0, amt)
  return `#${c.getHexString()}`
}
function darken(hex: string, amt: number) {
  const c = new THREE.Color(hex)
  c.offsetHSL(0, 0, -amt)
  return `#${c.getHexString()}`
}

/** Decorative "Flutter · 60fps" widget with animated wave */
function paintWidget(ctx: CanvasRenderingContext2D, t: number, accent: string) {
  const x = 48
  const y = 936
  const w = CW - 96
  const h = 190

  roundRect(ctx, x, y, w, h, 40)
  const fill = ctx.createLinearGradient(x, y, x + w, y + h)
  fill.addColorStop(0, 'rgba(255,255,255,0.13)')
  fill.addColorStop(1, 'rgba(255,255,255,0.04)')
  ctx.fillStyle = fill
  ctx.fill()
  roundRect(ctx, x, y, w, h, 40)
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.fillStyle = hexAlpha(accent, 0.95)
  ctx.font = font(700, 18)
  ctx.fillText('BUILT WITH', x + 32, y + 52)
  ctx.fillStyle = '#fff'
  ctx.font = font(800, 44)
  ctx.fillText('Flutter', x + 32, y + 104)
  ctx.fillStyle = 'rgba(255,255,255,0.58)'
  ctx.font = font(400, 22)
  ctx.fillText('60 fps · one codebase', x + 32, y + 142)

  // Wave
  const x0 = x + 300
  const x1 = x + w - 32
  const mid = y + h / 2
  const amp = 30 * (0.7 + 0.3 * Math.sin(t * 0.8))
  const drawWave = (phase: number, a: number, alpha: number, lw: number) => {
    ctx.beginPath()
    for (let px = x0; px <= x1; px += 4) {
      const k = (px - x0) / (x1 - x0)
      const env = Math.sin(k * Math.PI)
      const py = mid + Math.sin(px * 0.035 + t * 2 + phase) * a * env
      if (px === x0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.strokeStyle = hexAlpha(accent, alpha)
    ctx.lineWidth = lw
    ctx.lineCap = 'round'
    ctx.stroke()
    ctx.lineCap = 'butt'
  }
  drawWave(1.6, amp * 0.8, 0.3, 3)
  ctx.save()
  ctx.shadowColor = accent
  ctx.shadowBlur = 14
  drawWave(0, amp, 0.95, 4)
  ctx.restore()
}

function paintHome(
  ctx: CanvasRenderingContext2D,
  t: number,
  accent: string,
  focus: number,
  hovered: HitId,
) {
  const w = CW
  const h = CH
  ctx.textAlign = 'left'
  paintWallpaper(ctx, w, h, t, accent)
  paintStatusBar(ctx, w, accent)

  // Island drawn in UI under hardware island
  roundRect(ctx, w / 2 - 92, 96, 184, 44, 22)
  ctx.fillStyle = '#030507'
  ctx.fill()

  // Glass hero card
  const cardY = 180
  const cardH = 290
  roundRect(ctx, 48, cardY, w - 96, cardH, 44)
  const cardFill = ctx.createLinearGradient(48, cardY, w - 48, cardY + cardH)
  cardFill.addColorStop(0, 'rgba(255,255,255,0.15)')
  cardFill.addColorStop(1, 'rgba(255,255,255,0.05)')
  ctx.fillStyle = cardFill
  ctx.fill()
  const edge = ctx.createLinearGradient(48, cardY, 48, cardY + 100)
  edge.addColorStop(0, 'rgba(255,255,255,0.28)')
  edge.addColorStop(1, 'rgba(255,255,255,0)')
  roundRect(ctx, 48, cardY, w - 96, cardH, 44)
  ctx.fillStyle = edge
  ctx.fill()
  roundRect(ctx, 48, cardY, w - 96, cardH, 44)
  const cardStroke = ctx.createLinearGradient(48, cardY, w - 48, cardY + cardH)
  cardStroke.addColorStop(0, 'rgba(255,255,255,0.42)')
  cardStroke.addColorStop(0.5, 'rgba(255,255,255,0.12)')
  cardStroke.addColorStop(1, hexAlpha(accent, 0.45))
  ctx.strokeStyle = cardStroke
  ctx.lineWidth = 1.75
  ctx.stroke()
  // Left accent bar
  roundRect(ctx, 48, cardY + 28, 6, cardH - 56, 3)
  ctx.fillStyle = accent
  ctx.fill()

  const orb = ctx.createRadialGradient(w - 130, cardY + 130, 8, w - 130, cardY + 130, 140)
  orb.addColorStop(0, hexAlpha(accent, 0.65))
  orb.addColorStop(0.55, hexAlpha(accent, 0.18))
  orb.addColorStop(1, 'transparent')
  ctx.fillStyle = orb
  ctx.fillRect(48, cardY, w - 96, cardH)

  ctx.fillStyle = hexAlpha(accent, 0.98)
  ctx.font = font(700, 22)
  ctx.fillText('PORTFOLIO LIVE', 78, cardY + 56)
  // live dot
  ctx.beginPath()
  ctx.arc(268, cardY + 49, 5 + Math.sin(t * 4) * 1.2, 0, Math.PI * 2)
  ctx.fillStyle = accent
  ctx.fill()

  ctx.fillStyle = '#ffffff'
  ctx.font = font(800, 58)
  ctx.fillText(identity.brand, 78, cardY + 130)

  ctx.fillStyle = 'rgba(255,255,255,0.88)'
  ctx.font = font(500, 28)
  ctx.fillText(identity.role, 78, cardY + 180)

  ctx.fillStyle = 'rgba(255,255,255,0.62)'
  ctx.font = font(400, 24)
  ctx.fillText(focus > 0.45 ? 'Tap an app to open' : 'Scroll in · tap apps', 78, cardY + 226)

  // Focus ring
  const cx = w - 130
  const cy = cardY + 150
  ctx.beginPath()
  ctx.arc(cx, cy, 42, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'
  ctx.lineWidth = 6
  ctx.stroke()
  ctx.save()
  ctx.shadowColor = accent
  ctx.shadowBlur = 12
  ctx.beginPath()
  ctx.arc(cx, cy, 42, -Math.PI / 2, -Math.PI / 2 + (0.52 + focus * 0.42) * Math.PI * 2)
  ctx.strokeStyle = accent
  ctx.lineWidth = 6
  ctx.lineCap = 'round'
  ctx.stroke()
  ctx.restore()
  ctx.lineCap = 'butt'
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.font = font(700, 22)
  ctx.textAlign = 'center'
  ctx.fillText(`${Math.round(focus * 100)}`, cx, cy + 8)
  ctx.textAlign = 'left'

  // Section label
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.font = font(600, 20)
  ctx.fillText('PROJECTS', 78, 490)

  APPS.forEach((app, i) => {
    const r = appIconRect(i)
    const hover = hovered === app.id
    drawIcon(ctx, r.x, r.y, r.size, app.color, app.icon, hover)
    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,0.6)'
    ctx.shadowBlur = 6
    ctx.fillStyle = hover ? '#fff' : 'rgba(255,255,255,0.92)'
    ctx.font = font(600, 24)
    ctx.textAlign = 'center'
    ctx.fillText(app.label, r.x + r.size / 2, r.y + r.size + 30)
    ctx.restore()
    ctx.textAlign = 'left'
  })

  paintWidget(ctx, t, accent)

  // Page dots
  const dotY = 1172
  const pill = 26
  roundRect(ctx, w / 2 - pill / 2 - 20, dotY - 5, pill, 10, 5)
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.fill()
  for (const dx of [0, 20]) {
    ctx.beginPath()
    ctx.arc(w / 2 + 6 + dx, dotY, 4.5, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255,255,255,0.32)'
    ctx.fill()
  }

  // Frosted dock
  const dockY = h - 230
  roundRect(ctx, 56, dockY, w - 112, 150, 44)
  ctx.fillStyle = 'rgba(12, 20, 28, 0.66)'
  ctx.fill()
  roundRect(ctx, 56, dockY, w - 112, 150, 44)
  const dockGloss = ctx.createLinearGradient(0, dockY, 0, dockY + 70)
  dockGloss.addColorStop(0, 'rgba(255,255,255,0.22)')
  dockGloss.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = dockGloss
  ctx.fill()
  roundRect(ctx, 56, dockY, w - 112, 150, 44)
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'
  ctx.lineWidth = 1.75
  ctx.stroke()

  DOCK.forEach((d, i) => {
    const r = dockIconRect(i)
    drawIcon(ctx, r.x, r.y + 18, r.size, d.color, d.icon, hovered === d.id)
  })

  // Home bar
  roundRect(ctx, w / 2 - 70, h - 48, 140, 10, 5)
  ctx.fillStyle = 'rgba(255,255,255,0.45)'
  ctx.fill()
}

function paintDetail(
  ctx: CanvasRenderingContext2D,
  t: number,
  selected: Hotspot,
  focus: number,
  hovered: HitId,
) {
  const w = CW
  const h = CH
  const accent = selected.accent
  ctx.textAlign = 'left'
  paintWallpaper(ctx, w, h, t, accent)
  paintStatusBar(ctx, w, accent)

  // Header glow
  const hg = ctx.createRadialGradient(w * 0.3, 260, 10, w * 0.3, 260, 380)
  hg.addColorStop(0, hexAlpha(accent, 0.28))
  hg.addColorStop(1, 'transparent')
  ctx.fillStyle = hg
  ctx.fillRect(0, 100, w, 420)

  roundRect(ctx, w / 2 - 92, 96, 184, 44, 22)
  ctx.fillStyle = '#030507'
  ctx.fill()

  const backHover = hovered === 'back'
  roundRect(ctx, 48, 128, 140, 56, 28)
  ctx.fillStyle = backHover ? hexAlpha(accent, 0.35) : 'rgba(255,255,255,0.1)'
  ctx.fill()
  ctx.strokeStyle = backHover ? accent : 'rgba(255,255,255,0.22)'
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.fillStyle = '#fff'
  ctx.font = font(600, 28)
  ctx.fillText('‹  Back', 72, 164)

  // Kind chip
  ctx.font = font(700, 20)
  const kindText = selected.kind.toUpperCase()
  const kw = ctx.measureText(kindText).width + 28
  roundRect(ctx, 56, 204, kw, 36, 18)
  ctx.fillStyle = hexAlpha(accent, 0.18)
  ctx.fill()
  ctx.strokeStyle = hexAlpha(accent, 0.6)
  ctx.lineWidth = 1.25
  ctx.stroke()
  ctx.fillStyle = accent
  ctx.fillText(kindText, 70, 229)

  ctx.fillStyle = '#fff'
  ctx.font = font(700, 46)
  const titleEnd = wrapText(ctx, selected.title, 56, 296, w - 112, 50, 2)

  ctx.fillStyle = 'rgba(200, 235, 255, 0.9)'
  ctx.font = font(500, 26)
  wrapText(ctx, selected.subtitle, 56, titleEnd + 14, w - 112, 34, 2)

  // Content card
  roundRect(ctx, 48, 420, w - 96, 760, 40)
  const cf = ctx.createLinearGradient(48, 420, w - 48, 1180)
  cf.addColorStop(0, 'rgba(255,255,255,0.13)')
  cf.addColorStop(1, 'rgba(255,255,255,0.05)')
  ctx.fillStyle = cf
  ctx.fill()
  ctx.strokeStyle = hexAlpha(accent, 0.5)
  ctx.lineWidth = 1.75
  ctx.stroke()
  roundRect(ctx, 48, 420, 7, 760, 4)
  ctx.fillStyle = accent
  ctx.fill()

  ctx.fillStyle = 'rgba(240,248,246,0.95)'
  ctx.font = font(400, 27)
  let by = 470
  by = wrapText(ctx, selected.body, 80, by, w - 160, 36, 4) + 20

  for (const b of (selected.bullets ?? []).slice(0, 5)) {
    ctx.save()
    ctx.shadowColor = accent
    ctx.shadowBlur = 8
    ctx.fillStyle = accent
    ctx.beginPath()
    ctx.arc(86, by - 8, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    ctx.fillStyle = 'rgba(230,238,236,0.88)'
    ctx.font = font(400, 24)
    by = wrapText(ctx, b, 104, by, w - 180, 32, 2) + 14
  }

  let tx = 56
  let ty = 1220
  ctx.font = font(600, 18)
  for (const tag of selected.tags.slice(0, 6)) {
    const tw = ctx.measureText(tag).width + 28
    if (tx + tw > w - 56) {
      tx = 56
      ty += 44
    }
    roundRect(ctx, tx, ty, tw, 34, 17)
    ctx.fillStyle = hexAlpha(accent, 0.14)
    ctx.fill()
    ctx.strokeStyle = hexAlpha(accent, 0.55)
    ctx.lineWidth = 1.25
    ctx.stroke()
    ctx.fillStyle = accent
    ctx.fillText(tag, tx + 14, ty + 23)
    tx += tw + 10
  }

  roundRect(ctx, w / 2 - 70, h - 48, 140, 10, 5)
  ctx.fillStyle = 'rgba(255,255,255,0.45)'
  ctx.fill()

  if (focus > 0.15) {
    const v = ctx.createRadialGradient(w / 2, h / 2, w * 0.12, w / 2, h / 2, w * 0.85)
    v.addColorStop(0, 'transparent')
    v.addColorStop(1, `rgba(0,0,0,${0.1 + focus * 0.15})`)
    ctx.fillStyle = v
    ctx.fillRect(0, 0, w, h)
  }
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxW: number,
  lineH: number,
  maxLines: number,
) {
  const words = text.split(/\s+/)
  let line = ''
  let lines = 0
  let cy = y
  for (let i = 0; i < words.length; i++) {
    const test = line ? `${line} ${words[i]}` : words[i]
    if (ctx.measureText(test).width > maxW && line) {
      const out = lines === maxLines - 1 ? `${line}…` : line
      ctx.fillText(out, x, cy)
      lines++
      cy += lineH
      line = words[i]
      if (lines >= maxLines) return cy
    } else {
      line = test
    }
  }
  if (line && lines < maxLines) {
    ctx.fillText(line, x, cy)
    cy += lineH
  }
  return cy
}

function findHotspot(id: string) {
  return hotspots.find((h) => h.id === id) ?? null
}

/** Back-camera lens: metal ring, black glass, tinted coating, highlight */
function Lens({ position, r }: { position: [number, number, number]; r: number }) {
  return (
    <group position={position}>
      <mesh>
        <circleGeometry args={[r, 40]} />
        <meshPhysicalMaterial color="#9aa5b5" metalness={1} roughness={0.18} clearcoat={1} />
      </mesh>
      <mesh position={[0, 0, 0.002]}>
        <circleGeometry args={[r * 0.82, 40]} />
        <meshPhysicalMaterial color="#05070a" metalness={0.9} roughness={0.08} clearcoat={1} />
      </mesh>
      <mesh position={[0, 0, 0.004]}>
        <circleGeometry args={[r * 0.52, 32]} />
        <meshBasicMaterial color="#14283f" />
      </mesh>
      <mesh position={[0, 0, 0.005]}>
        <circleGeometry args={[r * 0.26, 24]} />
        <meshBasicMaterial color="#2c5b8f" />
      </mesh>
      <mesh position={[-r * 0.28, r * 0.3, 0.006]}>
        <circleGeometry args={[r * 0.1, 12]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.75} />
      </mesh>
    </group>
  )
}

export function NeuralPhone() {
  const group = useRef<THREE.Group>(null)
  const inner = useRef<THREE.Group>(null)
  const glowMesh = useRef<THREE.Mesh>(null)
  const glowMat = useRef<THREE.MeshBasicMaterial>(null)
  const rimMat = useRef<THREE.MeshBasicMaterial>(null)
  const glassMat = useRef<THREE.MeshBasicMaterial>(null)
  const lightRef = useRef<THREE.PointLight>(null)
  const islandLight = useRef<THREE.PointLight>(null)
  const focus = useRef(0)
  const paintTick = useRef(0)
  const hoveredHit = useRef<HitId>(null)
  const { camera } = useThree()
  const { selected, select, setPhoneFocus } = usePortfolioStore()

  const screen = useMemo(() => createScreenTexture(), [])
  const glowTex = useMemo(() => createGlowTexture(), [])
  const screenGeo = useMemo(() => createRoundedPlane(1.04, 2.18, 0.118), [])
  const lookQuat = useRef(new THREE.Quaternion())
  const faceQuat = useRef(new THREE.Quaternion())
  const wobbleEuler = useRef(new THREE.Euler())
  const faceHelper = useRef(new THREE.Object3D())
  const fontsLoaded = useRef(false)

  const accent = selected?.accent ?? '#34D399'

  useEffect(() => {
    void ensureFonts().then(() => {
      fontsLoaded.current = true
    })
  }, [])

  const applyHit = (hit: HitId) => {
    if (!hit) return
    if (hit === 'back') {
      select(null)
      return
    }
    const hs = findHotspot(APP_HOTSPOT[hit])
    if (hs) select(selected?.id === hs.id ? null : hs)
  }

  const onScreenPointer = (e: ThreeEvent<PointerEvent>) => {
    if (!e.uv || focus.current < 0.25) return
    e.stopPropagation()
    const hit = hitTest(e.uv.x, e.uv.y, Boolean(selected))
    hoveredHit.current = hit
    document.body.style.cursor = hit || focus.current > 0.35 ? 'pointer' : 'auto'
  }

  const onScreenClick = (e: ThreeEvent<MouseEvent>) => {
    if (!e.uv || focus.current < 0.2) return
    e.stopPropagation()
    applyHit(hitTest(e.uv.x, e.uv.y, Boolean(selected)))
  }

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    const dist = camera.position.length()
    const raw = 1 - THREE.MathUtils.clamp((dist - MIN_DIST) / (MAX_DIST - MIN_DIST), 0, 1)
    const targetFocus = smoothstep(0.12, 0.9, raw)
    focus.current = THREE.MathUtils.damp(focus.current, targetFocus, 4.6, dt)
    const f = focus.current
    setPhoneFocus(f)

    if (group.current) {
      const scale = THREE.MathUtils.lerp(1, 1.85, f)
      group.current.scale.setScalar(THREE.MathUtils.damp(group.current.scale.x, scale, 5.4, dt))
      const pullY = THREE.MathUtils.lerp(0.12, 0.2, Math.max(0, (f - 0.45) / 0.55))
      const floatY = Math.sin(t * 0.75) * 0.035 * (1 - f)
      group.current.position.y = THREE.MathUtils.damp(group.current.position.y, pullY + floatY, 6.2, dt)
      group.current.position.x = THREE.MathUtils.damp(group.current.position.x, 0, 5, dt)
      group.current.position.z = THREE.MathUtils.damp(group.current.position.z, f * 0.15, 5, dt)
    }

    if (inner.current) {
      const lean = Math.max(0, 1 - f * 0.92)
      wobbleEuler.current.set(
        Math.sin(t * 0.2) * 0.028 * lean + state.pointer.y * -0.12 * lean,
        Math.sin(t * 0.3) * 0.1 * lean + state.pointer.x * 0.16 * lean,
        state.pointer.x * -0.035 * lean,
      )
      lookQuat.current.setFromEuler(wobbleEuler.current)
      faceHelper.current.position.set(0, 0.12, 0)
      faceHelper.current.lookAt(camera.position)
      faceQuat.current.copy(faceHelper.current.quaternion)
      lookQuat.current.slerp(faceQuat.current, Math.min(1, f * 1.05))
      inner.current.quaternion.slerp(lookQuat.current, 1 - Math.exp(-9 * dt))
    }

    // Backlight always faces the camera
    if (glowMesh.current) glowMesh.current.quaternion.copy(camera.quaternion)
    if (glowMat.current) {
      glowMat.current.color.set(accent)
      glowMat.current.opacity = 0.2 + f * 0.16 + Math.sin(t * 1.3) * 0.02
    }

    if (rimMat.current) {
      rimMat.current.color.set(accent)
      rimMat.current.opacity = 0.16 + f * 0.28 + Math.sin(t * 2) * 0.02
    }
    if (glassMat.current) {
      glassMat.current.opacity = 0.04 + f * 0.03
    }
    if (lightRef.current) {
      lightRef.current.intensity = 0.55 + f * 0.7
      lightRef.current.color.set(accent)
    }
    if (islandLight.current) {
      islandLight.current.intensity = 0.14 + Math.sin(t * 2.8) * 0.04 + f * 0.14
      islandLight.current.color.set(accent)
    }

    paintTick.current += dt
    if (paintTick.current > 0.04) {
      paintTick.current = 0
      if (selected) paintDetail(screen.ctx, t, selected, f, hoveredHit.current)
      else paintHome(screen.ctx, t, accent, f, hoveredHit.current)
      screen.texture.needsUpdate = true
    }
  })

  return (
    <group ref={group} position={[0, 0.12, 0]}>
      {/* Soft accent backlight (billboard) */}
      <mesh ref={glowMesh} position={[0, 0, -0.35]} renderOrder={-1}>
        <planeGeometry args={[4.2, 4.6]} />
        <meshBasicMaterial
          ref={glowMat}
          map={glowTex}
          color={accent}
          transparent
          opacity={0.22}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      <group ref={inner}>
        {/* Outer titanium shell */}
        <RoundedBox args={[1.16, 2.36, 0.112]} radius={0.168} smoothness={18}>
          <meshPhysicalMaterial
            color="#39414d"
            metalness={1}
            roughness={0.26}
            clearcoat={0.9}
            clearcoatRoughness={0.1}
            envMapIntensity={2}
          />
        </RoundedBox>

        {/* Polished side rail highlight */}
        <RoundedBox args={[1.17, 2.37, 0.058]} radius={0.168} smoothness={14} position={[0, 0, 0]}>
          <meshPhysicalMaterial
            color="#dfe6f1"
            metalness={1}
            roughness={0.08}
            clearcoat={0.7}
            transparent
            opacity={0.5}
            envMapIntensity={2.6}
          />
        </RoundedBox>

        {/* Accent rim */}
        <RoundedBox args={[1.182, 2.382, 0.034]} radius={0.17} smoothness={12} position={[0, 0, 0.012]}>
          <meshBasicMaterial ref={rimMat} color={accent} transparent opacity={0.32} />
        </RoundedBox>

        {/* Thin front bezel */}
        <RoundedBox args={[1.1, 2.28, 0.016]} radius={0.14} smoothness={14} position={[0, 0, 0.056]}>
          <meshPhysicalMaterial
            color="#020306"
            metalness={0.8}
            roughness={0.22}
            clearcoat={1}
            clearcoatRoughness={0.06}
          />
        </RoundedBox>

        {/* Screen — rounded geometry so corners match the bezel */}
        <mesh
          geometry={screenGeo}
          position={[0, 0.01, 0.066]}
          onPointerMove={onScreenPointer}
          onPointerOut={() => {
            hoveredHit.current = null
            document.body.style.cursor = 'auto'
          }}
          onClick={onScreenClick}
          onPointerDown={(e) => {
            if (focus.current > 0.2) e.stopPropagation()
          }}
        >
          <meshBasicMaterial map={screen.texture} toneMapped={false} />
        </mesh>

        {/* Specular glass streaks */}
        <mesh position={[0.28, 0.35, 0.07]} rotation={[0, 0, -0.45]}>
          <planeGeometry args={[0.12, 1.35]} />
          <meshBasicMaterial
            ref={glassMat}
            color="#ffffff"
            transparent
            opacity={0.04}
            depthWrite={false}
          />
        </mesh>
        <mesh position={[0.44, 0.2, 0.0705]} rotation={[0, 0, -0.45]}>
          <planeGeometry args={[0.035, 1.1]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.03} depthWrite={false} />
        </mesh>

        {/* Dynamic island */}
        <RoundedBox args={[0.44, 0.1, 0.03]} radius={0.048} position={[0, 0.92, 0.076]}>
          <meshPhysicalMaterial
            color="#010203"
            metalness={0.95}
            roughness={0.18}
            clearcoat={1}
            clearcoatRoughness={0.1}
          />
        </RoundedBox>
        <mesh position={[0.12, 0.92, 0.093]}>
          <circleGeometry args={[0.024, 28]} />
          <meshBasicMaterial color="#0c121a" />
        </mesh>
        <mesh position={[0.12, 0.92, 0.095]}>
          <circleGeometry args={[0.012, 24]} />
          <meshPhysicalMaterial color="#1c3a55" metalness={0.9} roughness={0.15} />
        </mesh>
        <mesh position={[0.12, 0.92, 0.096]}>
          <circleGeometry args={[0.004, 16]} />
          <meshBasicMaterial color="#4a90c8" />
        </mesh>
        <mesh position={[-0.09, 0.92, 0.093]}>
          <circleGeometry args={[0.013, 16]} />
          <meshBasicMaterial color="#080c12" />
        </mesh>

        {/* Side buttons (action, vol up, vol down, power) */}
        <RoundedBox args={[0.02, 0.07, 0.042]} radius={0.008} position={[-0.595, 0.52, 0]}>
          <meshPhysicalMaterial color="#4a5566" metalness={1} roughness={0.14} clearcoat={0.6} />
        </RoundedBox>
        <RoundedBox args={[0.02, 0.13, 0.042]} radius={0.008} position={[-0.595, 0.34, 0]}>
          <meshPhysicalMaterial color="#4a5566" metalness={1} roughness={0.14} clearcoat={0.6} />
        </RoundedBox>
        <RoundedBox args={[0.02, 0.13, 0.042]} radius={0.008} position={[-0.595, 0.16, 0]}>
          <meshPhysicalMaterial color="#4a5566" metalness={1} roughness={0.14} clearcoat={0.6} />
        </RoundedBox>
        <RoundedBox args={[0.02, 0.3, 0.042]} radius={0.008} position={[0.595, 0.3, 0]}>
          <meshPhysicalMaterial color="#4a5566" metalness={1} roughness={0.14} clearcoat={0.6} />
        </RoundedBox>

        {/* Back glass */}
        <RoundedBox args={[1.08, 2.26, 0.012]} radius={0.15} position={[0, 0, -0.054]}>
          <meshPhysicalMaterial
            color="#1a212c"
            metalness={0.85}
            roughness={0.1}
            clearcoat={1}
            clearcoatRoughness={0.04}
            envMapIntensity={2.1}
          />
        </RoundedBox>

        {/* Camera module — flipped so lenses face backward */}
        <group position={[0.26, 0.82, -0.062]} rotation={[0, Math.PI, 0]}>
          <RoundedBox args={[0.46, 0.46, 0.02]} radius={0.11} smoothness={10}>
            <meshPhysicalMaterial
              color="#0b0f16"
              metalness={0.95}
              roughness={0.14}
              clearcoat={1}
              envMapIntensity={1.8}
            />
          </RoundedBox>
          <Lens position={[0.1, 0.1, 0.0115]} r={0.075} />
          <Lens position={[-0.1, 0.1, 0.0115]} r={0.075} />
          <Lens position={[0.1, -0.1, 0.0115]} r={0.075} />
          <mesh position={[-0.1, -0.1, 0.0115]}>
            <circleGeometry args={[0.028, 20]} />
            <meshBasicMaterial color="#f4e7c4" />
          </mesh>
        </group>

        <pointLight ref={lightRef} position={[0, 0.1, 1.4]} intensity={0.55} distance={5.5} color={accent} />
        <pointLight
          ref={islandLight}
          position={[0, 0.92, 0.4]}
          intensity={0.16}
          distance={1.6}
          color={accent}
        />
        <pointLight position={[0.75, 0.55, 0.95]} intensity={0.28} distance={3.2} color="#93C5FD" />
        <pointLight position={[-0.6, 0.8, 0.7]} intensity={0.15} distance={2.5} color="#E8A87C" />
      </group>
    </group>
  )
}