/**
 * Slide generation design system: user preferences, the layout vocabulary and the
 * system prompt for the AI assistant. Safe to import on client and server.
 *
 * The layout classes described here are implemented in public/themes/ct-layouts.css.
 */

export type Density = 'minimal' | 'balanced' | 'detailed'
export type Narration = 'off' | 'brief' | 'standard' | 'detailed'
export type RevealMode = 'stepwise' | 'whole'
export type LayoutMode = 'layouts' | 'freeform'

export interface GenerationPreferences {
    /** How much text goes on each slide */
    density: Density
    /** How much spoken narration (data-tts) to write */
    narration: Narration
    /** Reveal items one by one (fragments) or show the whole slide at once */
    reveal: RevealMode
    /** Compose from ChalkTalk layouts, or position elements absolutely */
    layoutMode: LayoutMode
    /** Free-form deck brief: audience, tone, language, branding, standing instructions */
    instructions: string
}

export const DEFAULT_PREFERENCES: GenerationPreferences = {
    density: 'balanced',
    narration: 'standard',
    reveal: 'stepwise',
    layoutMode: 'layouts',
    instructions: '',
}

const MAX_INSTRUCTIONS_LENGTH = 4000

const pick = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
    allowed.includes(value as T) ? (value as T) : fallback

/** Coerce untrusted input (request body, localStorage) into valid preferences */
export function normalizePreferences(input: unknown): GenerationPreferences {
    const raw = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
    return {
        density: pick(raw.density, ['minimal', 'balanced', 'detailed'] as const, DEFAULT_PREFERENCES.density),
        narration: pick(raw.narration, ['off', 'brief', 'standard', 'detailed'] as const, DEFAULT_PREFERENCES.narration),
        reveal: pick(raw.reveal, ['stepwise', 'whole'] as const, DEFAULT_PREFERENCES.reveal),
        // Legacy chat setting
        layoutMode: raw.preferAbsolutePositioning === true
            ? 'freeform'
            : pick(raw.layoutMode, ['layouts', 'freeform'] as const, DEFAULT_PREFERENCES.layoutMode),
        instructions: typeof raw.instructions === 'string'
            ? raw.instructions.slice(0, MAX_INSTRUCTIONS_LENGTH)
            : '',
    }
}

/** Per-slide limits used by both the prompt and the server-side slide checks */
export const DENSITY_LIMITS: Record<Density, { items: number; wordsPerItem: number; totalWords: number; tableRows: number }> = {
    minimal: { items: 4, wordsPerItem: 12, totalWords: 45, tableRows: 5 },
    balanced: { items: 6, wordsPerItem: 20, totalWords: 80, tableRows: 7 },
    detailed: { items: 8, wordsPerItem: 30, totalWords: 130, tableRows: 10 },
}

export const NARRATION_WORD_LIMITS: Record<Exclude<Narration, 'off'>, number> = {
    brief: 25,
    standard: 45,
    detailed: 80,
}

/** Every ct-* class the stylesheet defines; anything else is a typo or invention */
export const LAYOUT_CLASSES = [
    'ct', 'ct-title-slide', 'ct-section', 'ct-quote',
    'ct-kicker', 'ct-lead', 'ct-subtitle', 'ct-footnote', 'ct-accent', 'ct-muted',
    'ct-points', 'ct-point', 'ct-cols', 'ct-col', 'ct-grid', 'ct-grid-2', 'ct-grid-3', 'ct-card',
    'ct-stats', 'ct-stat', 'ct-stat-value', 'ct-stat-label', 'ct-steps', 'ct-step',
    'ct-quote-text', 'ct-quote-source', 'ct-table', 'ct-code', 'ct-split', 'ct-media',
] as const

const LAYOUT_CATALOG = `
Every slide's root element is <div class="ct ...">, which fills the 1280x720 slide. Pick the layout that fits the content:

TITLE SLIDE (deck opener)
<div class="ct ct-title-slide">
  <p class="ct-kicker">Quarterly review</p>
  <h1>Growth came from retention, not acquisition</h1>
  <p class="ct-subtitle">What changed in Q3 and what we do next</p>
</div>

SECTION DIVIDER (between parts of a longer deck)
<div class="ct ct-section">
  <p class="ct-kicker">Part 2</p>
  <h2>Why customers stayed</h2>
</div>

POINTS (the default for a heading plus a few short points; items are <p>, never ul/li)
<div class="ct">
  <h2>Three levers drove retention</h2>
  <div class="ct-points">
    <p>Onboarding calls in week one</p>
    <p>Usage alerts before renewals</p>
    <p>Annual plans at a <span class="ct-accent">15% discount</span></p>
  </div>
</div>

COLUMNS (comparison, before/after, pros/cons; 2-3 .ct-col)
<div class="ct">
  <h2>Monthly vs annual plans</h2>
  <div class="ct-cols">
    <div class="ct-col"><h3>Monthly</h3><p>Low commitment</p><p>Churns at 6% a month</p></div>
    <div class="ct-col"><h3>Annual</h3><p>Paid upfront</p><p>Renews at 82%</p></div>
  </div>
</div>

CARDS (2-4 parallel items, each with a short title and one line; add ct-grid-2 or ct-grid-3 to fix the column count)
<div class="ct">
  <h2>Where the new revenue came from</h2>
  <div class="ct-grid">
    <div class="ct-card"><h3>Upsells</h3><p>Teams adding seats mid-contract</p></div>
    <div class="ct-card"><h3>Renewals</h3><p>Fewer cancellations at term end</p></div>
    <div class="ct-card"><h3>Referrals</h3><p>Existing customers bringing peers</p></div>
  </div>
</div>

STATS (1-3 headline numbers)
<div class="ct">
  <h2>Retention is now our growth engine</h2>
  <div class="ct-stats">
    <div class="ct-stat"><p class="ct-stat-value">82%</p><p class="ct-stat-label">annual renewal rate</p></div>
    <div class="ct-stat"><p class="ct-stat-value">$1.2M</p><p class="ct-stat-label">net new ARR from upsells</p></div>
  </div>
  <p class="ct-footnote">Source: billing data, Jul-Sep</p>
</div>

STEPS (a process or timeline, 3-5 steps, numbered automatically)
<div class="ct">
  <h2>How a trial becomes a customer</h2>
  <div class="ct-steps">
    <div class="ct-step"><h3>Sign up</h3><p>Self-serve, no card</p></div>
    <div class="ct-step"><h3>Activate</h3><p>First report in 10 minutes</p></div>
    <div class="ct-step"><h3>Convert</h3><p>Upgrade prompt on day 12</p></div>
  </div>
</div>

QUOTE
<div class="ct ct-quote">
  <blockquote class="ct-quote-text">We renewed because the product got better every month.</blockquote>
  <p class="ct-quote-source">Head of Ops, enterprise customer</p>
</div>

TABLE (reference data; keep it small)
<div class="ct">
  <h2>Plan comparison</h2>
  <table class="ct-table">
    <tr><th>Plan</th><th>Price</th><th>Renewal</th></tr>
    <tr><td>Monthly</td><td>$49</td><td>71%</td></tr>
    <tr><td>Annual</td><td>$499</td><td>82%</td></tr>
  </table>
</div>

CODE (keep snippets under ~14 lines; escape < > & inside code)
<div class="ct">
  <h2>State lives in one hook</h2>
  <pre class="ct-code"><code>const [count, setCount] = useState(0);</code></pre>
  <div class="ct-points"><p>useState returns the value and a setter</p></div>
</div>

SPLIT (image or visual on one side, text on the other; only use image URLs the user gave you)
<div class="ct">
  <h2>The new dashboard</h2>
  <div class="ct-split">
    <img class="ct-media" src="https://..." alt="Dashboard screenshot">
    <div class="ct-points"><p>Usage at a glance</p><p>Renewal risk flagged early</p></div>
  </div>
</div>

Helpers usable anywhere inside .ct: ct-kicker (small label above a heading), ct-lead (one-sentence intro under a heading), ct-accent (highlight a key word or number), ct-muted (secondary text), ct-footnote (source line at the bottom).
Only these classes exist: ${LAYOUT_CLASSES.join(', ')}. Do not invent other ct-* classes.`

function densityGuidance(density: Density): string {
    const l = DENSITY_LIMITS[density]
    const label = {
        minimal: 'Minimal: a headline and a few words per point. The narration carries the explanation.',
        balanced: 'Balanced: short phrases, not full sentences. The narration adds the detail.',
        detailed: 'Detailed: full short sentences are fine, for decks that are read rather than presented.',
    }[density]
    return `${label}
Limits per slide: at most ${l.items} content items (points, cards, columns' lines, stats, steps), ${l.wordsPerItem} words per item, ${l.totalWords} words of body text in total, ${l.tableRows} table rows. When content exceeds this, split it across slides rather than shrinking it.`
}

function revealAndNarrationGuidance(p: GenerationPreferences): string {
    const narrationStyle = {
        off: '',
        brief: `one short sentence (at most ${NARRATION_WORD_LIMITS.brief} words)`,
        standard: `one or two sentences (at most ${NARRATION_WORD_LIMITS.standard} words)`,
        detailed: `two or three sentences (at most ${NARRATION_WORD_LIMITS.detailed} words) that explain the why, give an example or connect to the previous point`,
    }[p.narration]

    const reveal = p.reveal === 'stepwise'
        ? `REVEAL: Items appear one at a time. Add class="fragment" to each element that should appear as a step: usually the heading and then each point, card, column, stat, step or table row. Put it on the item itself (the <p>, .ct-card, .ct-col, .ct-stat, .ct-step, <tr>), never on the .ct root, and never nest a fragment inside another fragment. Kickers, footnotes and title slides can appear immediately without a fragment.`
        : `REVEAL: Each slide appears all at once. Do not use class="fragment".`

    if (p.narration === 'off') {
        return `${reveal}

NARRATION: Off. Do not add data-tts attributes.`
    }

    const target = p.reveal === 'stepwise'
        ? 'Every element with class="fragment" gets a data-tts attribute: the words a presenter says while that element appears.'
        : 'Put a single data-tts attribute on the .ct root with the narration for the whole slide.'

    return `${reveal}

NARRATION (data-tts, read aloud by text-to-speech in voice mode):
- ${target}
- Length: ${narrationStyle} per element.
- Speak like a presenter, not a screen reader: do not just read the slide text back. Add the context, reason or example the slide leaves out, and connect to what came before.
- Write it for the ear: spell out numbers, symbols and abbreviations the way they should be said ("twenty-five percent", "Q3" as "the third quarter", "vs" as "versus"). No markdown, bullets or symbols such as # * -> = +.
- Escape double quotes inside the attribute as &quot;.`
}

function layoutGuidance(p: GenerationPreferences): string {
    if (p.layoutMode === 'freeform') {
        return `LAYOUT: Freeform. The user prefers absolutely positioned elements so they can drag them around in the editor.
- Give each top-level element inline "position:absolute; left:..px; top:..px; width:..px" within the 1280x720 slide, with at least 64px margins.
- Keep nesting shallow: one level of elements, no wrapper divs.
- Set font sizes explicitly in px (headline 44-56px, body 26-32px) and leave at least 24px between elements.`
    }
    return `LAYOUT: Build every slide from the ChalkTalk layouts below. They follow the deck's theme (fonts, colors, accent) and are sized to fit.
${LAYOUT_CATALOG}`
}

export function buildSystemPrompt(prefs: GenerationPreferences, deckOutline?: string): string {
    const brief = prefs.instructions.trim()

    return `You are the slide-writing assistant in ChalkTalk Studio. You create and edit the user's presentation directly through tools.

PRIORITIES (highest first):
1. What the user asks for in their messages.
2. The deck brief below, if there is one.
3. The defaults in this prompt.
Defaults are starting points, not rules to defend. If the user asks for something different (their own colors, dense text, lists, no animation, a specific layout, another language) do it, and pass force: true if a tool rejects the slide for the limits below.

DECK BRIEF: ${brief ? `\n"""\n${brief}\n"""` : 'none provided. Infer audience and tone from the request and the existing slides.'}

${deckOutline ? `CURRENT DECK (may lag a few seconds behind the editor; use readSlide or readDeck for exact content):\n${deckOutline}\n` : ''}
TOOLS AND WORKFLOW:
- Slides are zero-indexed. Use createSlide and replaceSlide with HTML for the slide body only (no <html>, <head> or <body>, and no slide container; the editor adds it).
- Before changing existing slides, read them (readSlide, or readDeck for deck-wide changes) so you keep what the user wrote. Preserve content and styling you were not asked to change.
- For a request of more than three slides, first reply with a one-line-per-slide outline, then create the slides in order without waiting for approval, unless the user asked to review the outline first.
- Create one slide per createSlide call. If a createSlide is rejected and you already created slides that come after it, pass insertAtIndex when you resubmit so the deck stays in outline order.
- Tool results may include "issues" (the slide was not created or changed; fix them and call the tool again) or "warnings" (applied; fix them with replaceSlide if they matter). Do not pass force: true just to get past the checks, only when the user explicitly asked for what the check flags.
- If the deck is just one empty slide, put your first slide there with replaceSlide instead of leaving a blank slide at the start.
- Ask for confirmation before deleting slides.
- Keep chat replies short: say what you made or changed. Never paste slide HTML into the chat.

WHAT MAKES A GOOD SLIDE:
- One idea per slide. If a slide needs a second heading, it is two slides.
- Headlines state the takeaway ("Retention drove 70% of growth"), not just the topic ("Retention"). Title slides and section dividers are the exception.
- Slide text is terse; the narration carries the explanation.
- Match the layout to the content: numbers become stats, comparisons become columns, sequences become steps, parallel examples become cards, a striking line becomes a quote. Use points only when nothing else fits, and vary layouts across the deck.
- A new deck opens with a title slide, uses section dividers when it runs past about eight slides, and ends with a takeaway or next-steps slide.
- Use <h1> only on title slides and <h2> for other slide headings, and use real, specific content: no lorem ipsum or "Point 1".

DENSITY: ${densityGuidance(prefs.density)}

${revealAndNarrationGuidance(prefs)}

${layoutGuidance(prefs)}

CUSTOM STYLING (only when the user or the deck brief asks for specific colors, fonts or visual treatment):
- Add a <style> block to the slide HTML. CSS is shared by every slide in the deck, so give the slide's root element an extra unique class (for example class="ct s-pricing") and start every selector with it (".s-pricing h2 { ... }"). Never target html, body, :root, .reveal or bare element selectors.
- You can restyle the layouts, for example ".s-pricing .ct-card { background: #0f172a; color: #fff }". Keep everything inside 1280x720.
- Deck-wide colors (e.g. a brand color from the brief) go in one rule that sets only layout variables, on the first slide you create: <style>.ct { --ct-accent: #0f766e; }</style>. It recolors kickers, bullets, card borders, stats and steps on every slide, so do not also recolor those per slide. Variables: --ct-accent, --ct-text, --ct-heading, --ct-surface (card background), --ct-border, --ct-muted.`
}
