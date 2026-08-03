import { useEffect, useRef } from 'react'
import { useConversationStore } from '../store/conversationStore'
import { useExperienceStore } from '../store/experienceStore'

/** Soft procedural wave ambience + footstep pulse — no external audio files. */
export function AmbientAudio() {
  const muted = useExperienceStore((s) => s.muted)
  const started = useExperienceStore((s) => s.started)
  const walking = useExperienceStore((s) => s.walking)
  const speaking = useConversationStore((s) => s.speaking)

  const ctxRef = useRef<AudioContext | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)
  const surfGainRef = useRef<GainNode | null>(null)
  const stepGainRef = useRef<GainNode | null>(null)
  const stepTimer = useRef<number | null>(null)

  useEffect(() => {
    if (!started) return

    const ctx = new AudioContext()
    ctxRef.current = ctx
    const master = ctx.createGain()
    master.gain.value = muted ? 0 : 1
    master.connect(ctx.destination)
    masterGainRef.current = master

    const surfGain = ctx.createGain()
    surfGain.gain.value = 0.2
    surfGain.connect(master)
    surfGainRef.current = surfGain

    const stepGain = ctx.createGain()
    stepGain.gain.value = 0
    stepGain.connect(master)
    stepGainRef.current = stepGain

    const bufferSize = 2 * ctx.sampleRate
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    let last = 0
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      last = (last + 0.02 * white) / 1.02
      data[i] = last * 3.5
    }

    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    noise.loop = true

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 520
    filter.Q.value = 0.7

    const lfo = ctx.createOscillator()
    lfo.type = 'sine'
    lfo.frequency.value = 0.08
    const lfoGain = ctx.createGain()
    lfoGain.gain.value = 140
    lfo.connect(lfoGain)
    lfoGain.connect(filter.frequency)

    noise.connect(filter)
    filter.connect(surfGain)
    noise.start()
    lfo.start()

    void ctx.resume()

    return () => {
      if (stepTimer.current) window.clearInterval(stepTimer.current)
      noise.stop()
      lfo.stop()
      void ctx.close()
      ctxRef.current = null
      masterGainRef.current = null
      surfGainRef.current = null
      stepGainRef.current = null
    }
  }, [started])

  useEffect(() => {
    if (!ctxRef.current || !masterGainRef.current) return
    const ctx = ctxRef.current
    const g = masterGainRef.current.gain
    const t = ctx.currentTime
    g.cancelScheduledValues(t)
    g.linearRampToValueAtTime(muted ? 0 : 1, t + 0.25)
  }, [muted])

  useEffect(() => {
    if (!ctxRef.current || !surfGainRef.current) return
    const ctx = ctxRef.current
    const g = surfGainRef.current.gain
    const t = ctx.currentTime
    const target = speaking ? 0.06 : 0.2
    g.cancelScheduledValues(t)
    g.linearRampToValueAtTime(target, t + 0.35)
  }, [speaking])

  useEffect(() => {
    if (!ctxRef.current || !stepGainRef.current) return
    const ctx = ctxRef.current

    if (stepTimer.current) {
      window.clearInterval(stepTimer.current)
      stepTimer.current = null
    }

    if (!walking || muted || speaking) {
      const g = stepGainRef.current.gain
      g.cancelScheduledValues(ctx.currentTime)
      g.linearRampToValueAtTime(0, ctx.currentTime + 0.1)
      return
    }

    const pulse = () => {
      if (!ctxRef.current || !stepGainRef.current) return
      const c = ctxRef.current
      const osc = c.createOscillator()
      const filter = c.createBiquadFilter()
      const env = c.createGain()
      osc.type = 'sine'
      osc.frequency.value = 78
      filter.type = 'lowpass'
      filter.frequency.value = 180
      env.gain.value = 0
      osc.connect(filter)
      filter.connect(env)
      env.connect(stepGainRef.current)
      const now = c.currentTime
      env.gain.linearRampToValueAtTime(0.045, now + 0.02)
      env.gain.exponentialRampToValueAtTime(0.001, now + 0.18)
      osc.start(now)
      osc.stop(now + 0.2)
    }

    stepGainRef.current.gain.value = 1
    pulse()
    stepTimer.current = window.setInterval(pulse, 420)

    return () => {
      if (stepTimer.current) {
        window.clearInterval(stepTimer.current)
        stepTimer.current = null
      }
    }
  }, [walking, muted, speaking])

  return null
}
