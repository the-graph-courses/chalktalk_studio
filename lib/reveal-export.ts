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

// Find the element opening at `openMatch` and return its inner HTML, balancing nested divs
// (a lazy regex would stop at the first nested </div> and truncate the slide)
const innerOfDiv = (html: string, openMatch: RegExpExecArray): { inner: string; end: number } => {
  const start = openMatch.index + openMatch[0].length
  const tagRe = /<div\b[^>]*>|<\/div\s*>/gi
  tagRe.lastIndex = start
  let depth = 1
  let m: RegExpExecArray | null
  while ((m = tagRe.exec(html))) {
    if (m[0][1] === '/') {
      if (--depth === 0) return { inner: html.slice(start, m.index), end: m.index + m[0].length }
    } else if (!m[0].endsWith('/>')) {
      depth++
    }
  }
  return { inner: html.slice(start), end: html.length }
}

// Group 1 is the attributes before data-slide-container (where the old extractor looked for a style)
const CONTAINER_OPEN_RE = /<div\b([^>]*?)\bdata-slide-container\b[^>]*>/i

const extractSlideContainer = (html: string): { inner: string; style?: string } => {
  // Take the slide container's inner HTML. Containers are sometimes nested (the editor can
  // wrap an already-wrapped slide), so keep unwrapping while the content is just a container.
  let inner = html
  let style: string | undefined
  let found = false
  for (let depth = 0; depth < 5; depth++) {
    const trimmed = inner.trim()
    const m = CONTAINER_OPEN_RE.exec(trimmed)
    if (!m) break
    const { inner: next, end } = innerOfDiv(trimmed, m)
    // A nested container is only unwrapped when it is the entire content
    if (found && (m.index !== 0 || end !== trimmed.length)) break
    style ??= m[1].match(/style\s*=\s*"([^"]*)"/i)?.[1]
    inner = next
    found = true
  }
  return { inner, style }
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

export function componentJsonToHtml(node: any): string {
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

type GrapesStyleRule = {
  selectors?: Array<string | { name: string; type?: number }>
  selectorsAdd?: string
  state?: string
  mediaText?: string
  atRuleType?: string
  style?: Record<string, string>
}

const collectContainerIds = (node: any, ids: Set<string>) => {
  if (!node || typeof node !== 'object') return
  const attrs = node.attributes || {}
  if (attrs['data-slide-container'] && attrs.id) ids.add(String(attrs.id))
  for (const child of Array.isArray(node.components) ? node.components : []) collectContainerIds(child, ids)
}

/**
 * Rebuild the deck's custom CSS from the editor's project-level style rules.
 *
 * The editor moves every <style> the AI or user writes (and every style edited in the style
 * manager) into project.styles, so without this slides lose their custom styling when presented.
 * Skipped: element-only rules (the injected editor theme, which Reveal themes replace) and the
 * slide containers' own sizing rules.
 */
export function projectCustomCss(project: { styles?: unknown; pages?: any[] } | null | undefined): string {
  const rules = Array.isArray(project?.styles) ? (project!.styles as GrapesStyleRule[]) : []
  if (!rules.length) return ''

  const containerIds = new Set<string>()
  for (const page of project?.pages || []) {
    for (const frame of page?.frames || []) collectContainerIds(frame?.component, containerIds)
  }

  const out: string[] = []
  for (const rule of rules) {
    const decls = Object.entries(rule.style || {})
      .filter(([k, v]) => k && typeof v === 'string' && v !== '')
      .map(([k, v]) => `${k}:${v}`)
      .join(';')
    if (!decls) continue

    const compound = (rule.selectors || [])
      .map((sel) => {
        if (typeof sel === 'string') return sel.startsWith('#') ? sel : `.${sel}`
        return sel.type === 2 ? `#${sel.name}` : `.${sel.name}`
      })
      .join('')
    if (compound.startsWith('#') && containerIds.has(compound.slice(1))) continue

    const selectorParts = [
      compound ? `${compound}${rule.state ? `:${rule.state}` : ''}` : '',
      rule.selectorsAdd || '',
    ].filter(Boolean)
    const selector = selectorParts.join(', ')
    // Element-only selectors (body, h1, table th...) come from the editor theme block
    if (!selector || !/[.#]/.test(selector)) continue

    const css = `${selector}{${decls}}`
    out.push(rule.mediaText ? `@media ${rule.mediaText}{${css}}` : css)
  }
  return out.join('\n')
}

/** Clean HTML for one slide (container and editor theme removed), for the AI to read */
export function slideBodyHtml(page: { component?: string; frames?: any[] } | undefined): string {
  if (!page) return ''
  const [slide] = extractRevealSlides({ pages: [page as any] })
  const html = slide.html
    .replace(/<style[^>]*data-ct-page-theme[^>]*>[\s\S]*?<\/style>/gi, '')
    .trim()
  // Blank pages still carry empty (sometimes malformed) container markup; report them as empty
  const hasContent = /<(img|video|iframe|svg|table|hr)\b/i.test(html) || html.replace(/<[^>]+>/g, '').trim() !== ''
  return hasContent ? html : ''
}

/** CSS rules from `customCss` that mention a class or id used in `html` */
export function cssRelevantToHtml(customCss: string, html: string): string {
  const used = new Set<string>()
  for (const m of html.matchAll(/\bclass\s*=\s*"([^"]*)"/gi)) m[1].split(/\s+/).filter(Boolean).forEach(c => used.add(`.${c}`))
  for (const m of html.matchAll(/\bid\s*=\s*"([^"]*)"/gi)) used.add(`#${m[1]}`)
  return customCss
    .split('\n')
    .filter((rule) => {
      const tokens = rule.match(/[.#][A-Za-z_][\w-]*/g) || []
      // Layout classes are documented in the prompt; only return the slide's own rules
      return tokens.some((t) => used.has(t) && !/^\.(ct(-[\w-]+)?|fragment)$/.test(t))
    })
    .join('\n')
}

