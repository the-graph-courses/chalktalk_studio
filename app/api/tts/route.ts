import { NextRequest } from 'next/server'

const ELEVEN_KEY = process.env.ELEVENLABS_API_KEY || process.env.ELEVENLABSAPIKEY
const DEFAULT_VOICE = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM' // Rachel

export async function POST(req: NextRequest) {
  try {
    if (!ELEVEN_KEY) {
      return new Response('Missing ElevenLabs API key', { status: 500 })
    }
    const { text, voiceId } = await req.json()
    if (!text || typeof text !== 'string') {
      return new Response('Invalid text', { status: 400 })
    }
    const vId = (voiceId && String(voiceId)) || DEFAULT_VOICE
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(vId)}`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVEN_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2',
        optimize_streaming_latency: 0,
        voice_settings: { stability: 0.5, similarity_boost: 0.5 },
      }),
    })
    if (!res.ok) {
      const err = await res.text().catch(() => '')
      return new Response(`TTS failed: ${err}`, { status: 500 })
    }
    const buf = await res.arrayBuffer()
    return new Response(buf, { status: 200, headers: { 'Content-Type': 'audio/mpeg' } })
  } catch (e) {
    return new Response('Server error', { status: 500 })
  }
}

