import { useExperienceStore, WAYPOINTS } from '../store/experienceStore'
import { xrStore } from '../xrStore'

export function HUD() {
  const started = useExperienceStore((s) => s.started)
  const muted = useExperienceStore((s) => s.muted)
  const setMuted = useExperienceStore((s) => s.setMuted)
  const visited = useExperienceStore((s) => s.visitedWaypoints)
  const progress = useExperienceStore((s) => s.progress)

  if (!started) return null

  return (
    <div className="hud">
      <div className="hud-brand">BibleVerse</div>
      <div className="hud-actions">
        <span className="hud-progress">
          {visited.length}/{WAYPOINTS.length} · {Math.round(progress * 100)}%
        </span>
        <button type="button" className="btn tiny" onClick={() => setMuted(!muted)}>
          {muted ? 'Sound off' : 'Sound on'}
        </button>
        <button type="button" className="btn tiny" onClick={() => void xrStore.enterVR()}>
          VR
        </button>
      </div>
      <div className="walk-meter" aria-hidden="true">
        <div className="walk-meter-fill" style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  )
}
