import { useExperienceStore } from '../store/experienceStore'

export function ScriptureCard() {
  const scripture = useExperienceStore((s) => s.activeScripture)
  const started = useExperienceStore((s) => s.started)

  if (!started || !scripture) return null

  return (
    <div className="scripture-card" key={scripture.id}>
      <p className="scripture-ref">{scripture.reference}</p>
      <p className="scripture-text">“{scripture.text}”</p>
    </div>
  )
}
