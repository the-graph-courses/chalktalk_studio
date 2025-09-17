import { NextRequest, NextResponse } from 'next/server'
import { fetchQuery } from 'convex/nextjs'
import { api } from '@/convex/_generated/api'
import { extractRevealSlides } from '@/lib/reveal-export'
import { JSDOM } from 'jsdom'

const ELEVEN_KEY = process.env.ELEVENLABS_API_KEY || process.env.ELEVENLABSAPIKEY
const DEFAULT_VOICE = process.env.ELEVENLABS_VOICE_ID || 'TX3LPaxmHKxFdv7VOQHJ'

interface Fragment {
    script: string
    uniqueId: string
    slideIndex: number
    fragmentIndex: number
    element: Element
}

interface ProcessedFragment extends Fragment {
    audioBase64?: string
    duration: number
}

// Simple TTS buffer generation - matches Python's fetch_voiceover_elevenlabs
async function generateTTSAudio(text: string, voiceId: string): Promise<{ audioBase64: string; duration: number }> {
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}/with-timestamps`

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'xi-api-key': ELEVEN_KEY!,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text,
                model_id: 'eleven_multilingual_v2'
            })
        })

        if (!res.ok) {
            const errorText = await res.text()
            throw new Error(`ElevenLabs API error: ${res.status} - ${errorText}`)
        }

        const data = await res.json()

        // Calculate duration from character timestamps if available
        let duration = 2000 // Default 2 seconds
        if (data.alignment?.characters?.length > 0) {
            const lastChar = data.alignment.characters[data.alignment.characters.length - 1]
            duration = Math.round((lastChar.start_time + (lastChar.duration || 0)) * 1000) + 500 // Add 500ms buffer
        }

        return {
            audioBase64: data.audio_base64,
            duration
        }
    } catch (error: any) {
        console.error('TTS generation error:', error)
        throw error
    }
}

// Extract fragments with TTS scripts - matches Python's extract_media_fragments
function extractTTSFragments(html: string, slideIndex: number): { fragments: Fragment[], modifiedHtml: string } {
    const fragments: Fragment[] = []
    const dom = new JSDOM(html)
    const doc = dom.window.document

    // Find all elements with data-tts attribute
    const ttsElements = doc.querySelectorAll('[data-tts]')

    ttsElements.forEach((element, fragmentIndex) => {
        const script = element.getAttribute('data-tts')
        if (script) {
            const uniqueId = `tts_${slideIndex}_${fragmentIndex}_${Date.now()}`
            // Add unique ID to the element for later matching
            element.setAttribute('data-tts-id', uniqueId)

            fragments.push({
                script,
                uniqueId,
                slideIndex,
                fragmentIndex,
                element: element as Element
            })
        }
    })

    return {
        fragments,
        modifiedHtml: doc.body.innerHTML
    }
}

// Process fragments with rate limiting - matches Python's process_media_fragments
async function processFragments(fragments: Fragment[], maxWorkers: number = 9): Promise<ProcessedFragment[]> {
    const results: ProcessedFragment[] = []

    // Process in batches to respect rate limits
    for (let i = 0; i < fragments.length; i += maxWorkers) {
        const batch = fragments.slice(i, i + maxWorkers)

        const batchPromises = batch.map(async (fragment) => {
            try {
                const { audioBase64, duration } = await generateTTSAudio(fragment.script, DEFAULT_VOICE)

                return {
                    ...fragment,
                    audioBase64,
                    duration
                } as ProcessedFragment
            } catch (error) {
                console.error(`Failed to process fragment ${fragment.uniqueId}:`, error)
                return {
                    ...fragment,
                    duration: 1000 // Default duration on error
                } as ProcessedFragment
            }
        })

        const batchResults = await Promise.all(batchPromises)
        results.push(...batchResults)
    }

    return results
}

// Insert audio elements into HTML - matches Python's insert_media_elements
function insertAudioElements(html: string, processedFragments: ProcessedFragment[]): string {
    const dom = new JSDOM(html)
    const doc = dom.window.document

    for (const fragment of processedFragments) {
        // Find the element with matching unique ID
        const element = doc.querySelector(`[data-tts-id="${fragment.uniqueId}"]`)

        if (element && fragment.audioBase64) {
            // Wrap in fragment if not already
            let fragmentWrapper = element.closest('.fragment')
            if (!fragmentWrapper) {
                fragmentWrapper = doc.createElement('div')
                fragmentWrapper.className = 'fragment'
                element.parentNode?.insertBefore(fragmentWrapper, element)
                fragmentWrapper.appendChild(element)
            }

            // Set autoslide duration
            fragmentWrapper.setAttribute('data-autoslide', String(fragment.duration))
            fragmentWrapper.setAttribute('data-original-autoslide', String(fragment.duration))

            // Create audio element with data-autoplay
            const audio = doc.createElement('audio')
            audio.setAttribute('data-autoplay', '')

            const source = doc.createElement('source')
            source.src = `data:audio/mpeg;base64,${fragment.audioBase64}`
            source.type = 'audio/mpeg'

            audio.appendChild(source)
            fragmentWrapper.appendChild(audio)
        }
    }

    return doc.body.innerHTML
}

// Add autoslide and controls - matches Python's modify_html_for_autoslide_and_controls
function addAutoslideControls(slides: any[]): any[] {
    return slides.map((slide, index) => {
        const dom = new JSDOM(slide.html)
        const doc = dom.window.document

        // Add empty fragment at beginning of non-first slides
        if (index > 0) {
            const emptyFragment = doc.createElement('div')
            emptyFragment.className = 'fragment'
            emptyFragment.setAttribute('data-autoslide', '10')
            doc.body.insertBefore(emptyFragment, doc.body.firstChild)
        }

        return {
            ...slide,
            html: doc.body.innerHTML,
            // Set data-autoslide for sections
            dataAutoslide: index === 0 ? '0' : '100'
        }
    })
}

export async function POST(req: NextRequest) {
    try {
        if (!ELEVEN_KEY) {
            return NextResponse.json({ error: 'Missing ElevenLabs API key' }, { status: 500 })
        }

        const { projectId } = await req.json()
        if (!projectId) {
            return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })
        }

        // Fetch the deck
        const deck = await fetchQuery(api.slideDeck.GetProject, { projectId })
        if (!deck?.project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 })
        }

        // Extract slides - these already have data-tts attributes from GrapesJS
        const slides = extractRevealSlides(deck.project as any)

        // Process each slide to extract and process fragments
        const allFragments: Fragment[] = []
        const modifiedSlides: any[] = []

        slides.forEach((slide, slideIndex) => {
            const { fragments, modifiedHtml } = extractTTSFragments(slide.html, slideIndex)
            allFragments.push(...fragments)
            modifiedSlides.push({
                ...slide,
                html: modifiedHtml // HTML with unique IDs added
            })
        })

        console.log(`Found ${allFragments.length} TTS fragments across ${slides.length} slides`)

        // Process fragments with audio generation
        const processedFragments = await processFragments(allFragments)

        // Group fragments by slide
        const fragmentsBySlide = processedFragments.reduce((acc, fragment) => {
            if (!acc[fragment.slideIndex]) {
                acc[fragment.slideIndex] = []
            }
            acc[fragment.slideIndex].push(fragment)
            return acc
        }, {} as Record<number, ProcessedFragment[]>)

        // Process each slide to insert audio elements
        const processedSlides = modifiedSlides.map((slide, index) => {
            const slideFragments = fragmentsBySlide[index] || []

            if (slideFragments.length > 0) {
                const htmlWithAudio = insertAudioElements(slide.html, slideFragments)
                return {
                    ...slide,
                    html: htmlWithAudio
                }
            }

            return slide
        })

        // Add autoslide controls
        const finalSlides = addAutoslideControls(processedSlides)

        // Return processed slides with embedded audio
        return NextResponse.json({
            slides: finalSlides,
            success: true
        })

    } catch (error: any) {
        console.error('TTS Simple API error:', error)
        return NextResponse.json({
            error: error.message || 'Internal server error'
        }, { status: 500 })
    }
}

