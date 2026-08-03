import { useExperienceStore } from '../store/experienceStore'
import { walkInput } from '../experience/CinematicScene'

export function WalkControls() {
  const started = useExperienceStore((s) => s.started)
  const walking = useExperienceStore((s) => s.walking)

  if (!started) return null

  return (
    <div className="walk-controls">
      <button
        type="button"
        className={`walk-btn${walking ? ' active' : ''}`}
        onPointerDown={(e) => {
          e.preventDefault()
          walkInput.forward = 1
        }}
        onPointerUp={() => {
          walkInput.forward = 0
        }}
        onPointerLeave={() => {
          walkInput.forward = 0
        }}
        onPointerCancel={() => {
          walkInput.forward = 0
        }}
      >
        Hold to walk
      </button>
      <p className="walk-hint">Walk along the shore · W / ↑ / Space</p>
    </div>
  )
}
