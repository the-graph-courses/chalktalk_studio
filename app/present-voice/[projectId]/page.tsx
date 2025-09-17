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
    const [generationProgress, setGenerationProgress] = useState(0)
    const [audioCache, setAudioCache] = useState<Record<string, any>>({})
    const [playbackRate, setPlaybackRate] = useState(1)
    const [volume, setVolume] = useState(1)
    const [hasStarted, setHasStarted] = useState(false)
    const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map())
    const currentAudioRef = useRef<HTMLAudioElement | null>(null)
    const handledFragmentsRef = useRef(new WeakSet<HTMLElement>())

    const [showExportMenu, setShowExportMenu] = useState(false)
    const [exportTheme, setExportTheme] = useState('white')
    const [isControlsVisible, setIsControlsVisible] = useState(true)
    const [isControlsHovered, setIsControlsHovered] = useState(false)

    const slides = useMemo(() => (deck?.project ? extractRevealSlides(deck.project as any) : []), [deck?.project])

    // Store processed slides with duration calculations
    const [processedSlidesState, setProcessedSlidesState] = useState<typeof slides>([])

    // Fake progress bar for audio generation
    useEffect(() => {
        let interval: NodeJS.Timeout | undefined
        if (isGeneratingAudio) {
            setGenerationProgress(1) // Start immediately
            interval = setInterval(() => {
                setGenerationProgress(prev => {
                    if (prev >= 95) {
                        if (interval) clearInterval(interval)
                        return 95
                    }
                    // Non-linear progress, slows down as it approaches 95
                    const remaining = 95 - prev
                    const increment = Math.max(1, remaining / (10 + Math.random() * 10))
                    return prev + increment
                })
            }, 500)
        } else {
            // When generation stops, if we were showing progress, complete it.
            if (generationProgress > 0 && generationProgress < 100) {
                setGenerationProgress(100)
            }
        }
        return () => {
            if (interval) clearInterval(interval)
        }
    }, [isGeneratingAudio, generationProgress])

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
                    emptyFragment.setAttribute('data-fragment-index', '0') // Ensure it shows first
                    doc.body.insertBefore(emptyFragment, doc.body.firstChild)
                }

                // Find all elements with data-tts attribute
                const ttsElements = doc.querySelectorAll('[data-tts]')

                // Process each TTS element and calculate durations
                await Promise.all(Array.from(ttsElements).map(async (element, fragmentIndex) => {
                    const audioData = slideAudio[fragmentIndex]
                    console.log(`🎵 Processing audio for slide ${slideIndex}, fragment ${fragmentIndex}:`, {
                        hasAudioData: !!audioData,
                        hasUrl: !!(audioData?.audioDataUrl || audioData?.audioUrl)
                    })
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

                    fragmentWrapper.setAttribute('data-autoslide', String(duration + 250)) // Add 250ms buffer
                    fragmentWrapper.setAttribute('data-tts', audioData.ttsText || '')

                    // Proper fragment indexing - account for empty fragment at start of non-first slides
                    const adjustedIndex = slideIndex > 0 ? fragmentIndex + 1 : fragmentIndex
                    // Always set fragment index to ensure proper ordering (including index 0)
                    fragmentWrapper.setAttribute('data-fragment-index', String(adjustedIndex))

                    // Add audio element WITHOUT autoplay to prevent immediate playback
                    const audio = doc.createElement('audio')
                    // Store audio src as data attribute instead of setting it immediately
                    audio.setAttribute('data-audio-src', audioData.audioDataUrl || audioData.audioUrl || '')
                    audio.setAttribute('data-fragment-audio', 'true')
                    // Don't add source element yet - we'll add it when fragment is shown
                    fragmentWrapper.appendChild(audio)

                    const audioSrc = audioData.audioDataUrl || audioData.audioUrl
                    console.log(`🔊 Created audio element for slide ${slideIndex}, fragment ${fragmentIndex}:`, {
                        src: audioSrc ? audioSrc.substring(0, 100) + '...' : 'NO SRC',
                        hasSrc: !!audioSrc,
                        duration: audioData.duration
                    })
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

    // Load audio cache from localStorage or server
    useEffect(() => {
        const loadAudioCache = async () => {
            try {
                console.log('🔍 Loading audio cache for project:', projectId)

                // First try localStorage
                const cached = localStorage.getItem(`ttsCache:${projectId}`)
                if (cached) {
                    console.log('📦 Found audio cache in localStorage')
                    const parsedCache = JSON.parse(cached)
                    console.log('📊 localStorage cache contents:', {
                        slideCount: Object.keys(parsedCache).length,
                        slides: Object.entries(parsedCache).map(([idx, items]) => ({
                            slideIndex: idx,
                            itemCount: Array.isArray(items) ? items.length : 0
                        }))
                    })
                    setAudioCache(parsedCache)
                } else {
                    console.log('🌐 No localStorage cache, fetching from server...')
                    // Fallback to server
                    const res = await fetch(`/api/tts/cache?projectId=${encodeURIComponent(projectId)}`)
                    console.log('📡 Server response status:', res.status)

                    if (res.ok) {
                        const data = await res.json()
                        console.log('✅ Audio cache loaded from server:', {
                            slideCount: Object.keys(data || {}).length,
                            slides: Object.entries(data || {}).map(([idx, items]) => ({
                                slideIndex: idx,
                                itemCount: Array.isArray(items) ? items.length : 0,
                                hasAudioUrls: Array.isArray(items) ? items.every((item: any) => item.audioDataUrl || item.audioUrl) : false
                            }))
                        })
                        setAudioCache(data)
                    } else {
                        console.warn('⚠️ Failed to load audio cache from server:', res.statusText)
                    }
                }
            } catch (e) {
                console.error('❌ Failed to load audio cache:', e)
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
        handledFragmentsRef.current = new WeakSet()
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
            autoSlide: 999999, // Disable global autoslide, rely on data-autoslide
            autoSlideStoppable: true,
            fragments: true
        })
        setReveal(r)

        const logEvent = (name: string, details: object = {}) => {
            console.log(
                `[${new Date().toLocaleTimeString('en-US', { hour12: false })}] 🔊 PRESENTER LOG: ${name}`,
                details
            )
        }

        // Handle fragment events for audio playback (works with data-autoslide)
        r.on('fragmentshown', (event: any) => {
            const fragment = event.fragment as HTMLElement
            const slide = fragment.closest('section')
            const slideIndex = Array.from(document.querySelectorAll('.reveal .slides section')).indexOf(slide as HTMLElement)
            const fragmentIndex = fragment.getAttribute('data-fragment-index')

            logEvent('fragmentshown', {
                slideIndex,
                fragmentIndex,
                fragmentClassList: Array.from(fragment.classList),
                fragmentDataset: { ...fragment.dataset },
                handledAlready: handledFragmentsRef.current.has(fragment)
            })

            if (handledFragmentsRef.current.has(fragment)) {
                logEvent('Skipping audio - fragment already handled for current reveal', { slideIndex, fragmentIndex })
                return
            }
            handledFragmentsRef.current.add(fragment)
            logEvent('Registered fragment for playback', { slideIndex, fragmentIndex })

            const audio = fragment.querySelector('audio[data-fragment-audio]') as HTMLAudioElement
            if (audio) {
                logEvent('Audio element found', {
                    slideIndex,
                    fragmentIndex,
                    currentSrc: audio.currentSrc,
                    hasSourceChild: !!audio.querySelector('source'),
                    readyState: audio.readyState
                })

                // Stop any currently playing audio
                if (currentAudioRef.current) {
                    logEvent('Stopping previous audio', { src: currentAudioRef.current.currentSrc })
                    currentAudioRef.current.pause()
                    currentAudioRef.current.currentTime = 0
                }

                // Check if audio source needs to be loaded
                const audioSrc = audio.getAttribute('data-audio-src')
                if (audioSrc && !audio.querySelector('source')) {
                    logEvent('Loading audio source', { slideIndex, fragmentIndex, src: audioSrc.substring(0, 50) })
                    const source = document.createElement('source')
                    source.src = audioSrc
                    source.type = 'audio/mpeg'
                    audio.appendChild(source)
                    audio.load() // Important: load the new source
                }

                const startPlayback = () => {
                    logEvent('Preparing to start playback', {
                        slideIndex,
                        fragmentIndex,
                        playbackRate,
                        volume,
                        currentTime: audio.currentTime,
                        readyState: audio.readyState
                    })
                    currentAudioRef.current = audio
                    audio.currentTime = 0 // Reset audio to the beginning before playing
                    audio.playbackRate = playbackRate
                    audio.volume = volume

                    logEvent('Playing audio', { slideIndex, fragmentIndex, src: audio.currentSrc })
                    audio.play().then(() => {
                        logEvent('Audio playback started successfully', { slideIndex, fragmentIndex })
                    }).catch((e: any) => {
                        logEvent('Audio playback failed', { slideIndex, fragmentIndex, error: e.message })
                    })
                }

                // Wait for the fragment to render before starting playback to avoid early audio
                requestAnimationFrame(() => {
                    logEvent('Post-animation-frame fragment check', {
                        slideIndex,
                        fragmentIndex,
                        classList: Array.from(fragment.classList),
                        boundingRect: fragment.getBoundingClientRect(),
                        isVisibleClass: fragment.classList.contains('visible'),
                        styleDisplay: (fragment as HTMLElement).style.display
                    })
                    if (!fragment.classList.contains('visible')) {
                        handledFragmentsRef.current.delete(fragment)
                        logEvent('Fragment no longer visible, skipping audio playback', { slideIndex, fragmentIndex })
                        return
                    }
                    startPlayback()
                })
            } else {
                logEvent('No audio element found in fragment', { slideIndex, fragmentIndex })
            }
        })

        r.on('fragmenthidden', (event: any) => {
            const fragment = event.fragment as HTMLElement
            const slide = fragment.closest('section')
            const slideIndex = Array.from(document.querySelectorAll('.reveal .slides section')).indexOf(slide as HTMLElement)
            const fragmentIndex = fragment.getAttribute('data-fragment-index')

            handledFragmentsRef.current.delete(fragment)
            logEvent('fragmenthidden', {
                slideIndex,
                fragmentIndex,
                fragmentClassList: Array.from(fragment.classList)
            })

            const audio = fragment.querySelector('audio[data-fragment-audio]') as HTMLAudioElement | null
            if (audio && currentAudioRef.current === audio) {
                logEvent('Stopping audio on fragmenthidden', { slideIndex, fragmentIndex, src: audio.currentSrc })
                audio.pause()
                audio.currentTime = 0
                currentAudioRef.current = null
            }
        })

        // Apply playback rate on slide changes
        r.on('slidechanged', (event: any) => {
            logEvent('slidechanged', { slideIndex: event.indexh })
            applyPlaybackRate()
            // Stop any playing audio when slide changes
            if (currentAudioRef.current) {
                logEvent('Stopping audio on slide change', { src: currentAudioRef.current.currentSrc })
                currentAudioRef.current.pause()
                currentAudioRef.current.currentTime = 0
                currentAudioRef.current = null
            }
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
        // Update all audio elements that have been loaded
        document.querySelectorAll('audio').forEach((audio: HTMLAudioElement) => {
            // Only update if the audio has a source (i.e., has been loaded)
            if (audio.querySelector('source')) {
                audio.playbackRate = playbackRate
                audio.volume = volume
            }
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
                <div className="absolute inset-0 z-40 flex items-center justify-center bg-black bg-opacity-90">
                    <div className="text-center space-y-4">
                        <h1 className="text-3xl font-bold text-white">{deckTitle}</h1>
                        <p className="text-gray-300">AI Voice Presentation Mode</p>

                        {!hasAudioCache && (
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
                                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
