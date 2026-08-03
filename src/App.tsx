import { useState } from 'react'
import { StartScreen } from './ui/StartScreen'
import { FilmTheater } from './filmTheater/FilmTheater'
import { FilmPlayer } from './ui/FilmPlayer'

type Mode = 'start' | 'beach' | 'theater'

const BEACH_FILM = {
  src: 'films/beachwalk.mp4',
  title: 'Walk Together',
  verse: 'And Jesus said unto him, Rise, take up thy bed, and walk.',
  reference: 'John 5:8',
}

export default function App() {
  const [mode, setMode] = useState<Mode>('start')

  if (mode === 'theater') {
    return (
      <div className="app">
        <FilmTheater onExit={() => setMode('start')} />
      </div>
    )
  }

  if (mode === 'beach') {
    return (
      <div className="app">
        <FilmPlayer
          src={BEACH_FILM.src}
          title={BEACH_FILM.title}
          verse={BEACH_FILM.verse}
          reference={BEACH_FILM.reference}
          onExit={() => setMode('start')}
        />
      </div>
    )
  }

  return (
    <div className="app">
      <StartScreen
        onBeginWalk={() => setMode('beach')}
        onFilmTheater={() => setMode('theater')}
      />
    </div>
  )
}
