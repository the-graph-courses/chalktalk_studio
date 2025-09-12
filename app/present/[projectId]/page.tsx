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
  const audioRef = useRef<HTMLAudioElement | null>(null)
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
      try { r?.destroy() } catch {}
    }
  }, [slides.length])

  // TTS cache per slide index
  // Per-slide audio sequences (array of data URLs)
  const [audioSeqs, setAudioSeqs] = useState<Record<number, string[]>>({})
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null)
  const currentIndexRef = useRef<number>(0)
  const fetchTokenRef = useRef<number>(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [volume, setVolume] = useState(1)

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
    } catch {}
  }, [projectId])

  // Also try to load sequences from Convex via API (if available)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/tts/cache?projectId=${encodeURIComponent(projectId)}`)
        if (!res.ok) return
        const obj = await res.json()
        if (cancelled) return
        // obj is a map { [slideIndex: string]: [{ elementIndex, audioDataUrl }] }
        const seqs: Record<number, string[]> = {}
        for (const [k, arr] of Object.entries(obj || {})) {
          const n = Number(k)
          if (!Array.isArray(arr)) continue
          const urls = (arr as any[]).sort((a, b) => (a.elementIndex ?? 0) - (b.elementIndex ?? 0)).map((x: any) => x.audioDataUrl).filter(Boolean)
          if (urls.length) seqs[n] = urls
        }
        if (Object.keys(seqs).length) setAudioSeqs(seqs)
      } catch {}
    })()
    return () => { cancelled = true }
  }, [projectId])

  // Autoplay logic: play audio per slide and advance on end
  useEffect(() => {
    if (!autoplay || !reveal) return
    const audio = (audioRef.current ||= new Audio())
    audio.onended = () => {
      // advance to next slide after audio ends
      reveal.next()
    }
    const onSlide = async (event: any) => {
      const indexh = event.indexh ?? 0
      currentIndexRef.current = indexh
      const token = ++fetchTokenRef.current
      // Stop current audio
      audio.pause()
      audio.currentTime = 0
      audio.playbackRate = playbackRate
      audio.volume = volume

      // Try cached sequence first
      let seq = audioSeqs[indexh]

      // If no cached sequence, build from data-tts elements
      if (!seq) {
        const html = slides[indexh]?.html || ''
        const entries = extractTTSFromSlideHtml(html)
        if (entries.length === 0) {
          // Fallback: single clip from slide text
          const text = gatherSlideTTS(html)
          if (!text) {
            setLoadingIndex(null)
            setTimeout(() => reveal.next(), 800)
            return
          }
          try {
            setLoadingIndex(indexh)
            const res = await fetch('/api/tts', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text })
            })
            if (!res.ok) throw new Error(await res.text())
            const buf = await res.arrayBuffer()
            const blobUrl = URL.createObjectURL(new Blob([buf], { type: 'audio/mpeg' }))
            if (fetchTokenRef.current !== token) { URL.revokeObjectURL(blobUrl); return }
            seq = [blobUrl]
            setAudioSeqs((m) => ({ ...m, [indexh]: seq! }))
          } catch (e) {
            console.error('TTS error', e)
            setTimeout(() => reveal.next(), 800)
            setLoadingIndex(null)
            return
          }
        } else {
          // Generate element audios in order
          const urls: string[] = []
          try {
            setLoadingIndex(indexh)
            for (const ent of entries) {
              if (fetchTokenRef.current !== token) return
              const res = await fetch('/api/tts', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: ent.text })
              })
              if (!res.ok) throw new Error(await res.text())
              const buf = await res.arrayBuffer()
              const blobUrl = URL.createObjectURL(new Blob([buf], { type: 'audio/mpeg' }))
              urls.push(blobUrl)
            }
            if (fetchTokenRef.current !== token) { urls.forEach(u=>URL.revokeObjectURL(u)); return }
            seq = urls
            setAudioSeqs((m) => ({ ...m, [indexh]: urls }))
          } catch (e) {
            console.error('TTS error', e)
            setTimeout(() => reveal.next(), 800)
            setLoadingIndex(null)
            return
          }
        }
      }

      // Play sequence sequentially
      if (seq && seq.length) {
        (async () => {
          for (let i = 0; i < seq!.length; i++) {
            if (fetchTokenRef.current !== token) return
            audio.src = seq![i]
            audio.playbackRate = playbackRate
            audio.volume = volume
            try { await audio.play() } catch { setNeedsUserAction(true); return }
            await new Promise<void>((resolve) => {
              const onEnd = () => { cleanup(); resolve() }
              const onErr = () => { cleanup(); resolve() }
              const cleanup = () => {
                audio.removeEventListener('ended', onEnd)
                audio.removeEventListener('error', onErr)
              }
              audio.addEventListener('ended', onEnd, { once: true })
              audio.addEventListener('error', onErr, { once: true })
            })
            // Advance fragment after each element where possible
            try { (reveal as any).nextFragment?.() } catch {}
          }
          // After sequence completes, advance slide
          if (fetchTokenRef.current === token) reveal.next()
          setLoadingIndex(null)
        })()
      } else {
        setLoadingIndex(null)
        setTimeout(() => reveal.next(), 800)
      }
    }
    reveal.on('ready', onSlide)
    reveal.on('slidechanged', onSlide)
    return () => {
      reveal.off('ready', onSlide)
      reveal.off('slidechanged', onSlide)
      audio.pause()
    }
  }, [autoplay, reveal, audioSeqs, playbackRate, volume, slides])

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
              const a = (audioRef.current ||= new Audio())
              if (a.src) {
                a.play().catch(() => setNeedsUserAction(true))
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
              const a = (audioRef.current ||= new Audio())
              a.playbackRate = next
            }}
          >
            {playbackRate.toFixed(2)}x
          </button>
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
                const a = (audioRef.current ||= new Audio())
                a.volume = v
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
                style={s.containerStyle ? (Object.fromEntries(s.containerStyle.split(';').filter(Boolean).map(p=>p.split(':')).map(([k, v])=>[k.trim() as string, (v||'').trim()])) as React.CSSProperties) : undefined}
                dangerouslySetInnerHTML={{ __html: s.html }}
              />
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
