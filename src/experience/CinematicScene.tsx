import { useTexture } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import {
  DoubleSide,
  MathUtils,
  ShaderMaterial,
  SRGBColorSpace,
  type Group,
  type Texture,
} from 'three'
import { useConversationStore } from '../store/conversationStore'
import { useExperienceStore, WAYPOINTS } from '../store/experienceStore'

const PATH_START_X = -7.5
const PATH_END_X = 7.5
const CAMERA_Z = 3.2
const CAMERA_Y = 1.55
const LOOK_AT_Z = -6

const chromaVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const chromaFrag = /* glsl */ `
  uniform sampler2D uMap;
  varying vec2 vUv;
  void main() {
    if (vUv.y < 0.03) discard;
    vec4 tex = texture2D(uMap, vUv);
    float greenDominance = tex.g - max(tex.r, tex.b);
    float key = smoothstep(0.14, 0.42, greenDominance);
    float lime = smoothstep(0.42, 0.72, tex.g) * smoothstep(0.4, 0.18, max(tex.r, tex.b));
    key = max(key, lime);
    float alpha = (1.0 - key) * tex.a;
    if (alpha < 0.18) discard;
    float edge = smoothstep(0.18, 0.55, alpha);
    vec3 color = tex.rgb * vec3(1.05, 0.98, 0.92);
    color += vec3(0.06, 0.03, 0.0) * (1.0 - edge);
    gl_FragColor = vec4(color, edge);
  }
`

function useChromaMaterial(url: string) {
  const texture = useTexture(url) as Texture
  return useMemo(() => {
    texture.colorSpace = SRGBColorSpace
    return new ShaderMaterial({
      uniforms: { uMap: { value: texture } },
      vertexShader: chromaVert,
      fragmentShader: chromaFrag,
      transparent: true,
      depthWrite: true,
      alphaTest: 0.15,
      side: DoubleSide,
    })
  }, [texture])
}

function ParallaxPlate({
  url,
  baseY,
  baseZ,
  scale,
  parallax,
}: {
  url: string
  baseY: number
  baseZ: number
  scale: [number, number]
  /** 0 = locked to world, 1 = locked to camera X */
  parallax: number
}) {
  const map = useTexture(url) as Texture
  map.colorSpace = SRGBColorSpace
  const mesh = useRef<Group>(null)

  useFrame(() => {
    if (!mesh.current) return
    const progress = useExperienceStore.getState().progress
    const camX = MathUtils.lerp(PATH_START_X, PATH_END_X, progress)
    // World-locked layers stay put; high parallax scrolls with the walker.
    mesh.current.position.x = camX * parallax
    mesh.current.position.y = baseY
    mesh.current.position.z = baseZ
  })

  return (
    <group ref={mesh}>
      <mesh>
        <planeGeometry args={scale} />
        <meshBasicMaterial map={map} depthWrite={false} />
      </mesh>
    </group>
  )
}

function CharacterPlate({
  url,
  height = 2.1,
}: {
  url: string
  height?: number
}) {
  const material = useChromaMaterial(url)
  const group = useRef<Group>(null)
  const map = material.uniforms.uMap.value as Texture
  const image = map.image as HTMLImageElement | ImageBitmap | undefined
  const aspect =
    image && typeof image.width === 'number' && image.height
      ? image.width / image.height
      : 0.55
  const width = height * Math.min(aspect, 0.68)

  useFrame(({ clock }) => {
    if (!group.current) return
    const { progress, walking } = useExperienceStore.getState()
    const speaking = useConversationStore.getState().speaking
    const camX = MathUtils.lerp(PATH_START_X, PATH_END_X, progress)

    // Companion walks slightly ahead and toward the water.
    const companionX = camX + 1.65
    const companionZ = -3.4
    group.current.position.x = companionX
    group.current.position.z = companionZ

    // Settle when He speaks; gentle bob while walking.
    const amp = speaking ? 0.004 : walking ? 0.03 : 0.007
    const speed = speaking ? 1.1 : walking ? 7.5 : 1.25
    group.current.position.y = -0.12 + Math.sin(clock.elapsedTime * speed) * amp

    // Soft turn toward the camera when answering.
    const faceCam = speaking ? 0.22 : 0.04
    group.current.rotation.y = MathUtils.lerp(group.current.rotation.y, faceCam, 0.08)
  })

  return (
    <group ref={group}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0.02]}>
        <circleGeometry args={[width * 0.28, 24]} />
        <meshBasicMaterial color="#1a1008" transparent opacity={0.35} depthWrite={false} />
      </mesh>
      <mesh position={[0, height / 2, 0]} material={material}>
        <planeGeometry args={[width, height]} />
      </mesh>
    </group>
  )
}

function ShoreGround() {
  const group = useRef<Group>(null)

  useFrame(() => {
    if (!group.current) return
    const progress = useExperienceStore.getState().progress
    const camX = MathUtils.lerp(PATH_START_X, PATH_END_X, progress)
    group.current.position.x = camX
  })

  return (
    <group ref={group} position={[0, 0, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -1]}>
        <planeGeometry args={[40, 18]} />
        <meshBasicMaterial color="#c49a6c" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 2.4]}>
        <planeGeometry args={[40, 6]} />
        <meshBasicMaterial color="#b8895a" />
      </mesh>
      {/* Near foam strip for depth cue while walking */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -5.2]}>
        <planeGeometry args={[40, 1.4]} />
        <meshBasicMaterial color="#efe6d8" transparent opacity={0.35} depthWrite={false} />
      </mesh>
    </group>
  )
}

function ForegroundAccent() {
  const mesh = useRef<Group>(null)

  useFrame(() => {
    if (!mesh.current) return
    const progress = useExperienceStore.getState().progress
    const camX = MathUtils.lerp(PATH_START_X, PATH_END_X, progress)
    // Faster than camera → sells lateral motion.
    mesh.current.position.x = camX * 1.35
  })

  return (
    <group ref={mesh} position={[0, 0.4, 1.6]}>
      <mesh>
        <planeGeometry args={[3.2, 1.1]} />
        <meshBasicMaterial color="#8a5a32" transparent opacity={0.22} depthWrite={false} />
      </mesh>
    </group>
  )
}

/** Shared input flags — updated from React UI + keyboard + pointer. */
export const walkInput = {
  forward: 0,
  keys: {} as Record<string, boolean>,
}

function CinematicCamera() {
  const { camera } = useThree()
  const started = useExperienceStore((s) => s.started)
  const bobPhase = useRef(0)

  useFrame((_, delta) => {
    if (!started) return
    const { look, setProgress, setWalking } = useExperienceStore.getState()
    const speaking = useConversationStore.getState().speaking

    const keyForward =
      walkInput.keys.KeyW ||
      walkInput.keys.ArrowUp ||
      walkInput.keys.Space ||
      walkInput.keys.KeyZ
        ? 1
        : 0
    const keyBack = walkInput.keys.KeyS || walkInput.keys.ArrowDown ? 1 : 0

    // Soften / pause walk while Jesus is speaking.
    const input = keyForward - keyBack + walkInput.forward
    const forward = speaking ? input * 0.15 : input

    const next = useExperienceStore.getState().progress + forward * 0.085 * delta
    setProgress(next)
    setWalking(Math.abs(forward) > 0.05)

    const progress = useExperienceStore.getState().progress
    const x = MathUtils.lerp(PATH_START_X, PATH_END_X, progress)

    const walking = Math.abs(forward) > 0.05
    if (walking) bobPhase.current += delta * 9
    const bob = walking ? Math.sin(bobPhase.current) * 0.028 : 0

    camera.position.set(x, CAMERA_Y + bob + look.y * 0.04, CAMERA_Z)

    // Face along the shore slightly toward the water — not into a zoom plate.
    const glanceY = -look.x * 0.08
    const glanceX = -0.08 - look.y * 0.05
    camera.rotation.order = 'YXZ'
    camera.lookAt(x + 0.35 + glanceY * 2, CAMERA_Y - 0.05 + glanceX, LOOK_AT_Z)
  })

  return null
}

function InputBridge() {
  const started = useExperienceStore((s) => s.started)
  const setLook = useExperienceStore((s) => s.setLook)
  const { gl } = useThree()

  useEffect(() => {
    if (!started) return

    gl.domElement.tabIndex = 0
    gl.domElement.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      // Don't steal keys while typing a question.
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      walkInput.keys[e.code] = true
      if (
        e.code === 'Space' ||
        e.code === 'ArrowUp' ||
        e.code === 'ArrowDown' ||
        e.code === 'KeyW' ||
        e.code === 'KeyS'
      ) {
        e.preventDefault()
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      walkInput.keys[e.code] = false
    }
    const onMove = (e: MouseEvent) => {
      const rect = gl.domElement.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1)
      setLook({ x: MathUtils.clamp(x, -1, 1), y: MathUtils.clamp(y, -1, 1) })
    }
    const onPointerDown = () => {
      gl.domElement.focus()
    }

    window.addEventListener('keydown', onKeyDown, { passive: false })
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('mousemove', onMove)
    gl.domElement.addEventListener('pointerdown', onPointerDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('mousemove', onMove)
      gl.domElement.removeEventListener('pointerdown', onPointerDown)
      walkInput.keys = {}
      walkInput.forward = 0
    }
  }, [started, gl, setLook])

  return null
}

function ScriptureTriggers() {
  useFrame(() => {
    const speaking = useConversationStore.getState().speaking
    const listening = useConversationStore.getState().listening
    // Conversation owns the emotional beat — hide scripture while talking.
    if (speaking || listening) {
      if (useExperienceStore.getState().activeScripture) {
        useExperienceStore.getState().setActiveScripture(null)
      }
      return
    }

    const { progress, activeScripture, setActiveScripture, markWaypointVisited } =
      useExperienceStore.getState()

    let hit: (typeof WAYPOINTS)[number] | null = null
    for (const wp of WAYPOINTS) {
      if (Math.abs(progress - wp.at) < 0.07) {
        hit = wp
        break
      }
    }

    if (hit) {
      if (!activeScripture || activeScripture.id !== hit.id) {
        setActiveScripture({ id: hit.id, reference: hit.reference, text: hit.text })
        markWaypointVisited(hit.id)
      }
    } else if (activeScripture) {
      setActiveScripture(null)
    }
  })
  return null
}

function WarmVignette() {
  const mesh = useRef<Group>(null)

  useFrame(() => {
    if (!mesh.current) return
    const speaking = useConversationStore.getState().speaking
    const progress = useExperienceStore.getState().progress
    const camX = MathUtils.lerp(PATH_START_X, PATH_END_X, progress)
    mesh.current.position.x = camX
    const mat = (mesh.current.children[0] as { material?: { opacity: number } } | undefined)
      ?.material
    if (mat) {
      mat.opacity = MathUtils.lerp(mat.opacity, speaking ? 0.12 : 0.04, 0.06)
    }
  })

  return (
    <group ref={mesh} position={[0, 1.6, 1.8]} renderOrder={10}>
      <mesh>
        <planeGeometry args={[10, 6]} />
        <meshBasicMaterial color="#e8a060" transparent opacity={0.04} depthWrite={false} />
      </mesh>
    </group>
  )
}

export function CinematicScene() {
  return (
    <>
      <color attach="background" args={['#1a0e08']} />
      <fog attach="fog" args={['#1a0e08', 12, 42]} />
      <ambientLight intensity={0.95} />

      <InputBridge />
      <CinematicCamera />
      <ScriptureTriggers />

      <ShoreGround />

      {/* Far ocean / sky — barely tracks camera so shore motion is obvious */}
      <ParallaxPlate
        url="./images/beach-backdrop.png"
        baseY={4.2}
        baseZ={-16}
        scale={[48, 22]}
        parallax={0.12}
      />

      <CharacterPlate url="./images/jesus-greenscreen.png" height={2.45} />

      <ForegroundAccent />
      <WarmVignette />
    </>
  )
}
