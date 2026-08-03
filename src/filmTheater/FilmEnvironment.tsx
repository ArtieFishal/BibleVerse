import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Stars, Sky } from '@react-three/drei'
import type { FilmEntry } from './filmCatalog'

/**
 * Themed 3D environment for a film. Kept intentionally atmospheric — a quiet
 * space with a large curved screen, gentle light, and theme elements that
 * suggest the story without being a full game world.
 */
export function FilmEnvironment({ film, soundOn }: { film: FilmEntry; soundOn: boolean }) {
  return (
    <group>
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 6, 4]} intensity={0.7} color={film.accent} />
      <pointLight position={[0, 2, -6]} intensity={0.5} color={film.accent} distance={20} />

      {/* Curved screen — a large cylinder segment facing the viewer */}
      <Screen film={film} soundOn={soundOn} />

      {/* Theme dressing */}
      <ThemeDressing theme={film.theme} sky={film.sky} />

      {/* Soft ground glow / floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.2, 0]}>
        <circleGeometry args={[14, 48]} />
        <meshStandardMaterial color="#0a0d12" roughness={0.9} metalness={0} transparent opacity={0.7} />
      </mesh>
    </group>
  )
}

function Screen({ film, soundOn }: { film: FilmEntry; soundOn: boolean }) {
  const ref = useRef<THREE.Mesh>(null)
  // Curved screen: a cylinder arc, radius ~8.5, spanning ~120deg, facing -Z
  const { radius, arc, height } = { radius: 8.5, arc: (120 * Math.PI) / 180, height: 5.6 }

  const geometry = useMemo(() => {
    const geo = new THREE.CylinderGeometry(radius, radius, height, 48, 1, true, -arc / 2, arc)
    // Cylinder UVs wrap around; remap so video is not distorted left-right
    geo.rotateY(Math.PI) // bring open side to face viewer
    return geo
  }, [radius, arc, height])

  const video = useMemo(() => {
    const v = document.createElement('video')
    v.src = film.video
    v.crossOrigin = 'anonymous'
    v.loop = true
    v.muted = !soundOn
    v.playsInline = true
    v.preload = 'auto'
    return v
  }, [film.video, soundOn])

  const texture = useMemo(() => {
    const tex = new THREE.VideoTexture(video)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.wrapS = THREE.ClampToEdgeWrapping
    tex.wrapT = THREE.ClampToEdgeWrapping
    tex.minFilter = THREE.LinearFilter
    tex.magFilter = THREE.LinearFilter
    return tex
  }, [video])

  useFrame(() => {
    if (video.readyState >= 2 && ref.current) {
      texture.needsUpdate = true
    }
  })

  // Start playback as soon as the video can play. When sound is on, the
  // caller must have triggered this from a user gesture (film chip click) —
  // Chromium requires a gesture before unmuted playback is allowed.
  useEffect(() => {
    let cancelled = false
    const tryPlay = () => {
      if (cancelled) return
      video.play().catch(() => {
        // Fallback: retry on the next pointer interaction (muted autoplay
        // is allowed everywhere, sound needs a gesture).
        const onGesture = () => {
          video.muted = !soundOn
          video.play().catch(() => {})
          window.removeEventListener('pointerdown', onGesture)
        }
        window.addEventListener('pointerdown', onGesture)
      })
    }
    if (video.readyState >= 2) tryPlay()
    else video.addEventListener('loadeddata', tryPlay, { once: true })
    return () => {
      cancelled = true
      video.pause()
      video.removeAttribute('src')
      video.load()
    }
  }, [video, soundOn])

  return (
    <mesh ref={ref} geometry={geometry} position={[0, 0, 0]}>
      <meshBasicMaterial map={texture} side={THREE.BackSide} toneMapped={false} />
    </mesh>
  )
}

function ThemeDressing({ theme, sky }: { theme: FilmEntry['theme']; sky: string }) {
  switch (theme) {
    case 'beach':
      return (
        <>
          <Sky distance={4000} sunPosition={[5, 1, -8]} turbidity={6} rayleigh={1} />
          <Stars radius={120} depth={40} count={600} factor={3} fade speed={0.4} />
        </>
      )
    case 'ark':
      return (
        <>
          <color attach="background" args={[sky]} />
          <Stars radius={120} depth={40} count={500} factor={2} fade speed={0.3} />
        </>
      )
    case 'stable':
      return (
        <>
          <color attach="background" args={[sky]} />
          <Stars radius={120} depth={40} count={800} factor={3} fade speed={0.3} />
          <StableBeams />
        </>
      )
    case 'desert':
      return (
        <>
          <color attach="background" args={[sky]} />
          <Stars radius={140} depth={60} count={1400} factor={4} fade speed={0.4} />
          <DuneRing />
        </>
      )
    case 'upperroom':
      return (
        <>
          <color attach="background" args={[sky]} />
          <LampGlow />
        </>
      )
    case 'tombgarden':
      return (
        <>
          <color attach="background" args={[sky]} />
          <Stars radius={120} depth={40} count={700} factor={3} fade speed={0.2} />
          <GardenTrees />
        </>
      )
    case 'seashore':
      return (
        <>
          <color attach="background" args={[sky]} />
          <Stars radius={150} depth={70} count={1600} factor={4} fade speed={0.4} />
          <SeashoreWater />
        </>
      )
    default:
      return <color attach="background" args={[sky]} />
  }
}

/** Wooden beams for the stable */
function StableBeams() {
  return (
    <group position={[0, 2.6, -6]}>
      {[-3, 0, 3].map((x) => (
        <mesh key={x} position={[x, 0.4, 0]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.18, 0.18, 5]} />
          <meshStandardMaterial color="#6b4f2a" roughness={0.85} />
        </mesh>
      ))}
    </group>
  )
}

/** Low dunes ring (desert) */
function DuneRing() {
  return (
    <group position={[0, -2.2, 0]}>
      {Array.from({ length: 14 }).map((_, i) => {
        const a = (i / 14) * Math.PI * 2
        const r = 10 + (i % 3) * 1.5
        return (
          <mesh key={i} position={[Math.cos(a) * r, -0.5, Math.sin(a) * r]} rotation={[-Math.PI / 2, 0, a]}>
            <planeGeometry args={[5, 1.2]} />
            <meshStandardMaterial color="#3a3024" roughness={1} />
          </mesh>
        )
      })}
    </group>
  )
}

/** Warm lamp glow for the upper room */
function LampGlow() {
  const ref = useRef<THREE.PointLight>(null)
  useFrame(({ clock }) => {
    if (ref.current) ref.current.intensity = 0.5 + Math.sin(clock.elapsedTime * 0.8) * 0.06
  })
  return <pointLight ref={ref} position={[0, 2.4, -4]} color="#ffd9a0" intensity={0.6} distance={16} />
}

/** A few simple olive trees (tomb garden) */
function GardenTrees() {
  return (
    <group>
      {[-5, -2, 3, 6].map((x, i) => (
        <group key={x} position={[x, -2.1, -7 - (i % 2) * 2]}>
          <mesh position={[0, 1, 0]}>
            <cylinderGeometry args={[0.12, 0.2, 2.2, 6]} />
            <meshStandardMaterial color="#4a3a24" roughness={0.9} />
          </mesh>
          <mesh position={[0, 2.4, 0]}>
            <sphereGeometry args={[1.1, 10, 10]} />
            <meshStandardMaterial color="#33402a" roughness={0.95} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** Dark sea plane with gentle shimmer (Red Sea) */
function SeashoreWater() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (ref.current) {
      const m = ref.current.material as THREE.MeshStandardMaterial
      m.emissiveIntensity = 0.25 + Math.sin(clock.elapsedTime * 0.6) * 0.08
    }
  })
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.1, -12]}>
      <planeGeometry args={[60, 30]} />
      <meshStandardMaterial color="#0d2430" emissive="#123a4a" emissiveIntensity={0.3} roughness={0.4} metalness={0.3} />
    </mesh>
  )
}
