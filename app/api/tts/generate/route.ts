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

export async function POST(req: NextRequest) {
  try {
    if (!ELEVEN_KEY) return new Response('Missing ElevenLabs API key', { status: 500 })
    const { projectId } = await req.json()
    if (!projectId) return new Response('Missing projectId', { status: 400 })

    const deck = await fetchQuery(api.slideDeck.GetProject, { projectId })
    if (!deck?.project) return new Response('Project not found', { status: 404 })

    const slides = extractRevealSlides(deck.project as any)
    const result: { slides: { index: number; perElement: string[]; merged?: string }[] } = { slides: [] }
    const batchItems: { slideIndex: number; elementIndex: number; ttsText: string; audioDataUrl: string }[] = []

    for (let i = 0; i < slides.length; i++) {
      const s = slides[i]
      const entries = extractTTSFromSlideHtml(s.html)
      const perElementDataUrls: string[] = []
      if (entries.length) {
        for (let j = 0; j < entries.length; j++) {
          const e = entries[j]
          const buf = await ttsBuffer(e.text, DEFAULT_VOICE)
          const b64 = Buffer.from(buf).toString('base64')
          const dataUrl = `data:audio/mpeg;base64,${b64}`
          perElementDataUrls.push(dataUrl)
          batchItems.push({ slideIndex: i, elementIndex: j, ttsText: e.text, audioDataUrl: dataUrl })
        }
      }
      // merged: for now just return first element (or concat later)
      result.slides.push({ index: i, perElement: perElementDataUrls })
    }

    // Try saving to Convex if the API is available
    try {
      // @ts-ignore dynamic access in case codegen isn't updated yet
      if ((api as any).ttsAudio?.SaveTTSBatch) {
        await fetchMutation((api as any).ttsAudio.SaveTTSBatch, { projectId, items: batchItems })
      }
    } catch (e) {
      console.warn('Failed to persist TTS batch to Convex (continuing with response):', e)
    }

    return Response.json(result)
  } catch (e: any) {
    return new Response('Generation failed: ' + (e?.message || ''), { status: 500 })
  }
}
