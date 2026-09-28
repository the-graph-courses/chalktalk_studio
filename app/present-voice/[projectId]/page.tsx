'use client'

import { memo, use, useEffect, useMemo, useState, useRef } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import Reveal from 'reveal.js'
import 'reveal.js/dist/reveal.css'
import { extractRevealSlides, projectCustomCss, type RevealSlide } from '@/lib/reveal-export'

// Helper to scope CSS selectors
const scopeCss = (css: string, scope: string) => {
    return css.replace(/([^{]+){/g, (match, selector) => {
        const trimmed = selector.trim()
        if (trimmed.startsWith('@') || trimmed.startsWith(':root')) return match
        const scoped = trimmed.split(',').map((s: string) => `${scope} ${s.trim()}`).join(', ')
        return `${scoped} {`
    })
}

type AudioClip = { elementIndex: number; ttsText: string; audioUrl: string | null; duration: number }

// Pause after a clip ends before moving on
const GAP_MS = 250
// How long to linger on a slide that has no narration at all
const SILENT_SLIDE_MS = 3000

// Inject <audio> elements into a slide's HTML. Clips are ordered the same way the
// generator (lib/tts-extract.ts) orders them: by data-fragment-index, then DOM order.
// Slides without data-tts elements get a single slide-level clip (generator fallback).
const attachAudioToSlide = (slide: RevealSlide, clips: AudioClip[] | undefined): RevealSlide => {
    if (!clips?.length) return slide

    const doc = new DOMParser().parseFromString(`<body>${slide.html}</body>`, 'text/html')
    const createAudio = (src: string, attr: string) => {
        const audio = doc.createElement('audio')
        audio.setAttribute(attr, 'true')
        // Clips load on demand; the upcoming one is prefetched during playback
        audio.setAttribute('preload', 'none')
        audio.setAttribute('src', src)
        return audio
    }

    const ttsElements = Array.from(doc.body.querySelectorAll<HTMLElement>('[data-tts]'))
        .filter(el => el.getAttribute('data-tts'))
        .map((el, order) => {
            const idx = parseInt(el.getAttribute('data-fragment-index') ?? '', 10)
            return { el, order, idx: Number.isFinite(idx) ? idx : Number.MAX_SAFE_INTEGER }
        })
        .sort((a, b) => a.idx - b.idx || a.order - b.order)

    if (!ttsElements.length) {
        const src = clips[0]?.audioUrl
        if (src) doc.body.appendChild(createAudio(src, 'data-slide-audio'))
        return { ...slide, html: doc.body.innerHTML }
    }

    ttsElements.forEach(({ el }, i) => {
        const src = clips[i]?.audioUrl
        if (!src) return
        let fragment = el.closest('.fragment')
        if (!fragment) {
            fragment = doc.createElement('div')
            fragment.className = 'fragment'
            el.parentNode?.insertBefore(fragment, el)
            fragment.appendChild(el)
        }
        fragment.setAttribute('data-fragment-index', String(i))
        fragment.appendChild(createAudio(src, 'data-fragment-audio'))
    })

    return { ...slide, html: doc.body.innerHTML }
}

// Memoized so parent re-renders (pause, controls auto-hide, volume...) don't touch the deck.
// React 19 re-assigns innerHTML whenever a new dangerouslySetInnerHTML object is passed,
// which would wipe Reveal's fragment state and detach the playing <audio> element.
const RevealSlides = memo(function RevealSlides({ slides, customCss }: { slides: RevealSlide[]; customCss: string }) {
    return (
        <div className="reveal" style={{ width: '100%', height: '100%', background: '#fff' }}>
            {/* Deck-wide custom CSS from the editor; after the theme and layout stylesheets so it wins ties */}
            {customCss ? <style dangerouslySetInnerHTML={{ __html: customCss }} /> : null}
            <div className="slides">
                {slides.map((s, i) => (
                    <section key={i} data-slide-scope={`s${i}`}>
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
    )
})

type PageProps = { params: Promise<{ projectId: string }> }

export default function PresentVoicePage({ params }: PageProps) {
    const { projectId } = use(params)
    const deck = useQuery(api.slideDeck.GetProject, { projectId })
    const deckTitle = deck?.title || 'Presentation'
    // Reactive: updates automatically once audio generation persists new clips
    const audioData = useQuery(api.ttsAudio.GetForProject, { projectId }) as Record<string, AudioClip[]> | undefined

    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)
    const [generationProgress, setGenerationProgress] = useState(0)
    const [playbackRate, setPlaybackRate] = useState(1)
    const [volume, setVolume] = useState(1)
    const [hasStarted, setHasStarted] = useState(false)
    const [isPlaying, setIsPlaying] = useState(false)

    // Refs read from Reveal event handlers so settings changes don't re-initialize the deck
    const isPlayingRef = useRef(false)
    const playbackRateRef = useRef(1)
    const volumeRef = useRef(1)
    const currentAudioRef = useRef<HTMLAudioElement | null>(null)
    const playStepRef = useRef<() => void>(() => { })

    const [showExportMenu, setShowExportMenu] = useState(false)
    const [exportTheme, setExportTheme] = useState('white')
    const [isControlsVisible, setIsControlsVisible] = useState(true)
    const [isControlsHovered, setIsControlsHovered] = useState(false)

    const slides = useMemo(() => (deck?.project ? extractRevealSlides(deck.project as any) : []), [deck?.project])
    const customCss = useMemo(() => projectCustomCss(deck?.project as any), [deck?.project])

    const hasAudioCache = !!audioData && Object.keys(audioData).length > 0

    const processedSlides = useMemo(() => {
        if (!slides.length || !audioData || !hasAudioCache) return slides
        return slides.map((slide, i) => attachAudioToSlide(slide, audioData[String(i)]))
    }, [slides, audioData, hasAudioCache])

    // Fake progress bar for audio generation
    useEffect(() => {
        if (!isGeneratingAudio) {
            setGenerationProgress(prev => (prev > 0 && prev < 100 ? 100 : prev))
            return
        }
        setGenerationProgress(1)
        const interval = setInterval(() => {
            setGenerationProgress(prev => {
                if (prev >= 95) return 95
                // Non-linear progress, slows down as it approaches 95
                const remaining = 95 - prev
                return prev + Math.max(1, remaining / (10 + Math.random() * 10))
            })
        }, 500)
        return () => clearInterval(interval)
    }, [isGeneratingAudio])

    // Auto-hide controls after 3 seconds of no interaction
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isControlsVisible && !isControlsHovered && !showExportMenu) {
            timer = setTimeout(() => setIsControlsVisible(false), 3000);
        }
        return () => clearTimeout(timer);
    }, [isControlsVisible, isControlsHovered, showExportMenu]);

    // Keyboard shortcuts for control toggle
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === 'c' && e.ctrlKey) {
                e.preventDefault();
                setIsControlsVisible(!isControlsVisible);
            }
            if (e.key === 'Escape') {
                setIsControlsVisible(true);
            }
        };

        document.addEventListener('keydown', handleKeyPress);
        return () => document.removeEventListener('keydown', handleKeyPress);
    }, [isControlsVisible]);

    // Close export menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element
            if (showExportMenu && !target.closest('.relative')) {
                setShowExportMenu(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [showExportMenu])

    // Handle export functionality
    const handleExport = async () => {
        try {
            setShowExportMenu(false)

            // Get current theme from localStorage or use selected export theme
            const currentTheme = (() => {
                try {
                    return localStorage.getItem(`selectedThemeId:${projectId}`) ||
                        localStorage.getItem('selectedThemeId') ||
                        exportTheme
                } catch {
                    return exportTheme
                }
            })()

            const params = new URLSearchParams({
                projectId,
                theme: currentTheme
            })

            // Use the new voice export endpoint
            const response = await fetch(`/api/export/voice?${params}`)

            if (!response.ok) {
                throw new Error('Export failed')
            }

            // Create download
            const blob = await response.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${deckTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_voice_presentation.html`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)

        } catch (error) {
            console.error('Export error:', error)
            alert('Export failed. Please try again.')
        }
    }

    // Generate audio; the audioData query picks up the persisted clips automatically
    const generateAudio = async () => {
        setIsGeneratingAudio(true)
        try {
            const res = await fetch('/api/tts/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId })
            })
            if (!res.ok) throw new Error(await res.text())
        } catch (e) {
            console.error('Audio generation failed:', e)
            alert('Failed to generate audio. Please try again.')
        } finally {
            setIsGeneratingAudio(false)
        }
    }

    // Initialize Reveal once slides (with audio attached) are in the DOM
    useEffect(() => {
        if (audioData === undefined || !processedSlides.length) return

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
            // Slide layouts must load after the theme (equal specificity, later wins)
            addLink('/themes/ct-layouts.css', 'ct-layouts')
        } catch { }

        const deckEl = document.querySelector('.reveal') as HTMLElement | null
        if (!deckEl) return

        const r = new (Reveal as any)(deckEl)
        r.initialize({
            hash: true,
            width: 1280,
            height: 720,
            margin: 0,
            controls: true,
            progress: true,
            center: false, // Don't center vertically
            slideNumber: false,
            embedded: false,
            transition: 'none',
            keyboard: true,
            touch: true,
            // Advancing is driven by audio 'ended' events below, not Reveal's timers
            autoSlide: false,
            fragments: true
        })

        let stepTimer: ReturnType<typeof setTimeout> | undefined
        const clearStepTimer = () => {
            if (stepTimer) clearTimeout(stepTimer)
            stepTimer = undefined
        }

        const stopAudio = () => {
            const audio = currentAudioRef.current
            if (!audio) return
            audio.onended = null
            audio.onerror = null
            audio.pause()
            audio.currentTime = 0
            currentAudioRef.current = null
        }

        const isAtEnd = () => r.isLastSlide() && !r.availableFragments().next

        const advance = () => {
            clearStepTimer()
            if (!isPlayingRef.current) return
            if (isAtEnd()) {
                isPlayingRef.current = false
                setIsPlaying(false)
                return
            }
            r.next()
        }

        const scheduleAdvance = (ms: number) => {
            clearStepTimer()
            stepTimer = setTimeout(advance, ms)
        }

        // Play the narration for whatever step Reveal is currently showing
        const runStep = () => {
            if (!isPlayingRef.current) return
            const slide = r.getCurrentSlide() as HTMLElement | undefined
            if (!slide) return

            const currentFragment = slide.querySelector('.fragment.current-fragment')
            const audio = (currentFragment
                ? currentFragment.querySelector(':scope > audio[data-fragment-audio]')
                : slide.querySelector('.fragment.visible') ? null : slide.querySelector('audio[data-slide-audio]')
            ) as HTMLAudioElement | null

            if (!audio) {
                // No narration for this step: move on quickly if the slide has more to reveal
                if (isAtEnd()) {
                    isPlayingRef.current = false
                    setIsPlaying(false)
                    return
                }
                scheduleAdvance(r.availableFragments().next ? GAP_MS : SILENT_SLIDE_MS)
                return
            }

            currentAudioRef.current = audio
            audio.currentTime = 0
            audio.playbackRate = playbackRateRef.current
            audio.volume = volumeRef.current
            audio.onended = () => scheduleAdvance(GAP_MS)
            audio.onerror = () => {
                console.warn('Audio failed to load, skipping', audio.src)
                scheduleAdvance(GAP_MS)
            }
            const upcoming = slide.querySelector('.fragment:not(.visible) > audio[data-fragment-audio]') as HTMLAudioElement | null
            if (upcoming) upcoming.preload = 'auto'
            audio.play().catch((e: DOMException) => {
                if (currentAudioRef.current !== audio || e.name === 'AbortError') return
                if (e.name === 'NotAllowedError') {
                    // Browser blocked autoplay; wait for the user to press play
                    isPlayingRef.current = false
                    setIsPlaying(false)
                    return
                }
                console.warn('Audio playback failed, skipping', e)
                scheduleAdvance(GAP_MS)
            })
        }

        // Reveal can fire several events for one navigation; collapse them into one step
        const playStep = () => {
            stopAudio()
            clearStepTimer()
            if (!isPlayingRef.current) return
            stepTimer = setTimeout(runStep, 50)
        }
        playStepRef.current = playStep

        r.on('slidechanged', playStep)
        r.on('fragmentshown', playStep)
        r.on('fragmenthidden', playStep)

        return () => {
            clearStepTimer()
            stopAudio()
            playStepRef.current = () => { }
            try {
                r?.destroy()
            } catch { }
        }
    }, [processedSlides, audioData === undefined, projectId])

    // Apply speed/volume to the clip that's currently playing
    useEffect(() => {
        playbackRateRef.current = playbackRate
        if (currentAudioRef.current) currentAudioRef.current.playbackRate = playbackRate
    }, [playbackRate])

    useEffect(() => {
        volumeRef.current = volume
        if (currentAudioRef.current) currentAudioRef.current.volume = volume
    }, [volume])

    const handleStart = () => {
        setHasStarted(true)
        setIsPlaying(true)
        isPlayingRef.current = true
        playStepRef.current()
    }

    const handlePlayPause = () => {
        if (isPlayingRef.current) {
            isPlayingRef.current = false
            setIsPlaying(false)
            currentAudioRef.current?.pause()
            return
        }
        isPlayingRef.current = true
        setIsPlaying(true)
        const audio = currentAudioRef.current
        if (audio && audio.currentTime > 0 && !audio.ended) {
            // Resume the interrupted clip where it left off
            audio.play().catch(() => playStepRef.current())
        } else {
            playStepRef.current()
        }
    }

    const playbackRates = [0.75, 1, 1.5, 2]
    const currentRateIndex = playbackRates.indexOf(playbackRate)

    const handleSpeedToggle = () => {
        const nextIndex = (currentRateIndex + 1) % playbackRates.length
        setPlaybackRate(playbackRates[nextIndex])
    }

    if (deck === null) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-lg">Presentation not found</div>
            </div>
        )
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

    return (
        <div className="relative w-full h-screen overflow-hidden bg-black">
            {/* Collapsible Top Bar */}
            <div
                className={`fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm text-white transition-transform duration-300 ${isControlsVisible ? 'translate-y-0' : '-translate-y-full'
                    }`}
                onMouseEnter={() => setIsControlsHovered(true)}
                onMouseLeave={() => setIsControlsHovered(false)}
            >
                <div className="flex items-center justify-between px-4 py-2">
                    <div className="flex items-center gap-2">
                        <a
                            href={`/editor/${projectId}`}
                            className="px-3 py-1 rounded bg-white/20 hover:bg-white/30 text-white text-sm transition-colors flex items-center gap-1"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back to Editor
                        </a>

                        <div className="relative">
                            <button
                                className="px-3 py-1 rounded bg-blue-500 hover:bg-blue-600 text-white text-sm flex items-center gap-1 transition-colors"
                                onClick={() => setShowExportMenu(!showExportMenu)}
                            >
                                Export HTML
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                </svg>
                            </button>

                            {showExportMenu && (
                                <div className="absolute top-full left-0 mt-1 bg-white rounded shadow-lg border border-gray-200 min-w-[200px] z-30">
                                    <button
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-black"
                                        onClick={() => handleExport()}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                        </svg>
                                        Download Presentation
                                    </button>
                                    <div className="border-t border-gray-200 px-4 py-2">
                                        <div className="text-xs text-gray-600 mb-1">Theme:</div>
                                        <select
                                            value={exportTheme}
                                            onChange={(e) => setExportTheme(e.target.value)}
                                            className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                                        >
                                            <option value="white">White</option>
                                            <option value="black">Black</option>
                                            <option value="league">League</option>
                                            <option value="beige">Beige</option>
                                            <option value="sky">Sky</option>
                                            <option value="night">Night</option>
                                            <option value="serif">Serif</option>
                                            <option value="simple">Simple</option>
                                            <option value="solarized">Solarized</option>
                                            <option value="blood">Blood</option>
                                            <option value="moon">Moon</option>
                                            <option value="dracula">Dracula</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-sm text-white/80">
                            {deckTitle}
                        </div>
                        <div className="text-xs text-white/60">
                            Ctrl+C to toggle • ESC to show
                        </div>
                    </div>
                </div>
            </div>

            {/* Show controls trigger - appears when controls are hidden */}
            {!isControlsVisible && (
                <button
                    className="fixed top-2 left-2 z-50 w-8 h-8 rounded bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors text-lg"
                    onClick={() => setIsControlsVisible(true)}
                    title="Show controls (Ctrl+C or ESC)"
                >
                    ⋮
                </button>
            )}

            {!hasStarted && (
                <div className="absolute inset-0 z-40 flex items-center justify-center">
                    {/* Semi-transparent overlay behind the button */}
                    <div className="absolute inset-0 bg-black bg-opacity-50" />

                    <div className="relative text-center space-y-4 bg-black/80 p-8 rounded-lg backdrop-blur-sm">
                        <h1 className="text-3xl font-bold text-white">{deckTitle}</h1>
                        <p className="text-gray-300">AI Voice Presentation Mode</p>

                        {audioData === undefined && (
                            <p className="text-gray-400">Loading audio...</p>
                        )}

                        {audioData !== undefined && !hasAudioCache && (
                            <div className="space-y-4">
                                {isGeneratingAudio ? (
                                    <div className="w-full max-w-sm mx-auto pt-4">
                                        <p className="text-white mb-2 text-center">Generating audio, please wait...</p>
                                        <div className="w-full bg-gray-700 rounded-full h-2.5">
                                            <div
                                                className="bg-blue-500 h-2.5 rounded-full"
                                                style={{ width: `${generationProgress}%`, transition: 'width 0.5s ease-in-out' }}
                                            ></div>
                                        </div>
                                        <p className="text-white mt-2 text-center text-sm">{`${Math.round(generationProgress)}%`}</p>
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-yellow-400">Audio not generated yet</p>
                                        <button
                                            onClick={generateAudio}
                                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Generate Audio
                                        </button>
                                    </>
                                )}
                            </div>
                        )}

                        {hasAudioCache && (
                            <button
                                onClick={handleStart}
                                className="px-8 py-4 bg-green-600 text-white text-xl rounded-lg hover:bg-green-700 transition-colors shadow-lg transform hover:scale-105"
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
                        onClick={handlePlayPause}
                        className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 min-w-[5rem]"
                    >
                        {isPlaying ? 'Pause' : 'Play'}
                    </button>

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

            <RevealSlides slides={processedSlides} customCss={customCss} />
        </div>
    )
}
