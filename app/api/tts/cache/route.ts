import { NextRequest } from 'next/server'
import { fetchQuery, fetchMutation } from 'convex/nextjs'
import { api } from '@/convex/_generated/api'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')
    console.log('🎵 TTS Cache GET request:', { projectId })

    if (!projectId) return new Response('Missing projectId', { status: 400 })

    const data = await fetchQuery(api.ttsAudio.GetForProject, { projectId })
    console.log('📦 TTS Cache data retrieved:', {
      projectId,
      slideCount: Object.keys(data || {}).length,
      slides: Object.entries(data || {}).map(([slideIdx, items]) => ({
        slideIndex: slideIdx,
        itemCount: (items as any[]).length,
        hasUrls: (items as any[]).every((item: any) => item.audioUrl || item.audioDataUrl)
      }))
    })

    // Transform audioUrl to audioDataUrl for backward compatibility with present-voice mode
    const transformedData: Record<string, any> = {}
    for (const [slideIdx, items] of Object.entries(data || {})) {
      transformedData[slideIdx] = (items as any[]).map((item: any) => ({
        ...item,
        audioDataUrl: item.audioUrl || item.audioDataUrl, // Map audioUrl to audioDataUrl
        audioUrl: item.audioUrl // Keep original audioUrl too
      }))
    }

    console.log('✅ TTS Cache response prepared:', {
      slideCount: Object.keys(transformedData).length,
      transformed: true
    })

    return Response.json(transformedData)
  } catch (e: any) {
    console.error('❌ TTS Cache GET failed:', e)
    return new Response('Fetch failed: ' + (e?.message || ''), { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { projectId, items } = await req.json()
    if (!projectId || !Array.isArray(items)) return new Response('Invalid body', { status: 400 })

    // Ensure items have duration field for backward compatibility
    const itemsWithDuration = items.map(item => ({
      ...item,
      duration: item.duration || 1000 // Default duration if not provided
    }))

    const res = await fetchMutation(api.ttsAudio.SaveTTSBatch, { projectId, items: itemsWithDuration })
    return Response.json(res)
  } catch (e: any) {
    return new Response('Persist failed: ' + (e?.message || ''), { status: 500 })
  }
}
