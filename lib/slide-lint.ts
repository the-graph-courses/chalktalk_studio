import { JSDOM } from 'jsdom'
import {
    DENSITY_LIMITS,
    LAYOUT_CLASSES,
    NARRATION_WORD_LIMITS,
    type GenerationPreferences,
} from './slide-design'

/**
 * Server-side checks for AI-written slide HTML.
 *
 * `issues` block the slide (the tool asks the model to fix and resubmit, unless it passes
 * force: true because the user explicitly wants it). `warnings` are reported but applied.
 * Heuristics are deliberately conservative: a false "issue" costs a model round trip.
 */
export interface SlideLintResult {
    issues: string[]
    warnings: string[]
}

const KNOWN_LAYOUT_CLASSES = new Set<string>(LAYOUT_CLASSES)

// Outermost elements that count as one "content item" on a slide
const ITEM_SELECTOR = 'p, li, h3, blockquote, .ct-card, .ct-stat, .ct-step'

const words = (text: string | null | undefined) => (text || '').trim().split(/\s+/).filter(Boolean).length

const clip = (text: string, max = 60) => {
    const t = text.replace(/\s+/g, ' ').trim()
    return t.length > max ? `${t.slice(0, max)}...` : t
}

/** Text of an element, ignoring code blocks and tables (checked separately) */
const proseText = (el: Element): string => {
    const clone = el.cloneNode(true) as Element
    clone.querySelectorAll('pre, code, table, style').forEach(n => n.remove())
    return clone.textContent || ''
}

function checkCustomCss(css: string, rootClasses: string[], issues: string[]) {
    const scopeClasses = rootClasses.filter(c => c !== 'ct' && !c.startsWith('ct-') && c !== 'fragment')
    const rules = css
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/@[^{]+\{/g, '') // unwrap @media etc.; their inner rules are checked below
        .split('}')
        .map(chunk => {
            const [selector, body = ''] = chunk.split('{')
            return { selector: selector.trim(), body }
        })
        .filter(rule => rule.selector)

    // Deck-wide theming is allowed: `.ct { --ct-accent: ... }` with only --ct-* variables
    const isDeckVariables = (rule: { selector: string; body: string }) =>
        rule.selector === '.ct' &&
        rule.body.split(';').map(d => d.trim()).filter(Boolean).every(d => d.startsWith('--ct-'))

    const selectors = rules
        .filter(rule => !isDeckVariables(rule))
        .flatMap(rule => rule.selector.split(','))
        .map(sel => sel.trim())
        .filter(Boolean)

    const unscoped = selectors.filter(sel =>
        /^(html|body|:root)\b/i.test(sel) ||
        /^\.reveal\b/.test(sel) ||
        // Scoped = the first compound selector includes the slide's class (".s-x h2", ".ct.s-x h2")
        !scopeClasses.some(c => new RegExp(`\\.${c.replace(/[^\w-]/g, '')}(?![\\w-])`).test(sel.split(/[\s>+~]/)[0]))
    )
    if (unscoped.length) {
        const hint = scopeClasses.length
            ? `start every selector with .${scopeClasses[0]}`
            : 'add a unique class to the slide root (e.g. class="ct s-pricing") and start every selector with it'
        issues.push(`Custom CSS is shared by every slide in the deck, so it must be scoped to this slide: ${hint}. Unscoped selectors: ${unscoped.slice(0, 5).join(', ')}`)
    }
}

export function lintSlideHtml(html: string, prefs: GenerationPreferences): SlideLintResult {
    const issues: string[] = []
    const warnings: string[] = []
    const doc = new JSDOM(`<!DOCTYPE html><body>${html}</body>`).window.document
    const body = doc.body

    if (/<(html|head|body)[\s>]/i.test(html)) {
        issues.push('Send only the slide body: remove <html>, <head> and <body> tags.')
    }

    const rootElements = Array.from(body.children).filter(el => el.tagName !== 'STYLE')
    const root = rootElements.length === 1 ? rootElements[0] : null
    const rootClasses = root ? Array.from(root.classList) : []

    // --- Layout vocabulary ---
    if (prefs.layoutMode === 'layouts') {
        if (!root || !root.classList.contains('ct')) {
            warnings.push('The slide is not wrapped in a single <div class="ct ..."> layout root, so it will not get the deck layout and sizing.')
        }
        const unknown = new Set<string>()
        body.querySelectorAll('[class]').forEach(el => {
            el.classList.forEach(c => {
                if (c.startsWith('ct-') && !KNOWN_LAYOUT_CLASSES.has(c)) unknown.add(c)
            })
        })
        if (unknown.size) {
            issues.push(`Unknown layout classes: ${[...unknown].join(', ')}. Use only the documented ct-* classes, or define your own (non ct-) classes in a scoped <style>.`)
        }
    }

    // --- Custom CSS ---
    const css = Array.from(body.querySelectorAll('style')).map(s => s.textContent || '').join('\n')
    if (css.trim()) checkCustomCss(css, rootClasses, issues)

    // --- Density ---
    const limits = DENSITY_LIMITS[prefs.density]
    const items = Array.from(body.querySelectorAll(ITEM_SELECTOR))
        .filter(el => !el.parentElement?.closest(ITEM_SELECTOR))
        .filter(el => !el.closest('table, pre, .ct-footnote') && !el.classList.contains('ct-footnote'))
        .filter(el => !el.matches('.ct-kicker, .ct-lead, .ct-subtitle, .ct-quote-source') && words(proseText(el)) > 0)
        // Column headers label their column rather than adding content
        .filter(el => !(el.tagName === 'H3' && el.parentElement?.classList.contains('ct-col')))
    // Section dividers and title slides are exempt from item counts
    const isTitleLike = !!root?.matches('.ct-title-slide, .ct-section, .ct-quote')

    if (!isTitleLike && items.length > limits.items) {
        issues.push(`Too many content items for ${prefs.density} density: ${items.length} (limit ${limits.items}). Split this into ${Math.ceil(items.length / limits.items)} slides or merge related points.`)
    }
    const wordy = items.filter(el => words(proseText(el)) > limits.wordsPerItem)
    if (wordy.length) {
        issues.push(`${wordy.length} item(s) exceed ${limits.wordsPerItem} words for ${prefs.density} density; shorten the slide text and move the detail into the narration: ${wordy.slice(0, 3).map(el => `"${clip(proseText(el))}"`).join('; ')}`)
    }
    const bodyText = Array.from(body.children)
        .map(el => {
            const clone = el.cloneNode(true) as Element
            clone.querySelectorAll('h1, h2, .ct-kicker, .ct-footnote, pre, table, style').forEach(n => n.remove())
            return clone.textContent || ''
        })
        .join(' ')
    const totalWords = words(bodyText)
    if (totalWords > limits.totalWords) {
        issues.push(`The slide has ${totalWords} words of body text (limit ${limits.totalWords} for ${prefs.density} density). Cut it down or split it across slides.`)
    }
    body.querySelectorAll('h1, h2').forEach(h => {
        if (words(h.textContent) > 14) warnings.push(`Long heading (${words(h.textContent)} words): "${clip(h.textContent || '')}". Aim for 10 words or fewer.`)
    })

    // --- Tables and code ---
    body.querySelectorAll('table').forEach(table => {
        const rows = table.querySelectorAll('tr').length
        const cols = Math.max(0, ...Array.from(table.querySelectorAll('tr')).map(tr => tr.children.length))
        if (rows > limits.tableRows + 1) {
            issues.push(`Table has ${rows} rows (limit ${limits.tableRows} plus a header row); split it across slides or keep only the rows that matter.`)
        }
        if (cols > 5) issues.push(`Table has ${cols} columns (limit 5).`)
        const longCell = Array.from(table.querySelectorAll('td, th')).find(c => words(c.textContent) > 12)
        if (longCell) warnings.push(`Table cell with ${words(longCell.textContent)} words: "${clip(longCell.textContent || '')}". Keep cells to a few words.`)
    })
    body.querySelectorAll('pre').forEach(pre => {
        const lines = (pre.textContent || '').replace(/^\n+|\n+$/g, '').split('\n')
        if (lines.length > 16) issues.push(`Code block has ${lines.length} lines (limit 16); show only the lines that make the point.`)
        const wide = lines.filter(l => l.length > 72).length
        if (wide) warnings.push(`${wide} code line(s) are longer than 72 characters and may be cut off.`)
    })

    // --- Lists ---
    if (body.querySelector('ul, ol')) {
        warnings.push('Lists (ul/ol) do not animate or narrate well; prefer <div class="ct-points"> with one <p> per point unless the user asked for a list.')
    }

    // --- Fragments and narration ---
    const fragments = Array.from(body.querySelectorAll('.fragment'))
    if (prefs.reveal === 'whole' && fragments.length) {
        warnings.push('The deck is set to show whole slides at once, but this slide uses class="fragment".')
    }
    if (fragments.some(f => f.parentElement?.closest('.fragment'))) {
        warnings.push('Nested fragments: an element with class="fragment" is inside another fragment, which reveals out of order.')
    }
    if (root && root.classList.contains('fragment') && root.classList.contains('ct')) {
        warnings.push('The .ct layout root is a fragment, so the whole slide starts hidden. Put class="fragment" on the items instead.')
    }

    const ttsElements = Array.from(body.querySelectorAll('[data-tts]'))
    if (prefs.narration === 'off') {
        if (ttsElements.length) warnings.push('Narration is turned off for this deck, but the slide has data-tts attributes.')
    } else {
        if (prefs.reveal === 'stepwise') {
            const silent = fragments.filter(f => !(f.getAttribute('data-tts') || '').trim())
            if (silent.length) {
                issues.push(`${silent.length} fragment(s) have no data-tts narration: ${silent.slice(0, 3).map(f => `"${clip(f.textContent || '', 40)}"`).join('; ')}.`)
            }
        } else if (!ttsElements.length) {
            issues.push('Add a data-tts attribute with the narration for this slide (on the .ct root).')
        }

        const maxWords = NARRATION_WORD_LIMITS[prefs.narration]
        const long = ttsElements.filter(el => words(el.getAttribute('data-tts')) > maxWords * 1.25)
        if (long.length) {
            warnings.push(`${long.length} narration(s) are longer than ~${maxWords} words for "${prefs.narration}" narration.`)
        }
        const unspeakable = ttsElements
            .map(el => el.getAttribute('data-tts') || '')
            .filter(t => /\d|[#*=+<>/\\|~^_%$&@]|->|•/.test(t))
        if (unspeakable.length) {
            warnings.push(`${unspeakable.length} narration(s) contain digits or symbols; write them out as spoken words: "${clip(unspeakable[0], 70)}"`)
        }
        const echoes = ttsElements.filter(el => {
            const shown = (el.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase()
            const spoken = (el.getAttribute('data-tts') || '').replace(/\s+/g, ' ').trim().toLowerCase()
            return shown.length > 20 && spoken === shown
        })
        if (echoes.length) {
            warnings.push(`${echoes.length} narration(s) just repeat the slide text; add the context or example the slide leaves out.`)
        }
    }

    return { issues, warnings }
}
