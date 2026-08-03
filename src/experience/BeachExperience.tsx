import { Canvas } from '@react-three/fiber'
import { XR } from '@react-three/xr'
import { Suspense } from 'react'
import { xrStore } from '../xrStore'
import { AmbientAudio } from './AmbientAudio'
import { CinematicScene } from './CinematicScene'

export function BeachExperience() {
  return (
    <>
      <AmbientAudio />
      <Canvas
        dpr={[1, 2]}
        camera={{ fov: 48, near: 0.1, far: 80, position: [-7.5, 1.55, 3.2] }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          toneMappingExposure: 1.08,
        }}
      >
        <XR store={xrStore}>
          <Suspense fallback={null}>
            <CinematicScene />
          </Suspense>
        </XR>
      </Canvas>
    </>
  )
}
