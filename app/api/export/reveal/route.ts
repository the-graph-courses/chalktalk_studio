import { NextRequest } from 'next/server'
import { fetchQuery } from 'convex/nextjs'
import { api } from '@/convex/_generated/api'
import { extractRevealSlides } from '@/lib/reveal-export'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const projectId = searchParams.get('projectId')
        const useCdn = true // Always use CDN for now
        const themeId = searchParams.get('theme') || 'white'

        if (!projectId) {
            return new Response('Missing projectId', { status: 400 })
        }

        // Fetch project data
        const deck = await fetchQuery(api.slideDeck.GetProject, { projectId })
        if (!deck?.project) {
            return new Response('Project not found', { status: 404 })
        }

        // Extract slides
        const slides = extractRevealSlides(deck.project as any)
        const deckTitle = deck.title || 'Presentation'

        // Read theme CSS
        let themeCss = ''
        try {
            const themePath = join(process.cwd(), 'public', 'themes', `${themeId}.css`)
            themeCss = await readFile(themePath, 'utf-8')
        } catch {
            // Fallback to white theme
            try {
                const fallbackPath = join(process.cwd(), 'public', 'themes', 'white.css')
                themeCss = await readFile(fallbackPath, 'utf-8')
            } catch {
                themeCss = ':root { --r-background-color: #fff; --r-main-color: #000; }'
            }
        }

        // Generate reveal.js HTML
        const revealHtml = generateRevealHtml({
            title: deckTitle,
            slides,
            themeCss,
            useCdn,
            projectId
        })

        return new Response(revealHtml, {
            headers: {
                'Content-Type': 'text/html',
                'Content-Disposition': `attachment; filename="${deckTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_presentation.html"`
            }
        })
    } catch (error) {
        console.error('Export error:', error)
        return new Response('Export failed', { status: 500 })
    }
}

interface GenerateRevealHtmlOptions {
    title: string
    slides: Array<{ name?: string; html: string; css: string[]; containerStyle?: string }>
    themeCss: string
    useCdn: boolean
    projectId: string
}

function generateRevealHtml({ title, slides, themeCss, useCdn, projectId }: GenerateRevealHtmlOptions): string {
    // Basic CSS scoping function (simplified version from present page)
    const scopeCss = (cssText: string, scopeSelector: string): string => {
        try {
            return cssText
                .split('}')
                .map((chunk: string) => chunk.trim())
                .filter(Boolean)
                .map((rule: string) => {
                    const parts: string[] = rule.split('{')
                    if (parts.length < 2) return rule + '}'
                    const sel: string = parts[0].trim()
                    const body: string = parts.slice(1).join('{')

                    if (/^@/i.test(sel)) return `${sel}{${body}}`

                    const scopedSel: string = sel
                        .split(',')
                        .map((s: string) => s.trim())
                        .filter(Boolean)
                        .map((s: string) => {
                            if (/^html\b/i.test(s) || /^body\b/i.test(s)) {
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

    // Generate slide sections
    const slideSections = slides.map((slide, i) => {
        const containerStyles = slide.containerStyle
            ? Object.fromEntries(
                slide.containerStyle.split(';')
                    .filter(Boolean)
                    .map(p => p.split(':'))
                    .map(([k, v]) => [k.trim(), (v || '').trim()])
            )
            : {}

        const inlineStyles = Object.entries(containerStyles)
            .map(([k, v]) => `${k}:${v}`)
            .join(';')

        const scopedCss = slide.css?.length
            ? scopeCss(slide.css.join('\n'), `[data-slide-scope="s${i}"] .ct-slide`)
            : ''

        return `
    <section data-slide-scope="s${i}">
      <div class="ct-slide" ${inlineStyles ? `style="${inlineStyles}"` : ''}>
        ${slide.html}
      </div>
      ${scopedCss ? `<style>${scopedCss}</style>` : ''}
    </section>`
    }).join('\n')

    // Use CDN for reveal.js
    const revealCss = '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.2.1/dist/reveal.css">'
    const revealJs = '<script src="https://cdn.jsdelivr.net/npm/reveal.js@5.2.1/dist/reveal.js"></script>'

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    
    ${revealCss}
    
    <style>
    /* Theme CSS */
    ${themeCss}
    
    /* Custom presentation styles */
    .reveal .slides {
        text-align: left;
    }
    
    .ct-slide {
        width: 100%;
        height: 100%;
        position: relative;
    }
    
    /* Print styles */
    @media print {
        body { print-color-adjust: exact; }
        .reveal .slides section { page-break-after: always; }
    }
    </style>
</head>
<body>
    <div class="reveal">
        <div class="slides">
            ${slideSections}
        </div>
    </div>

    ${revealJs}
    
    <script>
        // Initialize Reveal.js
        Reveal.initialize({
            hash: true,
            width: 1280,
            height: 720,
            margin: 0,
            controls: true,
            progress: true,
            center: true,
            slideNumber: true,
            transition: 'none',
            // Enable keyboard navigation
            keyboard: true,
            // Enable touch navigation on mobile
            touch: true
        });
        
        // Add export info to console
        console.log('Presentation exported from ChalkTalk Studio');
        console.log('Project ID: ${projectId}');
        console.log('Export time:', new Date().toISOString());
    </script>
</body>
</html>`
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}
