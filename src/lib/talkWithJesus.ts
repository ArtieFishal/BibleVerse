import type { ChatMessage } from '../store/conversationStore'

export async function askJesus(messages: ChatMessage[], message: string): Promise<string> {
  const res = await fetch('/api/jesus', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, message }),
  })
  const data = (await res.json()) as { reply?: string; error?: string }
  if (!res.ok || !data.reply) {
    throw new Error(data.error || 'Could not reach Him just now.')
  }
  return data.reply
}

export async function speakJesus(text: string): Promise<() => void> {
  const stoppers: Array<() => void> = []

  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })

    if (res.ok && res.headers.get('content-type')?.includes('audio')) {
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audio.volume = 0.95
      await audio.play()
      stoppers.push(() => {
        audio.pause()
        URL.revokeObjectURL(url)
      })
      await new Promise<void>((resolve) => {
        audio.onended = () => resolve()
        audio.onerror = () => resolve()
      })
      URL.revokeObjectURL(url)
      return () => stoppers.forEach((s) => s())
    }
  } catch {
    // Fall through to browser speech.
  }

  if ('speechSynthesis' in window) {
    await new Promise<void>((resolve) => {
      const utter = new SpeechSynthesisUtterance(text)
      utter.rate = 0.92
      utter.pitch = 0.85
      utter.onend = () => resolve()
      utter.onerror = () => resolve()
      stoppers.push(() => window.speechSynthesis.cancel())
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utter)
    })
  }

  return () => stoppers.forEach((s) => s())
}
