import { useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { XR } from '@react-three/xr'
import { Suspense } from 'react'
import { xrStore } from '../xrStore'
import { FILMS, getFilm, type FilmEntry } from './filmCatalog'
import { FilmEnvironment } from './FilmEnvironment'

interface Props {
  onExit: () => void
}

export function FilmTheater({ onExit }: Props) {
  const [filmId, setFilmId] = useState<string>(FILMS[0].id)
  const [playing, setPlaying] = useState(true)
  const [showInfo, setShowInfo] = useState(false)
  const [soundOn, setSoundOn] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const film = getFilm(filmId)

  // Keep fullscreen state in sync (Esc / native controls).
  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const selectFilm = (id: string) => {
    setFilmId(id)
    setPlaying(true) // user gesture → unmuted playback is allowed
    setSoundOn(true)
    setShowInfo(false)
  }

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen()
    } else {
      // Entering fullscreen is a user gesture: enable sound while we're at it.
      setSoundOn(true)
      void containerRef.current?.requestFullscreen?.()
    }
  }

  return (
    <div className={`film-theater${isFullscreen ? ' is-fullscreen' : ''}`} ref={containerRef}>
      <Canvas
        dpr={[1, 2]}
        camera={{ fov: 60, near: 0.1, far: 120, position: [0, 1.6, 9.2] }}
        gl={{ antialias: true, powerPreference: 'high-performance', toneMappingExposure: 1.1 }}
      >
        <XR store={xrStore}>
          <Suspense fallback={null}>
            <FilmEnvironment film={film} soundOn={soundOn} />
          </Suspense>
        </XR>
      </Canvas>

      <TheaterUI
        film={film}
        playing={playing}
        showInfo={showInfo}
        soundOn={soundOn}
        isFullscreen={isFullscreen}
        onSelect={(id) => selectFilm(id)}
        onToggleSound={() => setSoundOn((s) => !s)}
        onToggleInfo={() => setShowInfo((s) => !s)}
        onFullscreen={toggleFullscreen}
        onExit={onExit}
      />
    </div>
  )
}

function TheaterUI({
  film,
  playing,
  showInfo,
  soundOn,
  isFullscreen,
  onSelect,
  onToggleSound,
  onToggleInfo,
  onFullscreen,
  onExit,
}: {
  film: FilmEntry
  playing: boolean
  showInfo: boolean
  soundOn: boolean
  isFullscreen: boolean
  onSelect: (id: string) => void
  onToggleSound: () => void
  onToggleInfo: () => void
  onFullscreen: () => void
  onExit: () => void
}) {
  return (
    <div className={`theater-ui${playing && !showInfo ? ' minimal' : ''}${isFullscreen ? ' hidden' : ''}`}>
      <div className="theater-top">
        <button type="button" className="btn tiny" onClick={onExit}>
          ← Beach walk
        </button>
        <div className="theater-top-right">
          <button type="button" className="btn tiny" onClick={onToggleSound}>
            {soundOn ? '🔊 Sound' : '🔇 Muted'}
          </button>
          <button type="button" className="btn tiny" onClick={onFullscreen}>
            ⛶ Fullscreen
          </button>
          <button type="button" className="btn tiny" onClick={() => void xrStore.enterVR()}>
            Enter VR
          </button>
        </div>
      </div>

      {!playing && (
        <div className="theater-title">
          <h1>{film.title}</h1>
          <p className="theater-subtitle">{film.subtitle}</p>
        </div>
      )}

      {showInfo && (
        <>
          <div className="theater-blurb">{film.blurb}</div>
          <div className="theater-verse">
            <p>“{film.verse}”</p>
            <span>— {film.reference}</span>
          </div>
        </>
      )}

      <div className="theater-bottom">
        {playing && (
          <button type="button" className="btn tiny info-toggle" onClick={onToggleInfo}>
            {showInfo ? 'Hide info' : 'Show info'}
          </button>
        )}
        <div className="film-strip">
          {FILMS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`film-chip${f.id === film.id ? ' active' : ''}`}
              onClick={() => onSelect(f.id)}
              style={{ '--accent': f.accent } as React.CSSProperties}
            >
              {f.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
