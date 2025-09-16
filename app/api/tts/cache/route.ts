import { NextRequest } from 'next/server'
import { fetchQuery, fetchMutation } from 'convex/nextjs'
import { api } from '@/convex/_generated/api'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')
    if (!projectId) return new Response('Missing projectId', { status: 400 })
    const data = await fetchQuery(api.ttsAudio.GetForProject, { projectId })
    return Response.json(data)
  } catch (e: any) {
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
