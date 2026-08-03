#!/usr/bin/env node
/**
 * Generate rigged-ready GLB characters from greenscreen plates via Meshy API.
 *
 * Usage:
 *   MESHY_API_KEY=... node scripts/generate-characters-meshy.mjs
 *
 * Requires public HTTPS URLs for the plates, or pass base64 automatically
 * from local files under public/images/.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const key = process.env.MESHY_API_KEY

if (!key) {
  console.error('Set MESHY_API_KEY to generate Meshy GLBs.')
  process.exit(1)
}

const jobs = [
  { file: 'jesus-greenscreen.png', out: 'jesus.glb' },
  { file: 'disciple-a-greenscreen.png', out: 'disciple-a.glb' },
  { file: 'disciple-b-greenscreen.png', out: 'disciple-b.glb' },
]

mkdirSync(resolve(root, 'public/models'), { recursive: true })

async function createTask(imageDataUri) {
  const res = await fetch('https://api.meshy.ai/openapi/v1/image-to-3d', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_url: imageDataUri,
      should_texture: true,
      enable_pbr: true,
      target_formats: ['glb'],
      ai_model: 'latest',
    }),
  })
  if (!res.ok) throw new Error(`create failed: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.result || data.id
}

async function poll(taskId) {
  for (;;) {
    const res = await fetch(`https://api.meshy.ai/openapi/v1/image-to-3d/${taskId}`, {
      headers: { Authorization: `Bearer ${key}` },
    })
    const data = await res.json()
    const status = data.status
    process.stdout.write(`\r${taskId} ${status} ${data.progress ?? ''}%   `)
    if (status === 'SUCCEEDED') return data
    if (status === 'FAILED') throw new Error(data.task_error?.message || 'failed')
    await new Promise((r) => setTimeout(r, 5000))
  }
}

for (const job of jobs) {
  const bytes = readFileSync(resolve(root, 'public/images', job.file))
  const dataUri = `data:image/png;base64,${bytes.toString('base64')}`
  console.log(`\nCreating Meshy task for ${job.file}...`)
  const id = await createTask(dataUri)
  const done = await poll(id)
  const glbUrl = done.model_urls?.glb
  if (!glbUrl) throw new Error('No GLB URL')
  const glb = Buffer.from(await (await fetch(glbUrl)).arrayBuffer())
  const outPath = resolve(root, 'public/models', job.out)
  writeFileSync(outPath, glb)
  console.log(`\nWrote ${outPath} (${glb.length} bytes)`)
}

console.log('\nDone. Drop GLBs into the experience when ready.')
