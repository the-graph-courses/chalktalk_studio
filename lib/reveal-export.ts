import type { Id } from '@/convex/_generated/dataModel'

type ProjectLike = {
  pages?: Array<{ name?: string; component?: string; frames?: any[] }>
}

export type RevealSlide = {
  name?: string
  html: string
  css: string[]
  containerStyle?: string
}

const extractStyleBlocks = (html: string): { cleaned: string; styles: string[] } => {
  const styles: string[] = []
  let cleaned = html
  // Extract <style>...</style> blocks; skip our editor-injected theme blocks
  cleaned = cleaned.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, (m) => {
    // Preserve editor theme/content CSS so slides keep their styles;
    // we will scope it on injection inside Present.
    const cssMatch = m.match(/<style[^>]*>([\s\S]*?)<\/style>/i)
    const css = cssMatch ? cssMatch[1] : ''
    styles.push(css)
    return ''
  })
  return { cleaned, styles }
}

const filterGlobalStyles = (cssList: string[]): string[] => {
  // Keep CSS as-is; scoping is applied at injection time in Present
  return cssList.filter((s) => s.trim().length > 0)
}

const extractSlideContainer = (html: string): { inner: string; style?: string } => {
  // Try to locate the slide container and take its inner HTML
  const containerMatch = html.match(/<div([^>]*)data-slide-container[^>]*>([\s\S]*?)<\/div>/i)
  if (containerMatch) {
    const attrs = containerMatch[1] || ''
    const styleMatch = attrs.match(/style\s*=\s*"([^"]*)"/i)
    const style = styleMatch ? styleMatch[1] : undefined
    return { inner: containerMatch[2], style }
  }
  // Fallback to full HTML
  return { inner: html }
}

const normalizeContainerStyle = (style?: string) => {
  if (!style) return undefined
  // Turn style string into map
  const map: Record<string, string> = {}
  style.split(';').map(s => s.trim()).filter(Boolean).forEach(pair => {
    const idx = pair.indexOf(':')
    if (idx === -1) return
    const key = pair.slice(0, idx).trim().toLowerCase()
    const val = pair.slice(idx + 1).trim()
    map[key] = val
  })
  // Force relative positioning so absolute children position inside
  map['position'] = 'relative'
  // Remove top/left to let Reveal center it; user layouts are absolute within
  delete map['top']
  delete map['left']
  // Ensure width/height preserved
  // Center in slide
  map['margin'] = '0 auto'
  // Construct back to string
  return Object.entries(map).map(([k, v]) => `${k}:${v}`).join(';')
}

// Convert GrapesJS component JSON to HTML (minimal subset)
function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function attrsToString(attrs: Record<string, any>, classes: string[] = []): string {
  const parts: string[] = []
  const classAttr = classes.filter(Boolean).join(' ')
  const a = attrs || {}
  for (const [k, v] of Object.entries(a)) {
    if (v === undefined || v === null || v === '') continue
    if (k === 'class' || k === 'className') continue
    parts.push(`${k}="${escapeHtml(String(v))}` + '"')
  }
  if (classAttr) parts.push(`class="${escapeHtml(classAttr)}"`)
  return parts.length ? ' ' + parts.join(' ') : ''
}

function typeToTag(node: any): string {
  if (node?.tagName) return node.tagName
  switch (node?.type) {
    case 'heading':
      return 'h1'
    case 'text':
      return 'p'
    default:
      return 'div'
  }
}

function componentJsonToHtml(node: any): string {
  if (!node) return ''
  if (node.type === 'textnode') {
    return escapeHtml(node.content || '')
  }
  const tag = typeToTag(node)
  const cls = Array.isArray(node.classes) ? node.classes : []
  const attrs = node.attributes || {}
  const children = Array.isArray(node.components) ? node.components : []
  const inner = children.map(componentJsonToHtml).join('')
  return `<${tag}${attrsToString(attrs, cls)}>${inner}</${tag}>`
}

export function extractRevealSlides(project: ProjectLike): RevealSlide[] {
  const pages = project?.pages || []
  return pages.map((p) => {
    // Prefer page HTML containing our slide container
    let raw = typeof p.component === 'string' ? p.component : undefined
    // If component string doesn't look like a wrapped slide, try frames[0]
    if ((!raw || !/data-slide-container/i.test(raw)) && p.frames?.[0]?.component) {
      const frameComp = p.frames[0].component
      if (typeof frameComp === 'string') {
        raw = frameComp
      } else {
        // Convert component JSON tree to HTML
        try {
          raw = componentJsonToHtml(frameComp)
        } catch {
          raw = ''
        }
      }
    }
    const { cleaned, styles } = extractStyleBlocks(raw || '')
    const { inner, style } = extractSlideContainer(cleaned)
    const containerStyle = normalizeContainerStyle(style)
    const css = filterGlobalStyles(styles)
    return { name: p.name, html: inner, css, containerStyle }
  })
}

export function gatherSlideTTS(slideHtml: string): string {
  // Collect text from any elements with data-tts attribute; if none, try text content fallback
  const div = globalThis.document?.createElement('div') || ({} as any)
  try {
    if (!div) return ''
    div.innerHTML = slideHtml
    const ttsNodes = div.querySelectorAll('[data-tts]') as unknown as Element[]
    const parts: string[] = []
    ttsNodes?.forEach((el: any) => {
      const val = el.getAttribute?.('data-tts') || ''
      if (val) parts.push(val)
    })
    if (parts.length > 0) return parts.join('\n')
    // fallback: extract textContent of slide
    const text = (div.textContent || '').replace(/\s+/g, ' ').trim()
    return text
  } catch {
    return ''
  }
}
