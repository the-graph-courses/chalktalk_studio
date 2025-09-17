import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

// Generate an upload URL for storing audio files
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl()
  }
})

export const SaveTTSBatch = mutation({
  args: {
    projectId: v.string(),
    items: v.array(v.object({
      slideIndex: v.number(),
      elementIndex: v.number(),
      ttsText: v.string(),
      audioFileId: v.id('_storage'),
      duration: v.number(),
    }))
  },
  handler: async (ctx, { projectId, items }) => {
    // Clear existing entries for project to avoid duplicates
    const existing = await ctx.db.query('TTSAudioTable').withIndex('by_project', q => q.eq('projectId', projectId)).collect()
    for (const row of existing) {
      // Delete the associated audio file from storage
      if (row.audioFileId) {
        await ctx.storage.delete(row.audioFileId)
      }
      await ctx.db.delete(row._id)
    }

    const now = Date.now()
    for (const it of items) {
      await ctx.db.insert('TTSAudioTable', {
        projectId,
        slideIndex: it.slideIndex,
        elementIndex: it.elementIndex,
        ttsText: it.ttsText,
        audioFileId: it.audioFileId,
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
    console.log('🔍 GetForProject called for:', projectId)
    const rows = await ctx.db.query('TTSAudioTable').withIndex('by_project', q => q.eq('projectId', projectId)).collect()
    console.log('📊 Found rows:', rows.length)

    // Group by slide index
    const grouped: Record<number, { elementIndex: number; ttsText: string; audioFileId: string; audioUrl: string | null; duration: number }[]> = {}
    for (const r of rows) {
      const arr = (grouped[r.slideIndex] ||= [])
      // Get the storage URL for the audio file
      const audioUrl = await ctx.storage.getUrl(r.audioFileId)
      console.log(`🎵 Generated URL for slide ${r.slideIndex}, element ${r.elementIndex}:`, {
        audioFileId: r.audioFileId,
        urlGenerated: !!audioUrl,
        urlPrefix: audioUrl ? audioUrl.substring(0, 50) + '...' : 'NULL'
      })
      arr.push({
        elementIndex: r.elementIndex,
        ttsText: r.ttsText,
        audioFileId: r.audioFileId,
        audioUrl,
        duration: r.duration
      })
    }
    // Sort by elementIndex
    const entries = Object.entries(grouped).map(([k, arr]) => [Number(k), arr.sort((a, b) => a.elementIndex - b.elementIndex)])
    const result = Object.fromEntries(entries)
    console.log('✅ Returning audio data for slides:', Object.keys(result))
    return result
  }
})

export const ClearForProject = mutation({
  args: { projectId: v.string() },
  handler: async (ctx, { projectId }) => {
    const rows = await ctx.db.query('TTSAudioTable').withIndex('by_project', q => q.eq('projectId', projectId)).collect()
    for (const r of rows) {
      // Delete the associated audio file from storage
      if (r.audioFileId) {
        await ctx.storage.delete(r.audioFileId)
      }
      await ctx.db.delete(r._id)
    }
    return { cleared: rows.length }
  }
})

