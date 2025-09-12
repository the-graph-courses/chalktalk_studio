"use client"

import { use } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import Reveal from 'reveal.js'
import 'reveal.js/dist/reveal.css'
import 'reveal.js/dist/theme/white.css'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { extractRevealSlides, gatherSlideTTS } from '@/lib/reveal-export'
import { useSearchParams } from 'next/navigation'

type PageProps = { params: Promise<{ projectId: string }> }

export default function PresentPage({ params }: PageProps) {
  const { projectId } = use(params)
  const deck = useQuery(api.slideDeck.GetProject, { projectId })
  const search = useSearchParams()
  const autoplay = search.get('autoplay') === '1'
  const deckTitle = deck?.title || 'Presentation'

  const [reveal, setReveal] = useState<Reveal.Api | null>(null)
  const [audioBlobs, setAudioBlobs] = useState<(string | null)[]>([])
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
  const [audioUrls, setAudioUrls] = useState<Record<number, string>>({})
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null)

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
      const url = audioUrls[indexh]
      // Stop current audio
      audio.pause()
      audio.currentTime = 0
      // Gather text
      const text = gatherSlideTTS(slides[indexh]?.html || '')
      if (!text) {
        // No text; auto-advance after short delay to keep flow
        setLoadingIndex(null)
        setTimeout(() => reveal.next(), 800)
        return
      }
      // If cached, play
      if (url) {
        audio.src = url
        audio.play().catch(() => setNeedsUserAction(true))
        setLoadingIndex(null)
        return
      }
      // Else fetch and play
      try {
        setLoadingIndex(indexh)
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        })
        if (!res.ok) throw new Error(await res.text())
        const buf = await res.arrayBuffer()
        const blobUrl = URL.createObjectURL(new Blob([buf], { type: 'audio/mpeg' }))
        setAudioUrls((m) => ({ ...m, [indexh]: blobUrl }))
        audio.src = blobUrl
        await audio.play().catch(() => setNeedsUserAction(true))
      } catch (e) {
        console.error('TTS error', e)
        // Advance to avoid getting stuck
        setTimeout(() => reveal.next(), 800)
      } finally {
        setLoadingIndex(null)
      }
    }
    reveal.on('ready', onSlide)
    reveal.on('slidechanged', onSlide)
    return () => {
      reveal.off('ready', onSlide)
      reveal.off('slidechanged', onSlide)
      audio.pause()
    }
  }, [autoplay, reveal, audioBlobs])

  if (deck === undefined) return <div>Loading...</div>
  if (!deck) return <div>Not found</div>

  return (
    <div className="w-screen h-screen bg-black">
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

      <div className="reveal" style={{ width: '100%', height: '100%' }}>
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
