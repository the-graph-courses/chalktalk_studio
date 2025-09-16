'use client'

import { use, useEffect, useMemo, useState, useRef } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import Reveal from 'reveal.js'
import 'reveal.js/dist/reveal.css'
import { extractRevealSlides } from '@/lib/reveal-export'
import { extractTTSFromSlideHtml } from '@/lib/tts-extract'

// Helper to scope CSS selectors
const scopeCss = (css: string, scope: string) => {
    return css.replace(/([^{]+){/g, (match, selector) => {
        const trimmed = selector.trim()
        if (trimmed.startsWith('@') || trimmed.startsWith(':root')) return match
        const scoped = trimmed.split(',').map((s: string) => `${scope} ${s.trim()}`).join(', ')
        return `${scoped} {`
    })
}

type PageProps = { params: Promise<{ projectId: string }> }

export default function PresentVoicePage({ params }: PageProps) {
    const { projectId } = use(params)
    const deck = useQuery(api.slideDeck.GetProject, { projectId })
    const deckTitle = deck?.title || 'Presentation'

    const [reveal, setReveal] = useState<Reveal.Api | null>(null)
    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)
    const [audioCache, setAudioCache] = useState<Record<string, any>>({})
    const [playbackRate, setPlaybackRate] = useState(1)
    const [volume, setVolume] = useState(1)
    const [hasStarted, setHasStarted] = useState(false)
    const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map())
    const currentAudioRef = useRef<HTMLAudioElement | null>(null)

    const slides = useMemo(() => (deck?.project ? extractRevealSlides(deck.project as any) : []), [deck?.project])

    // Store processed slides with duration calculations
    const [processedSlidesState, setProcessedSlidesState] = useState<typeof slides>([])

    // Calculate audio duration using HTML5 Audio API
    const getAudioDuration = (dataUrl: string): Promise<number> => {
        return new Promise((resolve) => {
            const audio = new Audio()
            audio.addEventListener('loadedmetadata', () => {
                const durationMs = Math.round(audio.duration * 1000)
                resolve(durationMs || 1000) // Fallback to 1 second if duration is invalid
            })
            audio.addEventListener('error', () => {
                resolve(1000) // Fallback to 1 second on error
            })
            audio.src = dataUrl
        })
    }

    // Process slides to inject audio elements and timing
    useEffect(() => {
        if (!slides.length || Object.keys(audioCache).length === 0) {
            setProcessedSlidesState(slides)
            return
        }

        const processSlides = async () => {
            const processed = await Promise.all(slides.map(async (slide, slideIndex) => {
                const slideAudio = audioCache[slideIndex]
                if (!slideAudio || !Array.isArray(slideAudio)) return slide

                // Parse the HTML to inject audio elements
                const parser = new DOMParser()
                const doc = parser.parseFromString(slide.html, 'text/html')

                // Add empty fragment at beginning of non-first slides
                if (slideIndex > 0) {
                    const emptyFragment = doc.createElement('div')
                    emptyFragment.className = 'fragment'
                    emptyFragment.setAttribute('data-autoslide', '10')
                    doc.body.insertBefore(emptyFragment, doc.body.firstChild)
                }

                // Find all elements with data-tts attribute
                const ttsElements = doc.querySelectorAll('[data-tts]')

                // Process each TTS element and calculate durations
                await Promise.all(Array.from(ttsElements).map(async (element, fragmentIndex) => {
                    const audioData = slideAudio[fragmentIndex]
                    if (!audioData) return

                    // Wrap element in fragment if not already
                    let fragmentWrapper = element.closest('.fragment')
                    if (!fragmentWrapper) {
                        fragmentWrapper = doc.createElement('div')
                        fragmentWrapper.className = 'fragment'
                        element.parentNode?.insertBefore(fragmentWrapper, element)
                        fragmentWrapper.appendChild(element)
                    }

                    // Calculate actual duration using HTML5 Audio API
                    let duration = 1000 // Default fallback
                    if (audioData.audioDataUrl) {
                        try {
                            duration = await getAudioDuration(audioData.audioDataUrl)
                        } catch (e) {
                            console.warn('Failed to get audio duration:', e)
                            duration = audioData.duration || 1000
                        }
                    } else {
                        duration = audioData.duration || 1000
                    }

                    fragmentWrapper.setAttribute('data-autoslide', String(duration))
                    fragmentWrapper.setAttribute('data-tts', audioData.ttsText || '')

                    // Proper fragment indexing - account for empty fragment at start of non-first slides
                    const adjustedIndex = slideIndex > 0 ? fragmentIndex + 1 : fragmentIndex
                    if (adjustedIndex > 0) {
                        fragmentWrapper.setAttribute('data-fragment-index', String(adjustedIndex))
                    }

                    // Add audio element
                    const audio = doc.createElement('audio')
                    audio.setAttribute('data-autoplay', '')
                    const source = doc.createElement('source')
                    source.src = audioData.audioDataUrl
                    source.type = 'audio/mpeg'
                    audio.appendChild(source)
                    fragmentWrapper.appendChild(audio)
                }))

                // Serialize back to HTML
                const processedHtml = doc.body.innerHTML

                return { ...slide, html: processedHtml }
            }))

            setProcessedSlidesState(processed)
        }

        processSlides()
    }, [slides, audioCache])

    // Use the processed slides
    const processedSlides = processedSlidesState

    // Load audio cache from localStorage or server
    useEffect(() => {
        const loadAudioCache = async () => {
            try {
                // First try localStorage
                const cached = localStorage.getItem(`ttsCache:${projectId}`)
                if (cached) {
                    setAudioCache(JSON.parse(cached))
                } else {
                    // Fallback to server
                    const res = await fetch(`/api/tts/cache?projectId=${encodeURIComponent(projectId)}`)
                    if (res.ok) {
                        const data = await res.json()
                        setAudioCache(data)
                    }
                }
            } catch (e) {
                console.error('Failed to load audio cache:', e)
            }
        }
        loadAudioCache()
    }, [projectId])

    // Generate audio if not cached
    const generateAudio = async () => {
        setIsGeneratingAudio(true)
        try {
            const res = await fetch('/api/tts/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId })
            })
            if (!res.ok) throw new Error(await res.text())
            const data = await res.json()

            // Store in localStorage
            try {
                localStorage.setItem(`ttsCache:${projectId}`, JSON.stringify(data))
            } catch { }

            // Reload from server to get the stored data
            const cacheRes = await fetch(`/api/tts/cache?projectId=${encodeURIComponent(projectId)}`)
            if (cacheRes.ok) {
                const cacheData = await cacheRes.json()
                setAudioCache(cacheData)
            }
        } catch (e) {
            console.error('Audio generation failed:', e)
            alert('Failed to generate audio. Please try again.')
        } finally {
            setIsGeneratingAudio(false)
        }
    }

    // Initialize Reveal after slides are in DOM
    useEffect(() => {
        if (!processedSlides.length || !hasStarted) return

        // Inject theme CSS
        try {
            const head = document.head
            const addLink = (href: string, id: string) => {
                if (!document.getElementById(id)) {
                    const l = document.createElement('link')
                    l.rel = 'stylesheet'
                    l.href = href
                    l.id = id
                    head.appendChild(l)
                }
            }
            const themeId = ((): string => {
                try {
                    return localStorage.getItem(`selectedThemeId:${projectId}`) ||
                        localStorage.getItem('selectedThemeId') || 'white'
                } catch {
                    return 'white'
                }
            })()
            addLink(`/themes/${themeId}.css`, 'reveal-theme')
        } catch { }

        const deckEl = document.querySelector('.reveal') as HTMLElement | null
        if (!deckEl) return

        const r = new (Reveal as any)(deckEl)
        r.initialize({
            hash: true,
            width: 1280,
            height: 720,
            margin: 0,
            controls: false, // Hide controls like in your reference
            progress: true,
            center: false, // Don't center vertically
            slideNumber: false,
            embedded: false,
            transition: 'none',
            keyboard: true,
            touch: true,
            autoSlide: 100, // Enable auto-slide with short default
            autoSlideStoppable: true,
            fragments: true
        })
        setReveal(r)

        // Apply playback rate on slide changes
        r.on('slidechanged', () => {
            applyPlaybackRate()
        })

        return () => {
            try {
                r?.destroy()
            } catch { }
        }
    }, [processedSlides.length, hasStarted])

    // Store reveal instance when it changes
    useEffect(() => {
        if (reveal && hasStarted) {
            // Trigger first slide after a short delay
            setTimeout(() => {
                reveal.next()
            }, 500)
        }
    }, [reveal, hasStarted])

    // Apply playback rate to all audio elements and update fragment durations
    const applyPlaybackRate = () => {
        // Update all audio elements
        document.querySelectorAll('audio').forEach((audio: HTMLAudioElement) => {
            audio.playbackRate = playbackRate
            audio.volume = volume
        })

        // Update fragment durations based on playback rate
        document.querySelectorAll('.fragment[data-autoslide]').forEach((fragment: Element) => {
            const originalDuration = parseInt(
                fragment.getAttribute('data-original-autoslide') ||
                fragment.getAttribute('data-autoslide') || '0'
            )

            // Store original duration if not already stored
            if (!fragment.getAttribute('data-original-autoslide')) {
                fragment.setAttribute('data-original-autoslide', String(originalDuration))
            }

            // Adjust duration based on playback rate
            fragment.setAttribute('data-autoslide', String(Math.round(originalDuration * (1 / playbackRate))))
        })
    }

    // Update playback settings when they change
    useEffect(() => {
        applyPlaybackRate()
    }, [playbackRate, volume])

    const handleStart = () => {
        setHasStarted(true)
        // The useEffect will handle advancing to the first slide
    }

    const playbackRates = [0.75, 1, 1.5, 2]
    const currentRateIndex = playbackRates.indexOf(playbackRate)

    const handleSpeedToggle = () => {
        const nextIndex = (currentRateIndex + 1) % playbackRates.length
        setPlaybackRate(playbackRates[nextIndex])
    }

    if (!deck) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="text-lg">Loading presentation...</div>
                </div>
            </div>
        )
    }

    const hasAudioCache = Object.keys(audioCache).length > 0

    return (
        <div className="relative w-full h-screen overflow-hidden bg-black">
            {!hasStarted && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
                    <div className="text-center space-y-4">
                        <h1 className="text-3xl font-bold text-white">{deckTitle}</h1>
                        <p className="text-gray-300">AI Voice Presentation Mode</p>

                        {!hasAudioCache && (
                            <div className="space-y-4">
                                <p className="text-yellow-400">Audio not generated yet</p>
                                <button
                                    onClick={generateAudio}
                                    disabled={isGeneratingAudio}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {isGeneratingAudio ? 'Generating Audio...' : 'Generate Audio'}
                                </button>
                            </div>
                        )}

                        {hasAudioCache && (
                            <button
                                onClick={handleStart}
                                className="px-8 py-4 bg-green-600 text-white text-xl rounded-lg hover:bg-green-700 transition-colors"
                            >
                                Start Presentation
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Playback Controls */}
            {hasStarted && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-40 flex items-center gap-4 bg-black bg-opacity-50 p-2 rounded-lg">
                    <button
                        onClick={handleSpeedToggle}
                        className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                    >
                        {playbackRate}x
                    </button>

                    <div className="flex items-center gap-2">
                        <span className="text-white text-sm">Volume:</span>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={volume}
                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                            className="w-32"
                        />
                    </div>

                    {!hasAudioCache && (
                        <button
                            onClick={generateAudio}
                            disabled={isGeneratingAudio}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isGeneratingAudio ? 'Generating...' : 'Generate Audio'}
                        </button>
                    )}
                </div>
            )}

            <div className="reveal" style={{ width: '100%', height: '100%', background: '#fff' }}>
                <div className="slides">
                    {processedSlides.map((s, i) => (
                        <section
                            key={i}
                            data-slide-scope={`s${i}`}
                            data-autoslide={i === 0 ? "0" : "100"}
                        >
                            <div
                                className="ct-slide"
                                style={s.containerStyle ? (() => {
                                    const styles: Record<string, string> = {}
                                    s.containerStyle.split(';').filter(Boolean).forEach((p: string) => {
                                        const [k, v] = p.split(':')
                                        if (k && v) {
                                            styles[k.trim()] = v.trim()
                                        }
                                    })
                                    return styles as React.CSSProperties
                                })() : undefined}
                                dangerouslySetInnerHTML={{ __html: s.html }}
                            />
                            {s.css?.length ? (
                                <style
                                    dangerouslySetInnerHTML={{ __html: scopeCss(s.css.join('\n'), `[data-slide-scope=\"s${i}\"] .ct-slide`) }}
                                />
                            ) : null}
                        </section>
                    ))}
                </div>
            </div>
        </div>
    )
}
