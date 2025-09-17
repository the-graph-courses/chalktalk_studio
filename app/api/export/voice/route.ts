import { NextRequest } from 'next/server'
import { fetchQuery } from 'convex/nextjs'
import { api } from '@/convex/_generated/api'
import { extractRevealSlides } from '@/lib/reveal-export'
import { extractTTSFromSlideHtml } from '@/lib/tts-extract'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const projectId = searchParams.get('projectId')
        const themeId = searchParams.get('theme') || 'white'

        if (!projectId) {
            return new Response('Missing projectId', { status: 400 })
        }

        // Fetch project data
        const deck = await fetchQuery(api.slideDeck.GetProject, { projectId })
        if (!deck?.project) {
            return new Response('Project not found', { status: 404 })
        }

        // Extract slides
        const slides = extractRevealSlides(deck.project as any)
        const deckTitle = deck.title || 'Presentation'

        // Fetch TTS audio cache with Convex storage URLs
        let audioCache: Record<string, any> = {}
        try {
            const audioData = await fetchQuery(api.ttsAudio.GetForProject, { projectId })
            // The audioData already contains audioUrl from ctx.storage.getUrl()
            // These are proper Convex storage URLs, not base64 strings
            audioCache = audioData || {}
            console.log('Audio cache fetched:', {
                slideCount: Object.keys(audioCache).length,
                hasUrls: Object.values(audioCache).every((items: any) =>
                    Array.isArray(items) && items.every((item: any) => item.audioUrl)
                )
            })
        } catch (e) {
            console.warn('Failed to fetch audio cache:', e)
        }

        // Read theme CSS
        let themeCss = ''
        try {
            const themePath = join(process.cwd(), 'public', 'themes', `${themeId}.css`)
            themeCss = await readFile(themePath, 'utf-8')
        } catch {
            // Fallback to white theme
            try {
                const fallbackPath = join(process.cwd(), 'public', 'themes', 'white.css')
                themeCss = await readFile(fallbackPath, 'utf-8')
            } catch {
                themeCss = ':root { --r-background-color: #fff; --r-main-color: #000; }'
            }
        }

        // Process slides to inject audio elements and timing
        const processedSlides = await processSlideWithAudio(slides, audioCache)

        // Generate reveal.js HTML with voice functionality
        const revealHtml = generateVoiceRevealHtml({
            title: deckTitle,
            slides: processedSlides,
            themeCss,
            projectId,
            audioCache // Include the cache with Convex storage URLs
        })

        return new Response(revealHtml, {
            headers: {
                'Content-Type': 'text/html',
                'Content-Disposition': `attachment; filename="${deckTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_voice_presentation.html"`
            }
        })
    } catch (error) {
        console.error('Export error:', error)
        return new Response('Export failed', { status: 500 })
    }
}

async function processSlideWithAudio(
    slides: Array<{ name?: string; html: string; css: string[]; containerStyle?: string }>,
    audioCache: Record<string, any>
): Promise<Array<{ name?: string; html: string; css: string[]; containerStyle?: string }>> {

    const processedSlides = await Promise.all(slides.map(async (slide, slideIndex) => {
        const slideAudio = audioCache[slideIndex]
        if (!slideAudio || !Array.isArray(slideAudio)) return slide

        // Parse the HTML to inject audio elements
        const parser = new DOMParser()
        const doc = parser.parseFromString(slide.html, 'text/html')

        // Add empty fragment at beginning of non-first slides (for timing)
        if (slideIndex > 0) {
            const emptyFragment = doc.createElement('div')
            emptyFragment.className = 'fragment'
            emptyFragment.setAttribute('data-autoslide', '10')
            emptyFragment.setAttribute('data-fragment-index', '0')
            doc.body.insertBefore(emptyFragment, doc.body.firstChild)
        }

        // Find all elements with data-tts attribute
        const ttsElements = doc.querySelectorAll('[data-tts]')

        // Process each TTS element
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

            // Set timing attributes
            const duration = audioData.duration || 1000
            fragmentWrapper.setAttribute('data-autoslide', String(duration + 250)) // Add buffer
            fragmentWrapper.setAttribute('data-tts', audioData.ttsText || '')

            // Set fragment index
            const adjustedIndex = slideIndex > 0 ? fragmentIndex + 1 : fragmentIndex
            fragmentWrapper.setAttribute('data-fragment-index', String(adjustedIndex))

            // Add audio element with Convex storage URL
            const audio = doc.createElement('audio')
            const audioSrc = audioData.audioUrl || '' // This is the Convex storage URL

            // Store the Convex URL as data attribute
            // The HTML will load this when the fragment is shown
            audio.setAttribute('data-audio-src', audioSrc)
            audio.setAttribute('data-fragment-audio', 'true')
            audio.setAttribute('data-duration', String(duration))

            // Add debug info
            if (audioSrc) {
                audio.setAttribute('data-audio-source-type', 'convex-storage')
                audio.setAttribute('data-storage-id', audioData.audioFileId || '')
            }

            fragmentWrapper.appendChild(audio)
        }))

        // Serialize back to HTML
        return { ...slide, html: doc.body.innerHTML }
    }))

    return processedSlides
}

interface GenerateVoiceRevealHtmlOptions {
    title: string
    slides: Array<{ name?: string; html: string; css: string[]; containerStyle?: string }>
    themeCss: string
    projectId: string
    audioCache: Record<string, any>
}

function generateVoiceRevealHtml({ title, slides, themeCss, projectId, audioCache }: GenerateVoiceRevealHtmlOptions): string {
    // CSS scoping function
    const scopeCss = (cssText: string, scopeSelector: string): string => {
        try {
            return cssText
                .split('}')
                .map((chunk: string) => chunk.trim())
                .filter(Boolean)
                .map((rule: string) => {
                    const parts: string[] = rule.split('{')
                    if (parts.length < 2) return rule + '}'
                    const sel: string = parts[0].trim()
                    const body: string = parts.slice(1).join('{')

                    if (/^@/i.test(sel)) return `${sel}{${body}}`

                    const scopedSel: string = sel
                        .split(',')
                        .map((s: string) => s.trim())
                        .filter(Boolean)
                        .map((s: string) => {
                            if (/^html\b/i.test(s) || /^body\b/i.test(s)) {
                                s = s.replace(/^html\b\s*/i, '').replace(/^body\b\s*/i, '')
                                return `${scopeSelector}${s ? ' ' + s : ''}`
                            }
                            return `${scopeSelector} ${s}`
                        })
                        .join(', ')
                    return `${scopedSel}{${body}}`
                })
                .join('\n')
        } catch {
            return cssText
        }
    }

    // Generate slide sections
    const slideSections = slides.map((slide, i) => {
        const containerStyles = slide.containerStyle
            ? Object.fromEntries(
                slide.containerStyle.split(';')
                    .filter(Boolean)
                    .map(p => p.split(':'))
                    .map(([k, v]) => [k.trim(), (v || '').trim()])
            )
            : {}

        const inlineStyles = Object.entries(containerStyles)
            .map(([k, v]) => `${k}:${v}`)
            .join(';')

        const scopedCss = slide.css?.length
            ? scopeCss(slide.css.join('\n'), `[data-slide-scope="s${i}"] .ct-slide`)
            : ''

        return `
    <section data-slide-scope="s${i}" data-autoslide="${i === 0 ? '0' : '100'}">
      <div class="ct-slide" ${inlineStyles ? `style="${inlineStyles}"` : ''}>
        ${slide.html}
      </div>
      ${scopedCss ? `<style>${scopedCss}</style>` : ''}
    </section>`
    }).join('\n')

    // Include audio cache metadata (URLs are Convex storage URLs)
    const audioCacheScript = Object.keys(audioCache).length > 0
        ? `<script>
        // Audio cache data from ChalkTalk Studio
        // Note: audioUrl values are Convex storage URLs that will expire after some time
        // These URLs point to files stored in Convex storage, not base64 data
        window.CHALKTALK_AUDIO_CACHE = ${JSON.stringify(audioCache)};
        window.CHALKTALK_PROJECT_ID = "${projectId}";
        console.log('ChalkTalk Audio Cache loaded:', {
            slideCount: Object.keys(window.CHALKTALK_AUDIO_CACHE).length,
            slides: Object.entries(window.CHALKTALK_AUDIO_CACHE).map(([idx, items]) => ({
                slideIndex: idx,
                fragmentCount: items.length,
                hasUrls: items.every(item => item.audioUrl)
            }))
        });
        </script>`
        : ''

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)} - Voice Presentation</title>
    
    <!-- Reveal.js CSS -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.2.1/dist/reveal.css">
    
    <style>
    /* Theme CSS */
    ${themeCss}
    
    /* Custom presentation styles */
    .reveal .slides {
        text-align: left;
    }
    
    .ct-slide {
        width: 100%;
        height: 100%;
        position: relative;
    }

    /* Start presentation overlay */
    #startOverlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.85);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: opacity 0.3s ease;
    }

    #startOverlay.hidden {
        opacity: 0;
        pointer-events: none;
    }

    #startButton {
        background: #4CAF50;
        color: white;
        border: none;
        padding: 20px 40px;
        font-size: 24px;
        border-radius: 8px;
        cursor: pointer;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        transition: transform 0.2s, background 0.2s;
    }

    #startButton:hover {
        background: #45a049;
        transform: scale(1.05);
    }

    /* Voice presentation controls */
    .voice-controls {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 100;
        background: rgba(0, 0, 0, 0.7);
        padding: 10px 20px;
        border-radius: 8px;
        display: none; /* Initially hidden */
        gap: 15px;
        align-items: center;
        color: white;
    }

    .voice-controls.active {
        display: flex;
    }

    .voice-controls button {
        background: #4CAF50;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
    }

    .voice-controls button:hover {
        background: #45a049;
    }

    .voice-controls button:disabled {
        background: #666;
        cursor: not-allowed;
    }

    .voice-controls input[type="range"] {
        width: 100px;
    }

    .voice-controls .speed-indicator {
        min-width: 40px;
        text-align: center;
    }

    /* Fragment styles for voice mode */
    .reveal .slides section .fragment {
        opacity: 1 !important;
        visibility: inherit !important;
    }

    .reveal .slides section .fragment.visible {
        opacity: 1 !important;
    }

    /* Style reveal controls for voice mode - keep only play/pause */
    .reveal .controls {
        color: rgba(255, 255, 255, 0.8);
    }
    
    /* Optionally hide navigation arrows but keep play/pause */
    .reveal .controls .navigate-left,
    .reveal .controls .navigate-right,
    .reveal .controls .navigate-up,
    .reveal .controls .navigate-down {
        display: none;
    }
    
    /* Print styles */
    @media print {
        body { print-color-adjust: exact; }
        .reveal .slides section { page-break-after: always; }
        .voice-controls { display: none; }
    }
    </style>

    ${audioCacheScript}
</head>
<body>
    <div class="reveal">
        <div class="slides">
            ${slideSections}
        </div>
    </div>

    <!-- Start Presentation Overlay -->
    <div id="startOverlay">
        <button id="startButton">Start Presentation</button>
    </div>

    <!-- Voice Presentation Controls -->
    <div class="voice-controls">
        <button id="playPauseBtn">⏸ Pause</button>
        <button id="restartBtn">⟲ Restart</button>
        <div>
            <label>Speed: <span class="speed-indicator" id="speedIndicator">1x</span></label>
            <input type="range" id="speedControl" min="0.5" max="2" step="0.25" value="1">
        </div>
        <div>
            <label>Volume:</label>
            <input type="range" id="volumeControl" min="0" max="1" step="0.1" value="1">
        </div>
    </div>

    <!-- Reveal.js -->
    <script src="https://cdn.jsdelivr.net/npm/reveal.js@5.2.1/dist/reveal.js"></script>
    
    <script>
        // Voice Presentation Logic
        (function() {
            let currentAudio = null;
            let isPlaying = false;
            let hasStarted = false;
            let playbackRate = 1;
            let volume = 1;
            let handledFragments = new WeakSet();

            // Initialize Reveal.js
            const deck = new Reveal({
                hash: true,
                width: 1280,
                height: 720,
                margin: 0,
                controls: true, // Enable controls to show play/pause button
                progress: true,
                center: false,
                slideNumber: true,
                transition: 'none',
                keyboard: true,
                touch: true,
                autoSlide: 5000, // Set a default that will be overridden by data-autoslide
                autoSlideStoppable: true,
                fragments: true
            });

            deck.initialize();

            // Controls
            const startOverlay = document.getElementById('startOverlay');
            const startButton = document.getElementById('startButton');
            const voiceControls = document.querySelector('.voice-controls');
            const playPauseBtn = document.getElementById('playPauseBtn');
            const restartBtn = document.getElementById('restartBtn');
            const speedControl = document.getElementById('speedControl');
            const speedIndicator = document.getElementById('speedIndicator');
            const volumeControl = document.getElementById('volumeControl');

            // Start button handler
            startButton.addEventListener('click', () => {
                hasStarted = true;
                isPlaying = true;
                startOverlay.classList.add('hidden');
                voiceControls.classList.add('active');
                
                // Set data-autoslide on first slide to 0, others to 100
                document.querySelectorAll('.reveal .slides section').forEach((section, i) => {
                    section.setAttribute('data-autoslide', i === 0 ? '0' : '100');
                });
                
                // Start the presentation by advancing to next slide/fragment
                setTimeout(() => deck.next(), 500);
            });

            // Handle fragment events for audio playback
            deck.on('fragmentshown', (event) => {
                const fragment = event.fragment;
                
                // Don't play audio until presentation has started
                if (!hasStarted) return;
                
                if (handledFragments.has(fragment)) return;
                handledFragments.add(fragment);

                const audio = fragment.querySelector('audio[data-fragment-audio]');
                if (audio && isPlaying) {
                    playAudio(audio);
                }
            });

            deck.on('fragmenthidden', (event) => {
                const fragment = event.fragment;
                handledFragments.delete(fragment);
                
                const audio = fragment.querySelector('audio[data-fragment-audio]');
                if (audio && currentAudio === audio) {
                    stopAudio();
                }
            });

            deck.on('slidechanged', () => {
                if (currentAudio) {
                    stopAudio();
                }
                // Reset handled fragments for new slide
                handledFragments = new WeakSet();
            });

            function playAudio(audio) {
                if (currentAudio) {
                    currentAudio.pause();
                    currentAudio.currentTime = 0;
                }

                // Load audio source if needed
                const audioSrc = audio.getAttribute('data-audio-src');
                if (audioSrc && !audio.src) {
                    audio.src = audioSrc;
                }

                currentAudio = audio;
                audio.currentTime = 0;
                audio.playbackRate = playbackRate;
                audio.volume = volume;
                
                audio.play().catch(e => {
                    console.warn('Audio playback failed:', e);
                });
            }

            function stopAudio() {
                if (currentAudio) {
                    currentAudio.pause();
                    currentAudio.currentTime = 0;
                    currentAudio = null;
                }
            }

            function updatePlaybackSettings() {
                // Update all audio elements
                document.querySelectorAll('audio').forEach(audio => {
                    audio.playbackRate = playbackRate;
                    audio.volume = volume;
                });

                // Update fragment durations
                document.querySelectorAll('.fragment[data-autoslide]').forEach(fragment => {
                    const originalDuration = parseInt(
                        fragment.getAttribute('data-original-autoslide') ||
                        fragment.getAttribute('data-autoslide') || '0'
                    );

                    if (!fragment.getAttribute('data-original-autoslide')) {
                        fragment.setAttribute('data-original-autoslide', String(originalDuration));
                    }

                    fragment.setAttribute('data-autoslide', String(Math.round(originalDuration / playbackRate)));
                });
            }

            // Control event handlers
            playPauseBtn.addEventListener('click', () => {
                if (isPlaying) {
                    isPlaying = false;
                    playPauseBtn.textContent = '▶ Resume';
                    deck.pause();
                    if (currentAudio) currentAudio.pause();
                } else {
                    isPlaying = true;
                    playPauseBtn.textContent = '⏸ Pause';
                    deck.resume();
                    if (currentAudio) currentAudio.play();
                }
            });

            restartBtn.addEventListener('click', () => {
                stopAudio();
                deck.slide(0, 0, 0);
                hasStarted = false;
                isPlaying = false;
                playPauseBtn.textContent = '⏸ Pause';
                handledFragments = new WeakSet();
                
                // Show start overlay again
                startOverlay.classList.remove('hidden');
                voiceControls.classList.remove('active');
            });

            speedControl.addEventListener('input', (e) => {
                playbackRate = parseFloat(e.target.value);
                speedIndicator.textContent = playbackRate + 'x';
                updatePlaybackSettings();
            });

            volumeControl.addEventListener('input', (e) => {
                volume = parseFloat(e.target.value);
                updatePlaybackSettings();
            });

            // Log export info
            console.log('ChalkTalk Studio Voice Presentation');
            console.log('Project ID: ${projectId}');
            console.log('Export time:', new Date().toISOString());
            console.log('Audio cache available:', !!window.CHALKTALK_AUDIO_CACHE);
            
            // Debug: Show detailed audio elements info
            const audioElements = document.querySelectorAll('audio[data-fragment-audio]');
            console.log('Audio elements found:', audioElements.length);
            audioElements.forEach((audio, i) => {
                const src = audio.getAttribute('data-audio-src') || audio.src;
                const sourceType = audio.getAttribute('data-audio-source-type');
                const storageId = audio.getAttribute('data-storage-id');
                const duration = audio.getAttribute('data-duration');
                console.log(\`Audio \${i}:\`, {
                    hasSource: !!src,
                    sourceType: sourceType || 'unknown',
                    storageId: storageId || 'none',
                    duration: duration ? \`\${duration}ms\` : 'unknown',
                    urlPreview: src ? src.substring(0, 100) + '...' : 'none'
                });
            });
        })();
    </script>
</body>
</html>`
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}
