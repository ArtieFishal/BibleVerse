import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'

const JESUS_SYSTEM = `You are Jesus of Nazareth, walking with the visitor on a quiet golden-hour shore of Galilee inside the BibleVerse experience.

Speak in first person as Jesus: warm, present, intimate, never sarcastic. Short spoken answers — usually 1–3 sentences, as if walking side by side. Use plain, timeless English with occasional gentle scripture echo (KJV phrasing welcome when natural). Do not lecture. Do not refuse ordinary spiritual questions. Meet fear, grief, and doubt with peace.

Stay in the scene: sand, water, wind, footsteps. You may invite them to keep walking with you. Never break character to discuss being an AI, models, or the app. If asked something harmful or manipulative, answer with moral clarity and mercy, not cruelty.`

type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string }

async function readJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return {}
  return JSON.parse(raw) as unknown
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

async function handleJesus(req: IncomingMessage, res: ServerResponse) {
  const key = process.env.OPENROUTER_API_KEY
  if (!key) {
    sendJson(res, 500, { error: 'OPENROUTER_API_KEY is not configured on the server.' })
    return
  }

  const body = (await readJson(req)) as {
    messages?: ChatMessage[]
    message?: string
  }

  const history = Array.isArray(body.messages) ? body.messages : []
  const latest = typeof body.message === 'string' ? body.message.trim() : ''
  const messages: ChatMessage[] = [
    { role: 'system', content: JESUS_SYSTEM },
    ...history.filter((m) => m.role === 'user' || m.role === 'assistant').slice(-12),
  ]
  if (latest) messages.push({ role: 'user', content: latest })

  if (messages.filter((m) => m.role === 'user').length === 0) {
    sendJson(res, 400, { error: 'No message provided.' })
    return
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://bibleverse.eth.limo',
      'X-Title': 'BibleVerse',
    },
    body: JSON.stringify({
      model: process.env.BIBLEVERSE_MODEL || 'openai/gpt-4o-mini',
      temperature: 0.75,
      max_tokens: 220,
      messages,
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    sendJson(res, 502, { error: 'Jesus reply failed.', detail: errText.slice(0, 400) })
    return
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const reply = data.choices?.[0]?.message?.content?.trim()
  if (!reply) {
    sendJson(res, 502, { error: 'Empty reply from model.' })
    return
  }

  sendJson(res, 200, { reply })
}

async function handleTts(req: IncomingMessage, res: ServerResponse) {
  const key = process.env.OPENAI_API_KEY
  if (!key) {
    sendJson(res, 503, { error: 'TTS unavailable', fallback: true })
    return
  }

  const body = (await readJson(req)) as { text?: string }
  const text = typeof body.text === 'string' ? body.text.trim() : ''
  if (!text) {
    sendJson(res, 400, { error: 'No text provided.' })
    return
  }

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini-tts',
      voice: 'onyx',
      input: text.slice(0, 900),
      response_format: 'mp3',
    }),
  })

  if (!response.ok) {
    const fallback = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice: 'onyx',
        input: text.slice(0, 900),
        response_format: 'mp3',
      }),
    })
    if (!fallback.ok) {
      const errText = await fallback.text()
      sendJson(res, 502, { error: 'TTS failed', detail: errText.slice(0, 300), fallback: true })
      return
    }
    const buf = Buffer.from(await fallback.arrayBuffer())
    res.statusCode = 200
    res.setHeader('Content-Type', 'audio/mpeg')
    res.end(buf)
    return
  }

  const buf = Buffer.from(await response.arrayBuffer())
  res.statusCode = 200
  res.setHeader('Content-Type', 'audio/mpeg')
  res.end(buf)
}

function attachApi(
  middlewares: {
    use: (
      fn: (req: IncomingMessage, res: ServerResponse, next: () => void) => void,
    ) => void
  },
) {
  middlewares.use(async (req, res, next) => {
    try {
      if (req.method === 'POST' && req.url === '/api/jesus') {
        await handleJesus(req, res)
        return
      }
      if (req.method === 'POST' && req.url === '/api/tts') {
        await handleTts(req, res)
        return
      }
    } catch (err) {
      sendJson(res, 500, {
        error: err instanceof Error ? err.message : 'Server error',
      })
      return
    }
    next()
  })
}

export function jesusApiPlugin(): Plugin {
  return {
    name: 'bibleverse-jesus-api',
    configureServer(server) {
      attachApi(server.middlewares)
    },
    configurePreviewServer(server) {
      attachApi(server.middlewares)
    },
  }
}
