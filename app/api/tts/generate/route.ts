import { NextRequest } from 'next/server'
import { fetchQuery, fetchMutation } from 'convex/nextjs'
import { api } from '@/convex/_generated/api'
import { extractRevealSlides } from '@/lib/reveal-export'
import { extractTTSFromSlideHtml } from '@/lib/tts-extract'

const ELEVEN_KEY = process.env.ELEVENLABS_API_KEY || process.env.ELEVENLABSAPIKEY
const DEFAULT_VOICE = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'

async function ttsBuffer(text: string, voiceId: string) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVEN_KEY!,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({ text, model_id: 'eleven_turbo_v2', optimize_streaming_latency: 0 })
  })
  if (!res.ok) throw new Error(await res.text().catch(() => 'TTS error'))
  return await res.arrayBuffer()
}

async function calculateAudioDuration(audioBuffer: ArrayBuffer): Promise<number> {
  try {
    const { parseBuffer } = await import('music-metadata')
    const metadata = await parseBuffer(Buffer.from(audioBuffer))
    return Math.round((metadata.format.duration || 0) * 1000) // Convert to milliseconds
  } catch (error) {
    console.error('Error calculating audio duration:', error)
    // Fallback: estimate based on typical TTS speed (roughly 150 words per minute)
    // This is a rough estimation if metadata parsing fails
    return 1000 // Default to 1 second
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!ELEVEN_KEY) return new Response('Missing ElevenLabs API key', { status: 500 })
    const { projectId } = await req.json()
    if (!projectId) return new Response('Missing projectId', { status: 400 })

    const deck = await fetchQuery(api.slideDeck.GetProject, { projectId })
    if (!deck?.project) return new Response('Project not found', { status: 404 })

    const slides = extractRevealSlides(deck.project as any)
    const result: { slides: { index: number; perElement: string[]; merged?: string }[] } = { slides: [] }
    const batchItems: { slideIndex: number; elementIndex: number; ttsText: string; audioDataUrl: string; duration: number }[] = []

    for (let i = 0; i < slides.length; i++) {
      const s = slides[i]
      const entries = extractTTSFromSlideHtml(s.html)
      const perElementDataUrls: string[] = []
      if (entries.length) {
        for (let j = 0; j < entries.length; j++) {
          const e = entries[j]
          const buf = await ttsBuffer(e.text, DEFAULT_VOICE)
          const duration = await calculateAudioDuration(buf)
          const b64 = Buffer.from(buf).toString('base64')
          const dataUrl = `data:audio/mpeg;base64,${b64}`
          perElementDataUrls.push(dataUrl)
          batchItems.push({ slideIndex: i, elementIndex: j, ttsText: e.text, audioDataUrl: dataUrl, duration })
        }
      } else {
        // Fallback: single clip from slide text
        const text = s.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
        if (text) {
          const buf = await ttsBuffer(text, DEFAULT_VOICE)
          const duration = await calculateAudioDuration(buf)
          const b64 = Buffer.from(buf).toString('base64')
          const dataUrl = `data:audio/mpeg;base64,${b64}`
          perElementDataUrls.push(dataUrl)
          batchItems.push({ slideIndex: i, elementIndex: 0, ttsText: text, audioDataUrl: dataUrl, duration })
        }
      }
      // merged: for now just return first element (or concat later)
      result.slides.push({ index: i, perElement: perElementDataUrls })
    }

    // Persist to Convex
    const persistRes = await fetchMutation(api.ttsAudio.SaveTTSBatch, { projectId, items: batchItems })

    return Response.json({ ...result, saved: persistRes?.saved ?? batchItems.length })
  } catch (e: any) {
    return new Response('Generation failed: ' + (e?.message || ''), { status: 500 })
  }
}
