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

  const slides = useMemo(() => (deck?.project ? extractRevealSlides(deck.project as any) : []), [deck?.project])
  const mergedCss = useMemo(() => slides.flatMap((s) => s.css).join('\n'), [slides])

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

  // Prepare TTS audio when autoplay
  useEffect(() => {
    if (!autoplay || !slides.length) return
    let cancelled = false
    ;(async () => {
      const blobs: (string | null)[] = []
      for (let i = 0; i < slides.length; i++) {
        const text = gatherSlideTTS(slides[i].html)
        if (!text) { blobs.push(null); continue }
        try {
          const res = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
          })
          if (!res.ok) throw new Error('TTS failed')
          const arrayBuf = await res.arrayBuffer()
          const blobUrl = URL.createObjectURL(new Blob([arrayBuf], { type: 'audio/mpeg' }))
          blobs.push(blobUrl)
        } catch {
          blobs.push(null)
        }
        if (cancelled) return
      }
      setAudioBlobs(blobs)
    })()
    return () => { cancelled = true }
  }, [autoplay, slides])

  // Autoplay logic: play audio per slide and advance on end
  useEffect(() => {
    if (!autoplay || !reveal) return
    const audio = (audioRef.current ||= new Audio())
    audio.onended = () => {
      // advance to next slide after audio ends
      reveal.next()
    }
    const onSlide = (event: any) => {
      const indexh = event.indexh || 0
      const url = audioBlobs[indexh]
      if (url) {
        audio.src = url
        audio.play().catch(() => {/* ignore */})
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
      <div className="reveal" style={{ width: '100%', height: '100%' }}>
        <div className="slides">
          {slides.map((s, i) => (
            <section key={i} dangerouslySetInnerHTML={{ __html: s.html }} />
          ))}
        </div>
      </div>
      {mergedCss && (
        <style dangerouslySetInnerHTML={{ __html: mergedCss }} />
      )}
    </div>
  )
}

