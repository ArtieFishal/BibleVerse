import { useEffect, useRef, useState } from 'react'

interface Props {
  src: string
  title: string
  verse?: string
  reference?: string
  onExit: () => void
}

/**
 * Fullscreen film player for the beach walk. Plays the finished "Walk
 * Together" film (audio on, started from a user gesture) instead of the
 * interactive VR scene.
 */
export function FilmPlayer({ src, title, verse, reference, onExit }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const start = () => {
    const v = videoRef.current
    if (!v) return
    v.muted = false
    void v.play()
    setPlaying(true)
  }

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggleFullscreen = () => {
    const el = document.getElementById('film-player')
    if (document.fullscreenElement) {
      void document.exitFullscreen()
    } else {
      void el?.requestFullscreen?.()
    }
  }

  return (
    <div id="film-player" className={`film-player${isFullscreen ? ' is-fullscreen' : ''}`}>
      <video
        ref={videoRef}
        src={src}
        loop
        playsInline
        preload="auto"
        onClick={() => {
          const v = videoRef.current
          if (!v) return
          if (v.paused) start()
          else v.pause()
        }}
      />

      {!playing && (
        <div className="film-player-start">
          <h1>{title}</h1>
          <button type="button" className="btn primary" onClick={start}>
            ▶ Play film
          </button>
        </div>
      )}

      <div className="film-player-top">
        <button type="button" className="btn tiny" onClick={onExit}>
          ← Back
        </button>
        <div className="film-player-top-right">
          <button type="button" className="btn tiny" onClick={toggleFullscreen}>
            {isFullscreen ? '⛶ Exit fullscreen' : '⛶ Fullscreen'}
          </button>
        </div>
      </div>

      {verse && (
        <button
          type="button"
          className={`btn tiny film-player-info${showInfo ? ' open' : ''}`}
          onClick={() => setShowInfo((s) => !s)}
        >
          {showInfo ? 'Hide verse' : 'Verse'}
        </button>
      )}

      {showInfo && verse && (
        <div className="film-player-verse">
          <p>“{verse}”</p>
          <span>— {reference}</span>
        </div>
      )}
    </div>
  )
}
