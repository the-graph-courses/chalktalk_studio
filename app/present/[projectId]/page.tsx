"use client"

import { use } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import Reveal from 'reveal.js'
import 'reveal.js/dist/reveal.css'
import 'reveal.js/dist/theme/white.css'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { extractRevealSlides, gatherSlideTTS } from '@/lib/reveal-export'
import { extractTTSFromSlideHtml } from '@/lib/tts-extract'
import { useSearchParams } from 'next/navigation'

type PageProps = { params: Promise<{ projectId: string }> }

export default function PresentPage({ params }: PageProps) {
  const { projectId } = use(params)
  const deck = useQuery(api.slideDeck.GetProject, { projectId })
  const search = useSearchParams()
  const autoplay = search.get('autoplay') === '1'
  const deckTitle = deck?.title || 'Presentation'

  const [reveal, setReveal] = useState<Reveal.Api | null>(null)
  const [needsUserAction, setNeedsUserAction] = useState(false)

  const slides = useMemo(() => (deck?.project ? extractRevealSlides(deck.project as any) : []), [deck?.project])
  // No global CSS merge; inject styles per slide inside each section for scoping

  // Initialize Reveal after slides are in DOM
  useEffect(() => {
    if (!slides.length) return
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
      center: true,
      slideNumber: true,
      embedded: false,
      transition: 'none',
    })
    setReveal(r)
    return () => {
      try { r?.destroy() } catch { }
    }
  }, [slides.length])

  // TTS cache per slide index
  // Per-slide audio sequences (array of data URLs)
  const [audioSeqs, setAudioSeqs] = useState<Record<number, string[]>>({})
  const [loadingIndex] = useState<number | null>(null)
  const currentIndexRef = useRef<number>(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [volume, setVolume] = useState(1)
  const [playbackState, setPlaybackState] = useState<'stopped' | 'playing' | 'paused'>('stopped')
  const sessionTokenRef = useRef<number>(0)
  const playSlideRef = useRef<(idx: number) => void>(() => { })
  const currentClipRef = useRef<number>(0)
  const currentAudioElRef = useRef<HTMLAudioElement | null>(null)
  const userUnlockedRef = useRef<boolean>(false)
  const audioQueueRef = useRef<HTMLAudioElement[]>([])
  const currentAudioIndexRef = useRef<number>(0)

  // Load any pre-generated audio cache from localStorage (always register this hook)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`ttsCache:${projectId}`)
      if (raw) {
        const data = JSON.parse(raw) as { slides: { index: number; perElement: string[] }[] }
        const seqs: Record<number, string[]> = {}
        data.slides.forEach(s => { if (s.perElement?.length) seqs[s.index] = s.perElement })
        setAudioSeqs(seqs)
      }
    } catch { }
  }, [projectId])

  // Also try to load sequences from Convex; generate if missing
  useEffect(() => {
    let cancelled = false
      ; (async () => {
        try {
          let res = await fetch(`/api/tts/cache?projectId=${encodeURIComponent(projectId)}`)
          if (!res.ok) return
          const obj = await res.json()
          if (cancelled) return
          const seqs: Record<number, string[]> = {}
          for (const [k, arr] of Object.entries(obj || {})) {
            const n = Number(k)
            if (!Array.isArray(arr)) continue
            const urls = (arr as any[])
              .sort((a, b) => (a.elementIndex ?? 0) - (b.elementIndex ?? 0))
              .map((x: any) => x.audioDataUrl)
              .filter(Boolean)
            if (urls.length) seqs[n] = urls
          }
          if (!Object.keys(seqs).length) {
            await fetch('/api/tts/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId }) })
            res = await fetch(`/api/tts/cache?projectId=${encodeURIComponent(projectId)}`)
            if (res.ok) {
              const obj2 = await res.json()
              for (const [k, arr] of Object.entries(obj2 || {})) {
                const n = Number(k)
                if (!Array.isArray(arr)) continue
                const urls = (arr as any[])
                  .sort((a, b) => (a.elementIndex ?? 0) - (b.elementIndex ?? 0))
                  .map((x: any) => x.audioDataUrl)
                  .filter(Boolean)
                if (urls.length) seqs[n] = urls
              }
            }
          }
          setAudioSeqs(seqs)
        } catch {
          // Error loading audio
        }
      })()
    return () => { cancelled = true }
  }, [projectId])

  // Start playback automatically when user clicks Play
  useEffect(() => {
    if (!reveal) return
    if (playbackState === 'playing') {
      try {
        const idx = (reveal as any)?.getIndices?.().h ?? 0
        playSlideRef.current(idx)
      } catch { }
    }
  }, [playbackState, reveal, audioSeqs])

  // Playback control: respond to slide changes only when playing
  useEffect(() => {
    if (!reveal) return
    const waitUntilCanPlay = (el: HTMLAudioElement, timeoutMs = 4000) => {
      return new Promise<void>((resolve) => {
        let done = false
        const onReady = () => {
          if (done) return
          done = true
          el.removeEventListener('canplaythrough', onReady)
          resolve()
        }
        const to = setTimeout(() => {
          if (done) return
          done = true
          el.removeEventListener('canplaythrough', onReady)
          resolve()
        }, timeoutMs)
        el.addEventListener('canplaythrough', onReady, { once: true })
        // if already have enough data
        if (el.readyState >= 3) {
          clearTimeout(to)
          onReady()
        }
      })
    }

    const playSlide = async (indexh: number) => {
      const session = ++sessionTokenRef.current
      currentIndexRef.current = indexh
      // Find audio elements embedded in this slide
      const sections = Array.from(document.querySelectorAll('.reveal .slides > section')) as HTMLElement[]
      const sec = sections[indexh]
      const audios = sec ? (Array.from(sec.querySelectorAll('audio[data-tts-audio]')) as HTMLAudioElement[]) : []
      
      // Store audio queue for this slide
      audioQueueRef.current = audios
      currentAudioIndexRef.current = 0
      
      if (audios.length === 0) {
        if (playbackState === 'playing' && sessionTokenRef.current === session) {
          setTimeout(() => reveal.next(), 400)
        }
        return
      }
      
      currentClipRef.current = 0
      
      const playNext = async () => {
        if (sessionTokenRef.current !== session) return
        if (playbackState !== 'playing') return
        
        const i = currentAudioIndexRef.current
        if (i >= audios.length) {
          try { (reveal as any).next?.() } catch { }
          return
        }
        
        const el = audios[i]
        currentAudioElRef.current = el
        currentAudioIndexRef.current = i + 1
        currentClipRef.current = i
        
        // Apply rate/volume
        el.playbackRate = playbackRate
        el.volume = volume
        
        // Clear any existing listeners first
        el.onended = null
        el.onerror = null
        
        // Set up new listeners
        el.onended = () => {
          el.onended = null
          if (playbackState === 'playing' && sessionTokenRef.current === session) {
            try { (reveal as any).nextFragment?.() } catch { }
            playNext()
          }
        }
        
        el.onerror = () => {
          el.onerror = null
          if (playbackState === 'playing' && sessionTokenRef.current === session) {
            playNext()
          }
        }
        
        el.currentTime = 0
        // Wait to reduce stutters on first play
        await waitUntilCanPlay(el)
        
        if (playbackState === 'playing' && sessionTokenRef.current === session) {
          el.play().catch(() => setNeedsUserAction(true))
        }
      }
      
      playNext()
    }
    playSlideRef.current = playSlide

    const onSlideChanged = (event: any) => {
      if (playbackState !== 'playing') return
      const indexh = event.indexh ?? 0
      playSlide(indexh)
    }
    reveal.on('slidechanged', onSlideChanged)
    return () => {
      reveal.off('slidechanged', onSlideChanged)
      try { currentAudioElRef.current?.pause() } catch { }
    }
  }, [reveal, audioSeqs, playbackRate, volume, playbackState])

  // Global click/tap unlock handler so browsers allow audio playback
  useEffect(() => {
    if (userUnlockedRef.current) return
    const onFirstGesture = () => {
      userUnlockedRef.current = true
      // Prime an Audio element
      try {
        const a = new Audio()
        a.muted = true
        a.play().finally(() => { a.pause(); a.currentTime = 0; a.muted = false })
      } catch { }
      window.removeEventListener('pointerdown', onFirstGesture)
      window.removeEventListener('keydown', onFirstGesture)
    }
    window.addEventListener('pointerdown', onFirstGesture, { once: true })
    window.addEventListener('keydown', onFirstGesture, { once: true })
    return () => {
      window.removeEventListener('pointerdown', onFirstGesture)
      window.removeEventListener('keydown', onFirstGesture)
    }
  }, [])

  // Always reflect current playbackRate/volume onto any rendered audio tags for current slide
  useEffect(() => {
    try {
      const sections = Array.from(document.querySelectorAll('.reveal .slides > section')) as HTMLElement[]
      const idx = (reveal as any)?.getIndices?.().h ?? 0
      const sec = sections[idx]
      const audios = sec ? (Array.from(sec.querySelectorAll('audio[data-tts-audio]')) as HTMLAudioElement[]) : []
      audios.forEach((el) => {
        el.playbackRate = playbackRate
        el.volume = volume
      })
    } catch { }
  }, [reveal, playbackRate, volume])

  if (deck === undefined) return <div>Loading...</div>
  if (!deck) return <div>Not found</div>

  return (
    <div className="w-screen h-screen bg-white">
      {/* Top bar */}
      <div className="fixed top-3 left-3 z-20 flex items-center gap-2">
        <a href={`/editor/${projectId}`} className="px-3 py-1 rounded bg-white/90 text-black text-sm shadow">Back to Editor</a>
        {autoplay && (
          <div className="px-3 py-1 rounded bg-white/70 text-black text-sm shadow">
            {loadingIndex !== null ? `Generating audio for slide ${loadingIndex + 1}…` : 'Auto‑TTS enabled'}
          </div>
        )}
        {autoplay && needsUserAction && (
          <button
            className="px-3 py-1 rounded bg-emerald-500 text-white text-sm shadow"
            onClick={() => {
              setNeedsUserAction(false)
              if (currentAudioElRef.current) {
                currentAudioElRef.current.play().catch(() => setNeedsUserAction(true))
              }
            }}
          >
            Enable Audio
          </button>
        )}
      </div>

      {/* Controls bottom center */}
      {autoplay && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-white/85 text-black rounded px-3 py-2 shadow">
          <button
            className="px-2 py-1 rounded bg-black/70 text-white text-xs"
            onClick={() => {
              const rates = [0.75, 1, 1.25, 1.5]
              const idx = rates.indexOf(playbackRate)
              const next = rates[(idx + 1) % rates.length]
              setPlaybackRate(next)
              if (currentAudioElRef.current) {
                currentAudioElRef.current.playbackRate = next
              }
            }}
          >
            {playbackRate.toFixed(2)}x
          </button>
          {playbackState === 'stopped' ? (
            <button
              className="px-2 py-1 rounded bg-black/70 text-white text-xs"
              onClick={() => {
                setPlaybackState('playing')
                try { (reveal as any)?.slide?.(0) } catch { }
              }}
            >
              Play
            </button>
          ) : playbackState === 'playing' ? (
            <>
              <button
                className="px-2 py-1 rounded bg-black/70 text-white text-xs"
                onClick={() => {
                  setPlaybackState('paused')
                  if (currentAudioElRef.current) {
                    currentAudioElRef.current.pause()
                  }
                }}
              >
                Pause
              </button>
              <button
                className="px-2 py-1 rounded bg-red-600 text-white text-xs"
                onClick={() => {
                  setPlaybackState('stopped')
                  sessionTokenRef.current++
                  if (currentAudioElRef.current) {
                    currentAudioElRef.current.pause()
                    currentAudioElRef.current.currentTime = 0
                  }
                  currentAudioElRef.current = null
                  audioQueueRef.current = []
                  currentAudioIndexRef.current = 0
                }}
              >
                Stop
              </button>
            </>
          ) : (
            <button
              className="px-2 py-1 rounded bg-green-600 text-white text-xs"
              onClick={async () => {
                setPlaybackState('playing')
                const el = currentAudioElRef.current
                if (el) {
                  // Resume current audio
                  el.play().catch(() => setNeedsUserAction(true))
                } else {
                  // Restart from current slide
                  const idx = (reveal as any)?.getIndices?.().h ?? 0
                  playSlideRef.current(idx)
                }
              }}
            >
              Resume
            </button>
          )}
          <div className="flex items-center gap-2 text-xs">
            <span>Vol</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => {
                const v = Number(e.target.value)
                setVolume(v)
                if (currentAudioElRef.current) {
                  currentAudioElRef.current.volume = v
                }
              }}
            />
          </div>
        </div>
      )}

      <div className="reveal" style={{ width: '100%', height: '100%', background: '#fff' }}>
        <div className="slides">
          {slides.map((s, i) => (
            <section key={i}>
              <div
                style={s.containerStyle ? (Object.fromEntries(s.containerStyle.split(';').filter(Boolean).map(p => p.split(':')).map(([k, v]) => [k.trim() as string, (v || '').trim()])) as React.CSSProperties) : undefined}
                dangerouslySetInnerHTML={{ __html: s.html }}
              />
              {/* Embed per-element audio tags for this slide if sequences are preloaded */}
              {audioSeqs[i]?.map((url, j) => (
                <audio key={j} data-tts-audio data-order={j} preload="auto" src={url} />
              ))}
              {s.css?.length ? (
                <style dangerouslySetInnerHTML={{ __html: s.css.join('\n') }} />
              ) : null}
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
