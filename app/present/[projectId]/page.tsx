"use client"

import { use } from 'react'
import { useEffect, useMemo, useState } from 'react'
import Reveal from 'reveal.js'
import 'reveal.js/dist/reveal.css'
import 'reveal.js/dist/theme/white.css'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { extractRevealSlides } from '@/lib/reveal-export'

type PageProps = { params: Promise<{ projectId: string }> }

export default function PresentPage({ params }: PageProps) {
  const { projectId } = use(params)
  const deck = useQuery(api.slideDeck.GetProject, { projectId })
  const deckTitle = deck?.title || 'Presentation'

  const [reveal, setReveal] = useState<Reveal.Api | null>(null)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [exportTheme, setExportTheme] = useState('white')
  const [isControlsVisible, setIsControlsVisible] = useState(true)
  const [isControlsHovered, setIsControlsHovered] = useState(false)

  const slides = useMemo(() => (deck?.project ? extractRevealSlides(deck.project as any) : []), [deck?.project])

  // Initialize Reveal after slides are in DOM
  useEffect(() => {
    if (!slides.length) return

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
        try { return localStorage.getItem(`selectedThemeId:${projectId}`) || localStorage.getItem('selectedThemeId') || 'white' } catch { return 'white' }
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
      controls: true,
      progress: true,
      center: true,
      slideNumber: true,
      embedded: false,
      transition: 'none',
      keyboard: true,
      touch: true
    })
    setReveal(r)

    return () => {
      try { r?.destroy() } catch { }
    }
  }, [slides.length])

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
        cdn: 'true',
        theme: currentTheme
      })

      const response = await fetch(`/api/export/reveal?${params}`)

      if (!response.ok) {
        throw new Error('Export failed')
      }

      // Create download
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${deckTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_presentation.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

    } catch (error) {
      console.error('Export error:', error)
      alert('Export failed. Please try again.')
    }
  }

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

  if (deck === undefined) return <div>Loading...</div>
  if (!deck) return <div>Not found</div>

  // Basic CSS scoping: prefixes selectors so per-slide CSS only affects this slide
  const scopeCss = (cssText: string, scopeSelector: string): string => {
    try {
      // Handle @media blocks by scoping their inner rules
      const scoped: string = cssText.replace(/@media[^\{]+\{([\s\S]*?)\}/g, (m: string, inner: string) => {
        const innerScoped: string = scopeCss(inner, scopeSelector)
        return m.replace(inner, innerScoped)
      })
      // Scope simple rules
      return scoped
        .split('}')
        .map((chunk: string) => chunk.trim())
        .filter(Boolean)
        .map((rule: string) => {
          const parts: string[] = rule.split('{')
          if (parts.length < 2) return rule + '}'
          const sel: string = parts[0].trim()
          const body: string = parts.slice(1).join('{') // in case of nested braces in values
          // Skip at-rules other than @media already handled
          if (/^@/i.test(sel)) return `${sel}{${body}}`
          const scopedSel: string = sel
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean)
            .map((s: string) => {
              // Replace bare html/body with scope
              if (/^html\b/i.test(s) || /^body\b/i.test(s)) {
                // remove leading html/body and following space
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

  return (
    <div className="w-screen h-screen bg-white relative">
      {/* Collapsible Top Bar */}
      <div
        className={`fixed top-0 left-0 right-0 z-20 bg-black/80 backdrop-blur-sm text-white transition-transform duration-300 ${isControlsVisible ? 'translate-y-0' : '-translate-y-full'
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
          className="fixed top-2 left-2 z-20 w-8 h-8 rounded bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors text-lg"
          onClick={() => setIsControlsVisible(true)}
          title="Show controls (Ctrl+C or ESC)"
        >
          ⋮
        </button>
      )}

      <div className="reveal" style={{ width: '100%', height: '100%', background: '#fff' }}>
        <div className="slides">
          {slides.map((s, i) => (
            <section key={i} data-slide-scope={`s${i}`}>
              <div
                className="ct-slide"
                style={s.containerStyle ? (Object.fromEntries(s.containerStyle.split(';').filter(Boolean).map(p => p.split(':')).map(([k, v]) => [k.trim() as string, (v || '').trim()])) as React.CSSProperties) : undefined}
                dangerouslySetInnerHTML={{ __html: s.html }}
              />
              {s.css?.length ? (
                <style
                  // Scope per-slide CSS to this slide only
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
