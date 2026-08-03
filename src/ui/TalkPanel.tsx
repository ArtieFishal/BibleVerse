import { useCallback, useEffect, useRef, useState } from 'react'
import { askJesus, speakJesus } from '../lib/talkWithJesus'
import { useConversationStore } from '../store/conversationStore'
import { useExperienceStore } from '../store/experienceStore'

type SpeechRecognitionResultLike = {
  isFinal: boolean
  0: { transcript: string }
}

type SpeechRecognitionLike = {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  onresult: ((event: { results: ArrayLike<SpeechRecognitionResultLike> }) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
}

function getRecognition(): SpeechRecognitionLike | null {
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRecognitionLike
    webkitSpeechRecognition?: new () => SpeechRecognitionLike
  }
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition
  return Ctor ? new Ctor() : null
}

export function TalkPanel() {
  const started = useExperienceStore((s) => s.started)
  const muted = useExperienceStore((s) => s.muted)
  const {
    draft,
    setDraft,
    listening,
    setListening,
    thinking,
    setThinking,
    speaking,
    setSpeaking,
    lastReply,
    setLastReply,
    messages,
    pushMessage,
    error,
    setError,
  } = useConversationStore()

  const [micSupported, setMicSupported] = useState(true)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const stopSpeechRef = useRef<(() => void) | null>(null)
  const busy = thinking || speaking

  useEffect(() => {
    setMicSupported(Boolean(getRecognition()))
  }, [])

  const ask = useCallback(
    async (text: string) => {
      const cleaned = text.trim()
      if (!cleaned || busy) return

      setError(null)
      setDraft('')
      pushMessage({ role: 'user', content: cleaned })
      setThinking(true)

      try {
        const history = useConversationStore.getState().messages
        const reply = await askJesus(history.slice(0, -1), cleaned)
        pushMessage({ role: 'assistant', content: reply })
        setLastReply(reply)
        setThinking(false)

        if (!muted) {
          setSpeaking(true)
          stopSpeechRef.current = await speakJesus(reply)
          setSpeaking(false)
          stopSpeechRef.current = null
        }
      } catch (err) {
        setThinking(false)
        setSpeaking(false)
        setError(err instanceof Error ? err.message : 'The shore went quiet. Try again.')
      }
    },
    [busy, muted, pushMessage, setDraft, setError, setLastReply, setSpeaking, setThinking],
  )

  const toggleMic = () => {
    if (busy) return

    if (listening && recognitionRef.current) {
      recognitionRef.current.stop()
      setListening(false)
      return
    }

    const recognition = getRecognition()
    if (!recognition) {
      setMicSupported(false)
      setError('Voice is not available in this browser — type your question below.')
      return
    }

    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1]
      const transcript = result?.[0]?.transcript ?? ''
      setDraft(transcript)
    }
    recognition.onerror = () => {
      setListening(false)
      setError('Could not hear you — try typing instead.')
    }
    recognition.onend = () => {
      setListening(false)
      const text = useConversationStore.getState().draft.trim()
      if (text) void ask(text)
    }

    recognitionRef.current = recognition
    setError(null)
    setListening(true)
    recognition.start()
  }

  if (!started) return null

  return (
    <div className={`talk-panel${speaking ? ' speaking' : ''}`}>
      {lastReply && (
        <div className="jesus-subtitle" aria-live="polite">
          <p className="jesus-subtitle-label">Jesus</p>
          <p className="jesus-subtitle-text">{lastReply}</p>
        </div>
      )}

      <form
        className="talk-form"
        onSubmit={(e) => {
          e.preventDefault()
          void ask(draft)
        }}
      >
        <button
          type="button"
          className={`talk-mic${listening ? ' active' : ''}`}
          onClick={toggleMic}
          disabled={busy || !micSupported}
          aria-label={listening ? 'Stop listening' : 'Ask with your voice'}
          title={micSupported ? 'Hold a question in your voice' : 'Mic unavailable'}
        >
          {listening ? 'Listening…' : 'Ask Him'}
        </button>
        <input
          className="talk-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={thinking ? 'He is answering…' : 'Ask Him anything…'}
          disabled={busy}
          aria-label="Ask Jesus"
        />
        <button type="submit" className="talk-send" disabled={busy || !draft.trim()}>
          Send
        </button>
      </form>

      {error && <p className="talk-error">{error}</p>}
      {thinking && !error && <p className="talk-status">He turns toward you…</p>}
      {speaking && <p className="talk-status">Speaking…</p>}
      {messages.length === 0 && !thinking && (
        <p className="talk-hint">Walk beside Him. When you are ready — ask.</p>
      )}
    </div>
  )
}
