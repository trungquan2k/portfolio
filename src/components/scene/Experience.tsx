import { Suspense, useEffect, useRef, type MutableRefObject, type ReactNode } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  Environment,
  OrbitControls,
  Stars,
  ContactShadows,
} from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import {
  EffectComposer,
  Bloom,
  Vignette,
  Noise,
  ChromaticAberration,
} from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'
import { hotspots } from '../../data/portfolio'
import { usePortfolioStore } from '../../hooks/usePortfolioStore'
import { NeuralField } from './NeuralField'
import { OrbitRings } from './OrbitRings'
import { NeuralPhone } from './NeuralPhone'
import { HotspotNode } from './HotspotNode'
import { Platform } from './Platform'
import { BrandMark } from './BrandMark'
import { WireCage } from './WireCage'
import { DataDebris } from './DataDebris'
import { DataStreams } from './DataStreams'
import { FloatingGlyphs } from './FloatingGlyphs'
import { BrainWeb } from './BrainWeb'
import { ConnectionLines } from './ConnectionLines'
import { SparkleBurst } from './SparkleBurst'
import { MeteorSwarm } from './MeteorSwarm'
import { ZoomFocus } from './ZoomFocus'

/** Tilts mid-scene with pointer — doesn't fight OrbitControls. */
function ParallaxRig({ children }: { children: ReactNode }) {
  const rig = useRef<THREE.Group>(null)
  const { introDone } = usePortfolioStore()

  useFrame((state, dt) => {
    if (!rig.current || !introDone) return
    const mx = state.pointer.x
    const my = state.pointer.y
    const targetX = my * -0.06
    const targetY = mx * 0.09
    const k = 1 - Math.exp(-5 * dt)
    rig.current.rotation.x += (targetX - rig.current.rotation.x) * k
    rig.current.rotation.y += (targetY - rig.current.rotation.y) * k
    rig.current.position.x += (mx * 0.12 - rig.current.position.x) * k
    rig.current.position.y += (my * -0.08 - rig.current.position.y) * k
  })

  return <group ref={rig}>{children}</group>
}

function PointerAberration({
  offsetRef,
}: {
  offsetRef: MutableRefObject<THREE.Vector2>
}) {
  useFrame((state) => {
    const mx = state.pointer.x
    const my = state.pointer.y
    offsetRef.current.set(0.0012 + Math.abs(mx) * 0.001, 0.0009 + Math.abs(my) * 0.0008)
  })
  return null
}

/** Default orbit pose at max zoom-out (distance = 15). */
const HOME_POS = new THREE.Vector3(5.8, 2.6, 13.6).normalize().multiplyScalar(15)

function CameraIntro() {
  const { camera } = useThree()
  const { introDone, setIntroDone } = usePortfolioStore()
  const progress = useRef(0)

  useEffect(() => {
    // Start already at max zoom-out — no dive-in
    camera.position.copy(HOME_POS)
    camera.lookAt(0, 0.2, 0)
  }, [camera])

  useFrame((_, dt) => {
    if (introDone) return
    const step = Math.min(dt, 0.05) * 0.55
    progress.current = Math.min(1, progress.current + step)
    camera.position.lerp(HOME_POS, 0.12)
    camera.lookAt(0, 0.2, 0)
    if (progress.current >= 1) setIntroDone(true)
  })

  return null
}

function SceneContent() {
  const { autoRotate, select, introDone } = usePortfolioStore()
  const controls = useRef<OrbitControlsImpl>(null)
  const chromaOffset = useRef(new THREE.Vector2(0.0014, 0.0011))
  const bg = '#02050a'

  return (
    <>
      <PointerAberration offsetRef={chromaOffset} />
      <color attach="background" args={[bg]} />
      <fog attach="fog" args={[bg, 9, 26]} />

      <ambientLight intensity={0.2} />
      <directionalLight position={[5, 8, 4]} intensity={0.75} color="#cfefff" />
      <directionalLight position={[-4, 2, -3]} intensity={0.4} color="#E8A87C" />

      <Stars radius={70} depth={50} count={5000} factor={3.4} saturation={0} fade speed={1} />
      <NeuralField />

      <ParallaxRig>
        <BrainWeb />
        <ConnectionLines />
        <SparkleBurst />
        <MeteorSwarm />
        <WireCage />
        <DataDebris />
        <DataStreams />
        <FloatingGlyphs />
        <OrbitRings />
        <Platform />
        <BrandMark />
        <NeuralPhone />

        {hotspots.map((h) => (
          <HotspotNode key={h.id} hotspot={h} />
        ))}

        <ContactShadows
          position={[0, -1.59, 0]}
          opacity={0.55}
          scale={14}
          blur={2.8}
          far={6}
          color="#000000"
        />
      </ParallaxRig>

      <Environment preset="city" environmentIntensity={0.35} />

      <OrbitControls
        ref={controls}
        enabled={introDone}
        enablePan={false}
        enableDamping
        dampingFactor={0.06}
        minDistance={3.5}
        maxDistance={15}
        minPolarAngle={0.3}
        maxPolarAngle={Math.PI / 1.6}
        autoRotate={autoRotate}
        autoRotateSpeed={0.55}
        zoomSpeed={1.05}
      />

      <ZoomFocus controls={controls} />

      <mesh visible={false} onClick={() => select(null)} position={[0, 0, 0]}>
        <sphereGeometry args={[20, 8, 8]} />
        <meshBasicMaterial side={THREE.BackSide} />
      </mesh>

      <CameraIntro />

      <EffectComposer enableNormalPass={false} multisampling={0}>
        <Bloom luminanceThreshold={0.55} intensity={1.15} mipmapBlur luminanceSmoothing={0.3} />
        <ChromaticAberration blendFunction={BlendFunction.NORMAL} offset={chromaOffset.current} />
        <Vignette offset={0.18} darkness={0.8} />
        <Noise opacity={0.055} />
      </EffectComposer>
    </>
  )
}

export function Experience() {
  return (
    <Canvas
      className="experience-canvas"
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      camera={{
        fov: 48,
        near: 0.1,
        far: 80,
        position: [HOME_POS.x, HOME_POS.y, HOME_POS.z],
      }}
    >
      <Suspense fallback={null}>
        <SceneContent />
      </Suspense>
    </Canvas>
  )
}
