interface Props {
  onBeginWalk: () => void
  onFilmTheater: () => void
}

export function StartScreen({ onBeginWalk, onFilmTheater }: Props) {
  return (
    <div className="hero">
      <div className="hero-media" aria-hidden="true">
        <img src="./images/jesus-beach-hero.png" alt="" className="hero-image" />
        <div className="hero-shade" />
      </div>

      <div className="hero-content">
        <p className="brand">BibleVerse</p>
        <h1>Walk with Him on the shore</h1>
        <p className="lede">
          A golden-hour walk beside Jesus on the shore — a short film made with FLUX 3, plus a
          library of biblical short films in immersive theater view.
        </p>
        <div className="cta-row">
          <button type="button" className="btn primary" onClick={onBeginWalk}>
            ▶ Play the beach walk
          </button>
          <button type="button" className="btn ghost" onClick={onFilmTheater}>
            🎬 Film Theater
          </button>
        </div>
        <p className="hint">Fullscreen with sound · six more stories in the theater</p>
        <p className="preview-note">
          This is just the beginning — these films are a preview of the kinds of immersive VR
          experiences to come.
        </p>
      </div>
    </div>
  )
}
