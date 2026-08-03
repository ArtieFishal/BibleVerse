import { useCallback, useEffect, useRef, useState } from 'react'
import { useExperienceStore } from '../store/experienceStore'

function isTouchDevice() {
  return typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)
}

export function MobileJoystick() {
  const started = useExperienceStore((s) => s.started)
  const setMobileInput = useExperienceStore((s) => s.setMobileInput)
  const [visible, setVisible] = useState(false)
  const baseRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const [knob, setKnob] = useState({ x: 0, y: 0 })

  useEffect(() => {
    setVisible(isTouchDevice())
  }, [])

  const updateFromPoint = useCallback(
    (clientX: number, clientY: number) => {
      const base = baseRef.current
      if (!base) return
      const rect = base.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      let dx = clientX - cx
      let dy = clientY - cy
      const max = rect.width / 2 - 18
      const len = Math.hypot(dx, dy)
      if (len > max) {
        dx = (dx / len) * max
        dy = (dy / len) * max
      }
      setKnob({ x: dx, y: dy })
      // y forward walks the cinematic path; x is look/parallax
      setMobileInput({
        x: dx / max,
        y: -dy / max,
      })
    },
    [setMobileInput],
  )

  const end = useCallback(() => {
    dragging.current = false
    setKnob({ x: 0, y: 0 })
    setMobileInput({ x: 0, y: 0 })
  }, [setMobileInput])

  if (!started || !visible) return null

  return (
    <div
      className="joystick"
      ref={baseRef}
      onPointerDown={(e) => {
        dragging.current = true
        e.currentTarget.setPointerCapture(e.pointerId)
        updateFromPoint(e.clientX, e.clientY)
      }}
      onPointerMove={(e) => {
        if (!dragging.current) return
        updateFromPoint(e.clientX, e.clientY)
      }}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <div className="joystick-knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
    </div>
  )
}
