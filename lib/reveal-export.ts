import type { Id } from '@/convex/_generated/dataModel'

type ProjectLike = {
  pages?: Array<{ name?: string; component?: string; frames?: any[] }>
}

export type RevealSlide = {
  name?: string
  html: string
  css: string[]
}

const extractStyleBlocks = (html: string): { cleaned: string; styles: string[] } => {
  const styles: string[] = []
  let cleaned = html
  // Extract <style>...</style> blocks
  cleaned = cleaned.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (_m, css) => {
    styles.push(css as string)
    return ''
  })
  return { cleaned, styles }
}

const filterGlobalStyles = (cssList: string[]): string[] => {
  // Remove rules that target body/html to avoid leaking into Reveal shell
  return cssList
    .map((css) =>
      css
        // crude split, acceptable for simple blocks the editor emits
        .split('}')
        .map((rule) => rule.trim())
        .filter((rule) => rule.length > 0)
        .filter((rule) => !/^\s*(body|html)\s*[,\{]/i.test(rule))
        .map((rule) => rule + '}')
        .join('\n')
    )
    .filter((s) => s.trim().length > 0)
}

const extractSlideContainerInner = (html: string): string => {
  // Try to locate the slide container and take its inner HTML
  const containerMatch = html.match(/<div[^>]*data-slide-container[^>]*>([\s\S]*?)<\/div>/i)
  if (containerMatch) return containerMatch[1]
  // Fallback to full HTML
  return html
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
    // Prefer simple structure
    let raw = p.component as string | undefined
    if (!raw && p.frames?.[0]?.component) {
      // Convert component JSON tree to HTML
      const c = p.frames[0].component
      try {
        raw = componentJsonToHtml(c)
      } catch {
        raw = ''
      }
    }
    const { cleaned, styles } = extractStyleBlocks(raw || '')
    const inner = extractSlideContainerInner(cleaned)
    const css = filterGlobalStyles(styles)
    return { name: p.name, html: inner, css }
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
