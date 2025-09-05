# TripSet → ChalkTalk: a practical migration plan (GrapesJS state → Reveal preview, with LLM + TTS)

Short version: stop treating “slides” as React context state and start treating them as a **Grapes project JSON** + assets. Let Grapes manage the editor state; you persist/load that JSON (and assets) via Convex; when you need to preview/publish, export to HTML and wrap it in a Reveal.js deck where your animation order becomes `fragment`/`fragment-index`. ElevenLabs generates audio from your per-element script tags. Below are concrete steps, schemas, and code to get you there fast.

---

## 0) What changes conceptually

* **State source of truth**
  **Before (TripSet):** `TripDetailContext` + local React state + Convex documents.
  **After (ChalkTalk):** **Grapes Studio SDK project JSON** is the single source of truth; your app just loads/saves it (plus assets) via Convex. Grapes’ autosave hooks replace most of your context logic. (Studio SDK explicitly recommends persisting the JSON project rather than parsing HTML. ([app.grapesjs.com][1]))

* **Assets**
  Configure an assets storage pipeline (cloud or self-hosted). Otherwise images get inlined as data URLs (bad for perf/exports). ([app.grapesjs.com][2])

* **Export/preview**
  Use `studio:projectFiles` to export HTML/CSS for each page, then wrap as Reveal slides. (This is the supported “files” export path.) ([app.grapesjs.com][1])

* **Animations**
  Your “animation order tags” map directly to Reveal fragments: add `class="fragment"` and `fragment-index="N"` (Reveal also recognizes `data-fragment-index` in many examples). ([reveal.js][3], [Quarto][4], [wljs.io][5])

* **Audio**
  Per-element or per-slide script → ElevenLabs TTS → attach returned audio URLs as Grapes assets and reference them on elements. (ElevenLabs REST endpoints are straightforward.) ([ElevenLabs][6])

---

## 1) Minimal file/route changes

* Keep **Clerk** and **Convex** from TripSet. Remove `TripDetailContext` entirely. Keep `UserDetailContext` (or replace with Clerk only).
* Add **/editor/\[projectId]** (Grapes editor) and **/preview/\[projectId]** (Reveal preview).
* Keep your existing `/api/aimodel` but change the output to ChalkTalk HTML blocks (see §5).

---

## 2) New Convex schema (ChalkTalk)

```ts
// convex/schema.ts
export default defineSchema({
  UserTable: defineTable({
    name: v.string(), imageUrl: v.string(), email: v.string(),
    subscription: v.optional(v.string())
  }),
  ProjectTable: defineTable({
    ownerId: v.id('UserTable'),
    title: v.string(),
    // The canonical Grapes Studio project JSON
    projectJSON: v.any(),             // { pages, styles, components, assets? }
    // fast read-only copy of last export for preview
    lastExportHTML: v.optional(v.array(v.object({
      pageName: v.string(),
      html: v.string(),
      css: v.optional(v.string()),
    }))),
    // optional structured scripts for TTS
    narration: v.optional(v.array(v.object({
      targetId: v.string(),           // grapes component id or slide id
      text: v.string(),
      voiceId: v.optional(v.string()),
      audioUrl: v.optional(v.string())
    })))
  }),
  AssetTable: defineTable({
    projectId: v.id('ProjectTable'),
    name: v.string(), src: v.string(), mimeType: v.string(), size: v.optional(v.number())
  })
});
```

---

## 3) Embed Grapes Studio SDK (editor) with self-hosted storage (Convex)

Key idea: **Grapes calls you** when it wants to save/load. You wire those to Convex mutations/queries.

```tsx
// app/editor/[projectId]/page.tsx
'use client'
import StudioEditor from '@grapesjs/studio-sdk/react'
import '@grapesjs/studio-sdk/style'
import { useParams } from 'next/navigation'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'

export default function EditorPage() {
  const { projectId } = useParams() as { projectId: string }
  const saveProject = useMutation(api.project.saveProject)
  const loadProject = useQuery(api.project.loadProject, { projectId }) // returns { projectJSON }

  if (!loadProject) return <div>Loading…</div>

  return (
    <div className="h-screen">
      <StudioEditor
        options={{
          // optional: supply a license key if you publish publicly
          // licenseKey: process.env.NEXT_PUBLIC_GJS_LICENSE,
          project: { id: projectId, type: 'web' },
          storage: {
            type: 'self',
            autosaveChanges: 5,          // save every 5 changes
            project: loadProject.projectJSON, // instant load if already known
            onSave: async ({ project, editor }) => {
              await saveProject({ projectId, projectJSON: project })
              // Optionally export to HTML on each save for instant preview
              const files = await editor.runCommand('studio:projectFiles', { styles: 'inline' })
              const pages = files.filter((f:any) => f.mimeType === 'text/html')
                .map((f:any) => ({ pageName: f.filename || 'Slide', html: f.content }))
              await saveProject({ projectId, lastExportHTML: pages })
            },
            // onLoad omitted because we passed project above; see docs “Load Project From Prop”
          },
          // Assets: self storage → Convex (recommended)
          assets: {
            storageType: 'self',
            onUpload: async ({ files }) => {
              // upload to your storage (S3/Convex file storage/etc.) and return metadata
              const uploaded = await Promise.all(files.map(async f => {
                // ...upload...
                const url = URL.createObjectURL(f) // placeholder
                return { id: url, src: url, name: f.name, mimeType: f.type, size: f.size }
              }))
              return uploaded
            },
            onDelete: async ({ assets }) => {
              // delete from storage
            },
          },
        }}
      />
    </div>
  )
}
```

Why this shape? The Studio SDK self-hosted storage path and autosave pattern is exactly how they expect you to persist project JSON; they strongly warn not to use HTML as persistence. ([app.grapesjs.com][1])

---

## 4) Reveal.js preview route (uses last export)

```tsx
// app/preview/[projectId]/page.tsx
import { use } from 'react'
import { fetchQuery } from 'convex/nextjs'
import { api } from '@/convex/_generated/api'

export default function PreviewPage({ params }: { params: { projectId: string } }) {
  const data = use(fetchQuery(api.project.getLastExport, { projectId: params.projectId }))
  const html = data?.lastExportHTML?.[0]?.html ?? '<section><h2>No export yet</h2></section>'

  // Wrap exported page(s) in a Reveal deck
  return (
    <html>
      <head>
        <link rel="stylesheet" href="https://unpkg.com/reveal.js/dist/reveal.css" />
        <link rel="stylesheet" href="https://unpkg.com/reveal.js/dist/theme/black.css" id="theme" />
      </head>
      <body>
        <div className="reveal">
          <div className="slides" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
        <script src="https://unpkg.com/reveal.js/dist/reveal.js"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            const deck = new Reveal()
            deck.initialize({
              hash: true,
              fragments: true
            })
          `
        }} />
      </body>
    </html>
  )
}
```

* **How fragments work:** any element with `class="fragment"` is stepped through; order defaults to DOM order but can be forced with `fragment-index="N"` (Reveal docs; Quarto docs also reference `fragment-index` explicitly). ([reveal.js][3], [Quarto][4])
* **CDN setup** is fine for preview (see “Installation”). ([reveal.js][7])

> Exporting the pages: `editor.runCommand('studio:projectFiles')` gives you HTML “files” you can wrap inside `<div class="slides"><section>...</section></div>`. ([app.grapesjs.com][1])

---

## 5) LLM → “Grapes-friendly HTML” (and animation tags)

Have your `/api/aimodel` produce **HTML blocks constrained for Grapes** (absolute layout is okay), with attributes you’ll later use:

* `data-ct-script-id="s1"` (ties an element to its narration text)
* `class="fragment"` and `fragment-index="1"` (Reveal animation order)
* unique IDs for blocks (`id="b1"`) to resolve during import

**Prompt scaffold (system):**

> You generate minimal, valid HTML for GrapesJS Studio.
> Each slide is a top-level `<section data-ct-slide="1">`.
> Every reveal animation step adds `class="fragment"` and `fragment-index="N"`.
> Narration for any element is provided in a sibling `<script type="application/json" data-ct-script-for="ELEMENT_ID">{ "text": "...", "voiceId": "..." }</script>`
> Use inline styles or classes; no external dependencies.

Then, in the editor page, **import** this into the current project:

```ts
// after receiving modelHTML string
editor.addComponents(modelHTML)   // Studio SDK wraps Grapes core; you can inject components/HTML
```

---

## 6) Mapping “animation order tags” → Reveal fragments

* During generation OR at save time, ensure every staged element has `class="fragment"` and a **stable** `fragment-index` per slide.
* Reveal steps through `.fragment` elements per slide; identical `fragment-index` values appear together. ([reveal.js][3], [Quarto][4])

Tip: lock `fragment-index` inside **Grapes component traits** so editors can adjust it in the right-sidebar UI (Grapes traits are easy to add).

---

## 7) ElevenLabs TTS integration (per element or per slide)

* **Create audio** for each script block (server action): call the **Text-to-Speech Convert** endpoint, store the audio (S3/Convex file storage), and **register it as a Grapes asset**; set `data-ct-audio-src` on the element. ([ElevenLabs][6])

```ts
// app/api/tts/route.ts
import { NextRequest, NextResponse } from 'next/server'
export async function POST(req: NextRequest) {
  const { text, voiceId } = await req.json()
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
    method: 'POST',
    headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY!, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2' })
  })
  const audio = Buffer.from(await r.arrayBuffer())
  // ...upload audio to storage; return public URL
  return NextResponse.json({ url: 'https://storage/.../audio.mp3' })
}
```

* For **timed playback** during Reveal, listen for fragment events and play the attached audio:

```html
<script>
  const deck = new Reveal(); deck.initialize()
  deck.on('fragmentshown', ev => {
    const el = ev.fragment
    const src = el?.dataset?.ctAudioSrc
    if (src) { new Audio(src).play() }
  })
</script>
```

Reveal dispatches events on fragment show/hide—handy for syncing audio. ([emilhvitfeldt.com][8])

---

## 8) Replace TripSet contexts with a *thin* coordinator

Remove `TripDetailContext`. Keep a tiny app layer for:

* current project id
* whether you’re “editing” vs “previewing”
* “generation in progress” flag when calling LLM or TTS

Grapes handles everything else (canvas selection, undo/redo, component tree, etc.). Autosave hooks keep Convex in sync. (See Studio SDK autosave + self storage examples.) ([app.grapesjs.com][1])

---

## 9) Data model you’ll use going forward

```ts
type ChalkTalkProject = {
  title: string
  projectJSON: any            // Grapes project
  lastExportHTML?: { pageName: string; html: string; css?: string }[]
  narration?: { targetId: string; text: string; voiceId?: string; audioUrl?: string }[]
}
```

> Rule of thumb: **never derive** Grapes project state into something else during editing; only derive on **export** (to Reveal) or **render** (to video).

---

## 10) End-to-end flow (MVP)

1. **New project** → load base template in Studio (`pages:[{name:'Slide 1', component:'<section data-ct-slide="1"></section>'}]`).
2. **User enters topic** → `/api/aimodel` returns Grapes-friendly HTML with `fragment` and `fragment-index`.
3. **Insert into Grapes** (`editor.addComponents()`); autosave to Convex.
4. **Generate audio** → for each `<script data-ct-script-for="id">`, call ElevenLabs; upload; set `data-ct-audio-src` on target element; autosave. ([ElevenLabs][6])
5. **Preview** → export via `studio:projectFiles`; wrap in Reveal deck; play fragments + audio via events. ([app.grapesjs.com][1], [reveal.js][3])
6. **Publish/Download** → keep exported files; optionally render to video later via headless browser + WebAudio capture (future).

---

## 11) Practical Grapes SDK options to set up

* **Project storage**: `storage.type: 'self'`, `autosaveChanges`, `project` (SSR load) and `onSave`/`onLoad`—exactly how their docs show self-hosted. ([app.grapesjs.com][1])
* **Assets**: set `assets.storageType: 'self'`, define `onUpload`/`onDelete` (+ optional `onLoad` to fetch from your storage). ([app.grapesjs.com][2])
* **Asset providers**: plug your image search (e.g., unsplash, your own library) into Grapes’ **Asset Providers** UI to let users drag/drop images efficiently. ([app.grapesjs.com][9])

---

## 12) Slide canvas sizing & absolute mode (nice defaults)

Set your canvas to 1920×1080 (or 1600×900). Use a wrapper style on page components:

```html
<section data-ct-slide="1" style="position:relative;width:1600px;height:900px;margin:0 auto;background:#fff;">
  <!-- absolutely positioned elements inside -->
  <h1 id="t1" class="fragment" fragment-index="1" style="position:absolute;left:80px;top:120px">Title</h1>
</section>
```

This plays nicely with Grapes absolute positioning and avoids layout shifts on export.

---

## 13) What to delete/retire from TripSet

* `TripDetailContext`, `TripInfo` types, and itinerary display components.
* Chat UI stays, but the **UI control tokens** (`ui: 'groupSize' | 'budget' | ...`) are irrelevant—replace with `ui: 'insertHtml' | 'modifySelection' | null`.
* Google Places, Arcjet rate-limits, etc. → keep as needed (rate limiting still useful).

---

## 14) Quick checklist

* [ ] New Convex tables: `ProjectTable`, `AssetTable`
* [ ] `/editor/[projectId]` with Studio SDK + self storage (Convex)
* [ ] `/preview/[projectId]` wrapping last export into Reveal deck (CDN ok) ([reveal.js][7])
* [ ] LLM prompt updates to output Grapes-ready HTML with `fragment`/`fragment-index`
* [ ] TTS route using ElevenLabs `convert` and saving audio URLs ([ElevenLabs][6])
* [ ] Grapes traits for `fragment-index`, `data-ct-audio-src`, `data-ct-script-id`
* [ ] Asset pipeline wired (self storage) ([app.grapesjs.com][2])
* [ ] Remove Trip contexts; keep Clerk + light “app mode” state

---

## Gotchas

* **Do not** try to reload the editor from exported HTML. Persist the **project JSON**; export only for preview/publish. (SDK warns that parsing code loses metadata.) ([app.grapesjs.com][1])
* If you don’t configure **assets storage**, Grapes will inline data URLs → huge exports. Configure cloud/self storage. ([app.grapesjs.com][2])
* Reveal uses `fragment` + order. Some examples/doc pages show `data-fragment-index` vs `fragment-index`; **`fragment-index`** is documented and works broadly (Quarto docs). Keep consistent. ([Quarto][4])

---

If you want, I can turn this into a starter PR on your TripSet repo that:

1. adds `/editor` + `/preview`,
2. adds Convex mutations/queries for project JSON,
3. swaps the provider hierarchy to remove Trip context,
4. ships a tiny LLM prompt + import action + TTS route.

[1]: https://app.grapesjs.com/docs-sdk/configuration/projects "GrapesJS Studio SDK"
[2]: https://app.grapesjs.com/docs-sdk/configuration/assets/overview "GrapesJS Studio SDK"
[3]: https://revealjs.com/fragments/?utm_source=chatgpt.com "Fragments"
[4]: https://quarto.org/docs/presentations/revealjs/advanced.html?utm_source=chatgpt.com "Advanced Reveal"
[5]: https://wljs.io/frontend/Advanced/Slides/Fragments/?utm_source=chatgpt.com "Fragments - WLJS Notebook"
[6]: https://elevenlabs.io/docs/api-reference/text-to-speech/convert?utm_source=chatgpt.com "Create speech | ElevenLabs Documentation"
[7]: https://revealjs.com/installation/?utm_source=chatgpt.com "Installation"
[8]: https://emilhvitfeldt.com/post/slidecraft-fragment-js/?utm_source=chatgpt.com "Slidecraft 101: Fragments - JS"
[9]: https://app.grapesjs.com/docs-sdk/configuration/assets/asset-providers "GrapesJS Studio SDK"
