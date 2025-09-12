import { NextRequest } from 'next/server'
import { fetchQuery, fetchMutation } from 'convex/nextjs'
import { api } from '@/convex/_generated/api'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')
    if (!projectId) return new Response('Missing projectId', { status: 400 })
    // @ts-ignore dynamic path to avoid typegen dependency
    if (!(api as any).ttsAudio?.GetForProject) return Response.json({})
    const data = await fetchQuery((api as any).ttsAudio.GetForProject, { projectId })
    return Response.json(data)
  } catch (e: any) {
    return new Response('Fetch failed: ' + (e?.message || ''), { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { projectId, items } = await req.json()
    if (!projectId || !Array.isArray(items)) return new Response('Invalid body', { status: 400 })
    // @ts-ignore dynamic path to avoid typegen dependency
    if (!(api as any).ttsAudio?.SaveTTSBatch) return new Response('Endpoint not available', { status: 501 })
    const res = await fetchMutation((api as any).ttsAudio.SaveTTSBatch, { projectId, items })
    return Response.json(res)
  } catch (e: any) {
    return new Response('Persist failed: ' + (e?.message || ''), { status: 500 })
  }
}

