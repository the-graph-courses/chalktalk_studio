'use client'

import { use, useEffect, useState, useRef } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import Reveal from 'reveal.js'
import 'reveal.js/dist/reveal.css'

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

export default function PresentVoiceSimplePage({ params }: PageProps) {
    const { projectId } = use(params)
    const deck = useQuery(api.slideDeck.GetProject, { projectId })
    const deckTitle = deck?.title || 'Presentation'

    const [reveal, setReveal] = useState<Reveal.Api | null>(null)
    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)
    const [generationProgress, setGenerationProgress] = useState(0)
    const [processedSlides, setProcessedSlides] = useState<any[]>([])
    const [hasStarted, setHasStarted] = useState(false)
    const [playbackRate, setPlaybackRate] = useState(1)
    const [volume, setVolume] = useState(1)
    const currentAudioRef = useRef<HTMLAudioElement | null>(null)

    // Fake progress animation
    useEffect(() => {
        let interval: NodeJS.Timeout | undefined
        if (isGeneratingAudio) {
            setGenerationProgress(5)
            interval = setInterval(() => {
                setGenerationProgress(prev => {
                    if (prev >= 95) return 95
                    const increment = Math.random() * 5 + 2
                    return Math.min(95, prev + increment)
                })
            }, 800)
        } else if (generationProgress > 0 && generationProgress < 100) {
            setGenerationProgress(100)
            setTimeout(() => setGenerationProgress(0), 500)
        }
        return () => {
            if (interval) clearInterval(interval)
        }
    }, [isGeneratingAudio, generationProgress])

    // Generate audio using the simplified API
    const generateAudio = async () => {
        setIsGeneratingAudio(true)
        setGenerationProgress(0)

        try {
            const res = await fetch('/api/tts-simple', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId })
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || 'Failed to generate audio')
            }

            const data = await res.json()
            console.log('Audio generation complete:', {
                slideCount: data.slides?.length,
                hasAudioCache: !!data.audioCache
            })

            if (data.slides) {
                setProcessedSlides(data.slides)
            }

            setGenerationProgress(100)
        } catch (e: any) {
            console.error('Audio generation failed:', e)
            alert(`Failed to generate audio: ${e.message}`)
            setGenerationProgress(0)
        } finally {
            setIsGeneratingAudio(false)
        }
    }


    // Initialize Reveal.js
    useEffect(() => {
        if (!processedSlides.length || !hasStarted) return

        // Inject theme CSS
        const themeId = localStorage.getItem(`selectedThemeId:${projectId}`) ||
            localStorage.getItem('selectedThemeId') || 'white'

        const addThemeLink = () => {
            if (!document.getElementById('reveal-theme')) {
                const link = document.createElement('link')
                link.rel = 'stylesheet'
                link.href = `/themes/${themeId}.css`
                link.id = 'reveal-theme'
                document.head.appendChild(link)
            }
        }
        addThemeLink()

        const deckEl = document.querySelector('.reveal') as HTMLElement
        if (!deckEl) return

        const r = new (Reveal as any)(deckEl)
        r.initialize({
            hash: true,
            width: 1280,
            height: 720,
            margin: 0,
            controls: false,
            progress: true,
            center: false,
            slideNumber: false,
            embedded: false,
            transition: 'none',
            keyboard: true,
            touch: true,
            autoSlide: 100, // Use data-autoslide attributes
            autoSlideStoppable: true,
            fragments: true
        })

        setReveal(r)

        // Handle fragment shown events for audio playback
        r.on('fragmentshown', (event: any) => {
            const fragment = event.fragment as HTMLElement
            const audio = fragment.querySelector('audio[data-autoplay]') as HTMLAudioElement

            if (audio) {
                // Stop any currently playing audio
                if (currentAudioRef.current && currentAudioRef.current !== audio) {
                    currentAudioRef.current.pause()
                    currentAudioRef.current.currentTime = 0
                }

                // Play the new audio
                currentAudioRef.current = audio
                audio.playbackRate = playbackRate
                audio.volume = volume
                audio.currentTime = 0

                audio.play().catch((e: any) => {
                    console.error('Audio playback failed:', e)
                })
            }
        })

        // Stop audio on slide change
        r.on('slidechanged', () => {
            if (currentAudioRef.current) {
                currentAudioRef.current.pause()
                currentAudioRef.current.currentTime = 0
                currentAudioRef.current = null
            }

            // Apply playback settings to all audio elements
            document.querySelectorAll('audio').forEach((audio: HTMLAudioElement) => {
                audio.playbackRate = playbackRate
                audio.volume = volume
            })
        })

        return () => {
            try {
                r?.destroy()
            } catch { }
        }
    }, [processedSlides, hasStarted, playbackRate, volume, projectId])

    // Update playback settings
    useEffect(() => {
        // Update all audio elements
        document.querySelectorAll('audio').forEach((audio: HTMLAudioElement) => {
            audio.playbackRate = playbackRate
            audio.volume = volume
        })

        // Update fragment durations
        document.querySelectorAll('.fragment[data-autoslide]').forEach((fragment: Element) => {
            const originalDuration = parseInt(
                fragment.getAttribute('data-original-autoslide') ||
                fragment.getAttribute('data-autoslide') || '0'
            )

            if (!fragment.getAttribute('data-original-autoslide')) {
                fragment.setAttribute('data-original-autoslide', String(originalDuration))
            }

            const adjustedDuration = Math.round(originalDuration * (1 / playbackRate))
            fragment.setAttribute('data-autoslide', String(adjustedDuration))
        })
    }, [playbackRate, volume])

    const handleStart = () => {
        setHasStarted(true)
    }

    const playbackRates = [0.75, 1, 1.5, 2]
    const currentRateIndex = playbackRates.indexOf(playbackRate)

    const handleSpeedToggle = () => {
        const nextIndex = (currentRateIndex + 1) % playbackRates.length
        setPlaybackRate(playbackRates[nextIndex])
    }

    if (!deck) {
        return (
            <div className="flex items-center justify-center h-screen bg-black">
                <div className="text-white text-lg">Loading presentation...</div>
            </div>
        )
    }

    const hasProcessedSlides = processedSlides.length > 0

    return (
        <div className="relative w-full h-screen overflow-hidden bg-black">
            {!hasStarted && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-95">
                    <div className="text-center space-y-6 p-8 bg-gray-900 rounded-lg max-w-md">
                        <h1 className="text-3xl font-bold text-white">{deckTitle}</h1>
                        <p className="text-gray-300">Simplified Voice Presentation Mode</p>

                        {!hasProcessedSlides && (
                            <div className="space-y-4">
                                {isGeneratingAudio ? (
                                    <div className="space-y-3">
                                        <p className="text-white">Generating audio narration...</p>
                                        <div className="w-full bg-gray-700 rounded-full h-2.5">
                                            <div
                                                className="bg-blue-500 h-2.5 rounded-full transition-all duration-500"
                                                style={{ width: `${generationProgress}%` }}
                                            />
                                        </div>
                                        <p className="text-gray-400 text-sm">{Math.round(generationProgress)}%</p>
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-yellow-400">Audio narration not generated</p>
                                        <button
                                            onClick={generateAudio}
                                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Generate Audio Narration
                                        </button>
                                    </>
                                )}
                            </div>
                        )}

                        {hasProcessedSlides && !isGeneratingAudio && (
                            <>
                                <div className="text-green-400">✓ Audio narration ready</div>
                                <button
                                    onClick={handleStart}
                                    className="px-8 py-4 bg-green-600 text-white text-xl rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    Start Presentation
                                </button>
                                <button
                                    onClick={generateAudio}
                                    className="px-6 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                                >
                                    Regenerate Audio
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Playback Controls */}
            {hasStarted && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-40 flex items-center gap-4 bg-black bg-opacity-75 p-3 rounded-lg">
                    <button
                        onClick={handleSpeedToggle}
                        className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
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

                    <button
                        onClick={() => reveal?.prev()}
                        className="px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                    >
                        ←
                    </button>

                    <button
                        onClick={() => reveal?.next()}
                        className="px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                    >
                        →
                    </button>
                </div>
            )}

            {/* Start Button for first slide */}
            {hasStarted && reveal && (
                <button
                    id="startPresentationButton"
                    onClick={() => reveal.next()}
                    className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-30 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    style={{ display: reveal.getState()?.indexh === 0 ? 'block' : 'none' }}
                >
                    Start Presentation
                </button>
            )}

            {/* Reveal.js Container */}
            <div className="reveal" style={{ width: '100%', height: '100%' }}>
                <div className="slides">
                    {processedSlides.map((slide, i) => (
                        <section
                            key={i}
                            data-slide-scope={`s${i}`}
                            data-autoslide={slide.dataAutoslide || (i === 0 ? '0' : '100')}
                        >
                            <div
                                className="ct-slide"
                                style={slide.containerStyle ? (() => {
                                    const styles: Record<string, string> = {}
                                    slide.containerStyle.split(';').filter(Boolean).forEach((p: string) => {
                                        const [k, v] = p.split(':')
                                        if (k && v) {
                                            styles[k.trim()] = v.trim()
                                        }
                                    })
                                    return styles as React.CSSProperties
                                })() : undefined}
                                dangerouslySetInnerHTML={{ __html: slide.html }}
                            />
                            {slide.css?.length ? (
                                <style
                                    dangerouslySetInnerHTML={{
                                        __html: scopeCss(slide.css.join('\n'), `[data-slide-scope="s${i}"] .ct-slide`)
                                    }}
                                />
                            ) : null}
                        </section>
                    ))}
                </div>
            </div>
        </div>
    )
}
