import { NextRequest } from 'next/server'
import { fetchQuery, fetchMutation } from 'convex/nextjs'
import { api } from '@/convex/_generated/api'
import { extractRevealSlides } from '@/lib/reveal-export'
import { extractTTSFromSlideHtml } from '@/lib/tts-extract'
import { JSDOM } from 'jsdom'

const ELEVEN_KEY = process.env.ELEVENLABS_API_KEY || process.env.ELEVENLABSAPIKEY
const DEFAULT_VOICE = process.env.ELEVENLABS_VOICE_ID || 'TX3LPaxmHKxFdv7VOQHJ'

async function ttsBuffer(text: string, voiceId: string) {
  console.log('🔊 Making TTS request to ElevenLabs:', {
    textLength: text.length,
    voiceId: voiceId.substring(0, 8) + '...',
    textPreview: text.substring(0, 100) + (text.length > 100 ? '...' : '')
  })

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVEN_KEY!,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2', optimize_streaming_latency: 0 })
    })
    if (!res.ok) {
      const errorText = await res.text().catch(() => 'TTS error')
      console.error('❌ ElevenLabs API error:', { status: res.status, error: errorText })
      throw new Error(errorText)
    }
    const buf = await res.arrayBuffer()
    console.log('✅ TTS audio buffer received:', { size: buf.byteLength })
    return buf
  } catch (fetchError: any) {
    console.error('❌ TTS fetch error:', fetchError)
    throw new Error(`TTS request failed: ${fetchError?.message || 'Unknown fetch error'}`)
  }
}

async function calculateAudioDuration(audioBuffer: ArrayBuffer): Promise<number> {
  console.log('⏱️ Calculating audio duration for buffer:', { size: audioBuffer.byteLength })

  try {
    const { parseBuffer } = await import('music-metadata')
    const metadata = await parseBuffer(Buffer.from(audioBuffer))
    const durationMs = Math.round((metadata.format.duration || 0) * 1000) // Convert to milliseconds
    console.log('✅ Audio duration calculated from metadata:', {
      durationMs,
      durationSeconds: durationMs / 1000,
      format: metadata.format
    })
    return durationMs
  } catch (error: any) {
    console.error('❌ Error calculating audio duration:', error)
    return 1000 // Default to 1 second on error
  }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  console.log('\n\n--- 🚀 Starting TTS Generation ---')

  try {
    if (!ELEVEN_KEY) throw new Error('Missing ElevenLabs API key')
    const { projectId } = await req.json()
    if (!projectId) return new Response('Missing projectId', { status: 400 })

    console.log('🔍 Fetching project:', { projectId })
    const deck = await fetchQuery(api.slideDeck.GetProject, { projectId })
    if (!deck?.project) return new Response('Project not found', { status: 404 })

    console.log('📄 Extracting slides...')
    const slides = extractRevealSlides(deck.project as any)
    console.log(`✅ Found ${slides.length} slides.`)

    // Step 1: Create a flat list of all TTS tasks
    const ttsTasks = slides.flatMap((slide, slideIndex) => {
      try {
        const entries = extractTTSFromSlideHtml(slide.html)
        if (entries.length) {
          console.log(`📝 Slide ${slideIndex}: Found ${entries.length} TTS entries`)
          return entries.map((entry, elementIndex) => ({
            slideIndex,
            elementIndex,
            text: entry.text,
            taskId: `slide-${slideIndex}-entry-${elementIndex}`
          }))
        } else if (slide.html.trim().length) {
          // Fallback for slides with content but no explicit TTS tags
          const text = new JSDOM(slide.html).window.document.body.textContent?.trim() || ''
          if (text) {
            console.log(`📝 Slide ${slideIndex}: No explicit tags, using fallback text.`)
            return [{
              slideIndex,
              elementIndex: 0,
              text,
              taskId: `slide-${slideIndex}-fallback-0`
            }]
          }
        }
      } catch (e: any) {
        console.error(`❌ Error processing slide ${slideIndex}:`, e)
      }
      return [] // Return empty array if no text found or error
    })
    console.log(`- Total TTS tasks to process: ${ttsTasks.length}`)

    const processedTasks: ({ slideIndex: number; elementIndex: number; ttsText: string; audioFileId: any; duration: number } | null)[] = []

    // Process all TTS tasks in parallel with concurrency control
    // Using batch size of 9 for Creator plan (10 concurrent limit, keeping 1 as buffer)
    // Adjust this based on your ElevenLabs plan: Free=3, Starter=5, Creator=9-10, Pro=18-20
    const BATCH_SIZE = 9

    for (let i = 0; i < ttsTasks.length; i += BATCH_SIZE) {
      const batch = ttsTasks.slice(i, i + BATCH_SIZE)
      console.log(`🚀 Processing batch ${i / BATCH_SIZE + 1}/${Math.ceil(ttsTasks.length / BATCH_SIZE)} with ${batch.length} items`)

      const batchPromises = batch.map(async (task) => {
        if (!task) return null
        const { slideIndex, elementIndex, text, taskId } = task
        try {
          // Generate audio
          const buf = await ttsBuffer(text, DEFAULT_VOICE)
          console.log(`🎵 [${taskId}] TTS audio generated:`, { bufferSize: buf.byteLength })

          // Calculate duration
          const duration = await calculateAudioDuration(buf)
          console.log(`⏱️ [${taskId}] Audio duration calculated:`, { duration })

          // Store in Convex file storage using upload URL
          console.log(`💾 [${taskId}] Getting upload URL from Convex`)
          const uploadUrl = await fetchMutation(api.ttsAudio.generateUploadUrl, {})

          console.log(`📤 [${taskId}] Uploading audio to Convex storage`)
          const uploadResponse = await fetch(uploadUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'audio/mpeg' },
            body: buf
          })

          if (!uploadResponse.ok) {
            throw new Error(`Failed to upload audio: ${uploadResponse.statusText}`)
          }

          const { storageId } = await uploadResponse.json()
          const audioFileId = storageId
          console.log(`✅ [${taskId}] Audio file stored successfully:`, { audioFileId })

          return {
            slideIndex,
            elementIndex,
            ttsText: text,
            audioFileId,
            duration
          }

        } catch (error: any) {
          console.error(`❌ [${taskId}] TTS generation failed:`, error)
          throw new Error(`TTS generation failed for ${taskId}: ${error?.message || 'Unknown error'}`)
        }
      })

      // Wait for this batch to complete
      try {
        const batchResults = await Promise.all(batchPromises)
        processedTasks.push(...batchResults)
        console.log(`✅ Batch ${i / BATCH_SIZE + 1} completed.`)
      } catch (batchError: any) {
        console.error('❌ Batch processing failed:', batchError)
        // Re-throw to be caught by the main try-catch block
        throw new Error('A task within the batch failed, stopping generation.')
      }
    }

    // Persist to Convex
    console.log('💾 Persisting TTS data to Convex:', { count: processedTasks.length })
    try {
      await fetchMutation(api.ttsAudio.SaveTTSBatch, { projectId, items: processedTasks.filter(Boolean) as any })
    } catch (e: any) {
      console.error('❌ Failed to persist TTS data:', e)
      throw new Error('Failed to persist TTS data: ' + (e?.message || ''))
    }

    // Return the generated data in the same format as the cache
    const audioCache = processedTasks.reduce((acc, task) => {
      if (!task) return acc
      const { slideIndex, ...rest } = task
      if (!acc[slideIndex]) {
        acc[slideIndex] = []
      }
      acc[slideIndex].push(rest)
      return acc
    }, {} as Record<number, any[]>)

    const totalTimeMs = Date.now() - startTime
    console.log(`\n--- ✅ TTS Generation complete in ${totalTimeMs / 1000}s ---`)
    return Response.json(audioCache)

  } catch (e: any) {
    const totalTimeMs = Date.now() - startTime
    console.error(`\n--- 💥 TTS Generation failed after ${totalTimeMs / 1000}s ---`, { error: e?.message, stack: e?.stack })
    return new Response('Generation failed: ' + (e?.message || ''), { status: 500 })
  }
}
