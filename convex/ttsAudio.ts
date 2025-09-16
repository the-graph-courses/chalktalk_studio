import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

export const SaveTTSBatch = mutation({
  args: {
    projectId: v.string(),
    items: v.array(v.object({
      slideIndex: v.number(),
      elementIndex: v.number(),
      ttsText: v.string(),
      audioDataUrl: v.string(),
      duration: v.number(),
    }))
  },
  handler: async (ctx, { projectId, items }) => {
    // Clear existing entries for project to avoid duplicates
    const existing = await ctx.db.query('TTSAudioTable').withIndex('by_project', q => q.eq('projectId', projectId)).collect()
    for (const row of existing) await ctx.db.delete(row._id)

    const now = Date.now()
    for (const it of items) {
      await ctx.db.insert('TTSAudioTable', {
        projectId,
        slideIndex: it.slideIndex,
        elementIndex: it.elementIndex,
        ttsText: it.ttsText,
        audioDataUrl: it.audioDataUrl,
        duration: it.duration,
        createdAt: now,
      })
    }
    return { saved: items.length }
  }
})

export const GetForProject = query({
  args: { projectId: v.string() },
  handler: async (ctx, { projectId }) => {
    const rows = await ctx.db.query('TTSAudioTable').withIndex('by_project', q => q.eq('projectId', projectId)).collect()
    // Group by slide index
    const grouped: Record<number, { elementIndex: number; ttsText: string; audioDataUrl: string; duration: number }[]> = {}
    for (const r of rows) {
      const arr = (grouped[r.slideIndex] ||= [])
      arr.push({ elementIndex: r.elementIndex, ttsText: r.ttsText, audioDataUrl: r.audioDataUrl, duration: r.duration })
    }
    // Sort by elementIndex
    const entries = Object.entries(grouped).map(([k, arr]) => [Number(k), arr.sort((a, b) => a.elementIndex - b.elementIndex)])
    return Object.fromEntries(entries)
  }
})

export const ClearForProject = mutation({
  args: { projectId: v.string() },
  handler: async (ctx, { projectId }) => {
    const rows = await ctx.db.query('TTSAudioTable').withIndex('by_project', q => q.eq('projectId', projectId)).collect()
    for (const r of rows) await ctx.db.delete(r._id)
    return { cleared: rows.length }
  }
})

