'use client'

import StudioEditor from '@grapesjs/studio-sdk/react'
import '@grapesjs/studio-sdk/style'
import { canvasAbsoluteMode, canvasFullSize, rteProseMirror, iconifyComponent } from '@grapesjs/studio-sdk-plugins'
import grapesRevealTraits from '@/lib/grapes-reveal-traits'
import marqueeSelect from '@/lib/marquee-select'
import { useMemo, use, useRef, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useUserDetail } from '@/app/provider'
import { getSlideContainer, DEFAULT_SLIDE_FORMAT } from '@/lib/slide-formats'
import { TEMPLATES } from '@/lib/slide-templates';
import EditorHeader from '@/app/_components/EditorHeader'

type PageProps = { params: Promise<{ projectId: string }> }

// Global type declaration for AI tools
declare global {
    interface Window {
        grapesjsAITools?: {
            addSlide: (name: string, content: string, insertAtIndex?: number) => boolean
            editSlide: (slideIndex: number, newContent: string, newName?: string) => boolean
            replaceSlide: (slideIndex: number, newContent: string, newName?: string) => boolean
            getEditor: () => any
        }
    }
}

export default function EditorPage({ params }: PageProps) {
    const { projectId } = use(params)
    const { user } = useUser()
    const identityId = useMemo(() => user?.id || 'anonymous', [user?.id])
    const licenseKey = process.env.NEXT_PUBLIC_GRAPES_SDK_LICENSE_KEY || ''

    const saveDeck = useMutation(api.slideDeck.SaveDeck)
    const { userDetail } = useUserDetail()
    const deck = useQuery(
        api.slideDeck.GetDeck,
        userDetail ? { projectId, uid: userDetail._id } : 'skip'
    )

    const editorRef = useRef<any>(null)
    // Controls when we apply template-mapped styles on page add
    const shouldApplyTemplateStylesRef = useRef<boolean>(true)

    // Cache for editor theme CSS texts
    const themeCssCache = useRef<Record<string, string>>({})
    const contentCssCache = useRef<string | null>(null)

    const getSelectedThemeId = () => {
        try {
            return localStorage.getItem(`selectedThemeId:${projectId}`) || localStorage.getItem('selectedThemeId') || 'white'
        } catch { return 'white' }
    }

    const fetchCssText = async (url: string) => {
        const res = await fetch(url)
        if (!res.ok) throw new Error(`Failed to load CSS: ${url}`)
        return await res.text()
    }

    const ensurePageThemeStyles = async (editor: any, page: any, themeId: string) => {
        // Load content CSS once
        if (!contentCssCache.current) {
            try {
                contentCssCache.current = await fetchCssText('/themes/editor/content.css')
            } catch (e) { console.error(e) }
        }
        // Load theme vars CSS per theme
        if (!themeCssCache.current[themeId]) {
            try {
                themeCssCache.current[themeId] = await fetchCssText(`/themes/editor/${themeId}.vars.css`)
            } catch (e) { console.error(e) }
        }
        const varsCss = themeCssCache.current[themeId] || ''
        const contentCss = contentCssCache.current || ''

        try {
            const cmp = page.getMainComponent?.() || editor.DomComponents.getWrapper()
            if (!cmp) return
            // Build var map and resolve content CSS
            const varMap: Record<string, string> = {}
            varsCss.replace(/--([a-zA-Z0-9\-]+)\s*:\s*([^;]+);/g, (_m: string, k: string, v: string) => {
                varMap[`--${k.trim()}`] = v.trim()
                return ''
            })
            const resolvedCss = contentCss.replace(/var\((--[a-zA-Z0-9\-]+)\)/g, (_m: string, key: string) => varMap[key] ?? _m)

            // Remove prior theme tags
            const prior = cmp.find?.('style[data-ct-page-theme]') || []
            prior.forEach((st: any) => st.remove?.())
            // Append resolved content CSS (single block)
            cmp.append(`<style data-ct-page-theme="content" data-theme="${themeId}">${resolvedCss}</style>`)
        } catch (e) {
            console.error('Failed to ensure page theme styles:', e)
        }
    }

    const applyThemeToAllPages = async (editor: any, themeId: string) => {
        const pages = editor.Pages.getAll?.() || []
        for (const p of pages) {
            await ensurePageThemeStyles(editor, p, themeId)
        }
    }

    // Parse inline style string into an object (camelCase keys)
    const parseStyleAttr = (styleAttr?: string): Record<string, string> => {
        if (!styleAttr) return {}
        return styleAttr
            .split(';')
            .map((s) => s.trim())
            .filter(Boolean)
            .reduce((acc: Record<string, string>, decl) => {
                const idx = decl.indexOf(':')
                if (idx === -1) return acc
                const key = decl.slice(0, idx).trim()
                const val = decl.slice(idx + 1).trim()
                if (key) acc[key.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = val
                return acc
            }, {})
    }

    // Extract container styles from a template's first page component
    const getContainerStylesForTemplate = (templateId: string): Record<string, string> => {
        const tpl = TEMPLATES.find(t => t.id === templateId)
        if (!tpl) return {}
        const page = tpl.data?.pages?.[0]
        const comp = page?.component as string | undefined
        if (!comp) return {}
        // Find the first data-slide-container style attribute
        const match = comp.match(/data-slide-container[^>]*style="([^"]+)"/)
        if (!match) return {}
        return parseStyleAttr(match[1])
    }

    // Helper function to detect if content is a complete slide container
    const isCompleteSlideContainer = (content: string): boolean => {
        return content.includes('slide-container') || content.includes('<style>');
    }

    // Create global functions for AI tools to interact with the editor
    useEffect(() => {
        if (typeof window !== 'undefined') {
            // @ts-ignore - Adding to window for AI tools access
            window.grapesjsAITools = {
                addSlide: (name: string, content: string, insertAtIndex?: number) => {
                    if (!editorRef.current) return false
                    const editor = editorRef.current

                    // Check if AI provided a complete slide container
                    let finalContent: string;
                    if (isCompleteSlideContainer(content)) {
                        // Use AI content directly
                        finalContent = content;
                    } else {
                        // Wrap simple content in our container
                        finalContent = getSlideContainer(content);
                    }

                    const page = editor.Pages.add({
                        name,
                        component: finalContent
                    }, {
                        select: true,
                        at: insertAtIndex
                    })
                    // Ensure inline theme styles on the new page
                    const themeId = getSelectedThemeId()
                    // Fire and forget
                    ensurePageThemeStyles(editor, page, themeId)
                    return !!page
                },
                editSlide: (slideIndex: number, newContent: string, newName?: string) => {
                    if (!editorRef.current) return false
                    const editor = editorRef.current
                    const pages = editor.Pages.getAll()
                    const page = pages[slideIndex]
                    if (!page) return false

                    // Update page name if provided
                    if (newName) {
                        page.set('name', newName)
                    }

                    // Check if AI provided a complete slide container
                    let finalContent: string;
                    if (isCompleteSlideContainer(newContent)) {
                        // Use AI content directly
                        finalContent = newContent;
                    } else {
                        // Wrap simple content in our container
                        finalContent = getSlideContainer(newContent);
                    }

                    editor.Pages.select(page);
                    editor.setComponents(finalContent);
                    // Re-inject theme styles since the page content was replaced
                    const themeId = getSelectedThemeId()
                    ensurePageThemeStyles(editor, page, themeId)
                    return true
                },
                replaceSlide: (slideIndex: number, newContent: string, newName?: string) => {
                    if (!editorRef.current) return false
                    const editor = editorRef.current
                    const pages = editor.Pages.getAll()
                    const page = pages[slideIndex]
                    if (!page) return false

                    // Update page name if provided
                    if (newName) {
                        page.set('name', newName)
                    }

                    // Check if AI provided a complete slide container
                    let finalContent: string;
                    if (isCompleteSlideContainer(newContent)) {
                        // Use AI content directly
                        finalContent = newContent;
                    } else {
                        // Wrap simple content in our container
                        finalContent = getSlideContainer(newContent);
                    }

                    editor.Pages.select(page);
                    editor.setComponents(finalContent);
                    // Re-inject theme styles since the page content was replaced
                    const themeId = getSelectedThemeId()
                    ensurePageThemeStyles(editor, page, themeId)
                    return true
                },
                getEditor: () => editorRef.current
            }
        }

        return () => {
            if (typeof window !== 'undefined') {
                // @ts-ignore
                delete window.grapesjsAITools
            }
        }
    }, [])

    if (!userDetail) return <div>Loading user...</div>
    if (deck === undefined) return <div>Loading deck...</div>

    console.log('Deck loaded:', {
        projectId,
        deckExists: !!deck,
        projectType: typeof deck?.project,
        hasPages: !!(deck?.project?.pages || (typeof deck?.project === 'string' && deck.project.includes('pages')))
    })

    // Handle case where project might still be a string
    let initialProject = deck?.project || {
        pages: [
            {
                name: 'Presentation',
                component: getSlideContainer(``)
            },
        ],
    }

    // If project is still a string, parse it
    if (typeof initialProject === 'string') {
        console.log('Project is string, parsing...')
        try {
            initialProject = JSON.parse(initialProject)
            console.log('Parsed project successfully, pages:', initialProject.pages?.length)
        } catch (error) {
            console.error('Failed to parse project in editor:', error)
            return <div>Error: Invalid project format</div>
        }
    }


    return (
        <div className="h-full w-full flex flex-col min-h-0">
            <EditorHeader
                projectId={projectId}
                deckId={deck?._id}
                initialTitle={deck?.title}
                userDetailId={userDetail._id}
            />
            <div className="flex-1 min-h-0">
                <StudioEditor
                    onReady={(editor) => {
                        editorRef.current = editor

                        // This is the fix for your point about "opening a new page in an existing presentation"
                        // When a new page is added via the UI, we ensure it gets our slide container.
                        editor.on('page:add', async (page) => {
                            // Avoid applying stale template styles before user selects a template in a new project
                            if (!shouldApplyTemplateStylesRef.current) return;
                            // Select the page first to access its components
                            editor.Pages.select(page);
                            const wrapper = editor.DomComponents.getWrapper();

                            // Check if it already has a container (e.g., from AI tools)
                            if (wrapper && !wrapper.find('[data-slide-container]').length) {
                                // Get the inner HTML, wrap it, and set it back.
                                const currentContent = wrapper.getInnerHTML();
                                // Pull container styles from selected template (single source of truth)
                                let custom: Record<string, string> = {}
                                try {
                                    const key = `selectedTemplateId:${projectId}`
                                    const tid = localStorage.getItem(key) || localStorage.getItem('selectedTemplateId') || ''
                                    custom = getContainerStylesForTemplate(tid)
                                } catch {}
                                wrapper.components(
                                    getSlideContainer(
                                        currentContent,
                                        DEFAULT_SLIDE_FORMAT,
                                        custom,
                                    )
                                );
                                // Ensure this page gets current theme styles inline
                                await ensurePageThemeStyles(editor, page, getSelectedThemeId())
                            }
                        });

                        // If this is a new project (deck is null), open the template browser.
                        if (!deck) {
                            // New project: clear any previous template id and hold off applying styles
                            try {
                                localStorage.removeItem('selectedTemplateId')
                                localStorage.removeItem(`selectedTemplateId:${projectId}`)
                                localStorage.removeItem('selectedThemeId')
                                localStorage.removeItem(`selectedThemeId:${projectId}`)
                            } catch {}
                            shouldApplyTemplateStylesRef.current = false
                            editor.runCommand('studio:layoutToggle', {
                                id: 'template-browser',
                                header: false,
                                placer: { type: 'dialog', title: 'Choose a template for your project', size: 'l' },
                                layout: {
                                    type: 'panelTemplates',
                                    content: { itemsPerRow: 4 },
                                    onSelect: async ({ loadTemplate, template }: any) => {
                                        // Store selected template id BEFORE loading, so any page:add from the loader sees the correct id
                                        try {
                                            const tid = template?.id || ''
                                            localStorage.setItem('selectedTemplateId', tid)
                                            localStorage.setItem(`selectedTemplateId:${projectId}`, tid)
                                            const themeId = template?.revealTheme || 'white'
                                            localStorage.setItem('selectedThemeId', themeId)
                                            localStorage.setItem(`selectedThemeId:${projectId}`, themeId)
                                        } catch {}
                                        shouldApplyTemplateStylesRef.current = true
                                        // Load the selected template to the current project
                                        loadTemplate(template);
                                        // Close the dialog layout
                                        editor.runCommand('studio:layoutRemove', { id: 'template-browser' })
                                        // Ensure first template page is selected
                                        const pages = editor.Pages.getAll()
                                        if (pages && pages[0]) editor.Pages.select(pages[0])
                                        // Apply theme to all pages
                                        await applyThemeToAllPages(editor, getSelectedThemeId())
                                    }
                                }
                            });
                        }

                        // Add scroll wheel zoom functionality
                        const canvas = editor.Canvas.getElement()
                        if (canvas) {
                            const handleWheelZoom = (event: WheelEvent) => {
                                // Only zoom if Ctrl/Cmd key is pressed
                                if (event.ctrlKey || event.metaKey) {
                                    event.preventDefault() // Prevent default scroll behavior

                                    // Determine scroll direction
                                    const delta = event.deltaY

                                    // Get current zoom level
                                    let zoom = editor.Canvas.getZoom()

                                    // Adjust zoom level
                                    if (delta < 0) {
                                        // Scroll up, zoom in
                                        zoom += 5
                                    } else {
                                        // Scroll down, zoom out
                                        zoom -= 5
                                    }

                                    // Set new zoom level with reasonable limits
                                    zoom = Math.max(10, Math.min(zoom, 300)) // Limit zoom between 10% and 300%
                                    editor.Canvas.setZoom(zoom)
                                }
                            }

                            canvas.addEventListener('wheel', handleWheelZoom, { passive: false })

                            // Store cleanup function for potential future use
                            const cleanup = () => canvas.removeEventListener('wheel', handleWheelZoom)
                            // Note: In a real-world app, you might want to store this cleanup function
                            // and call it when the component unmounts
                        }

                        // Command: Set fragments and TTS from text content
                        editor.Commands.add('tts:set-fragments-from-text', {
                            run: async (ed: any, opts: any = {}) => {
                                const scope = opts.scope === 'deck' ? 'deck' : 'slide'
                                let total = 0

                                const applyOnCurrentPage = async () => {
                                    // allow DOM to settle after page switch
                                    await new Promise(r => setTimeout(r, 30))
                                    const wrapper = ed.DomComponents.getWrapper()
                                    if (!wrapper) return
                                    let order = 0
                                    const targets = wrapper.find('p, h1, h2, h3, h4, h5, h6, li, button, a, span')
                                    targets.forEach((cmp: any) => {
                                        const el = cmp.getEl?.()
                                        const text = (el?.textContent || '').replace(/\s+/g, ' ').trim()
                                        if (!text) return
                                        // Set TTS text from visible text
                                        cmp.addAttributes({ 'data-tts': text, 'data-fragment-index': String(order) })
                                        // Set fragment effect and class
                                        const cur = (cmp.getClasses?.() || cmp.getClass?.() || []) as string[]
                                        const classes = new Set(cur)
                                        classes.add('fragment')
                                        cmp.setClass?.(Array.from(classes))
                                        cmp.addAttributes({ 'data-fragment': 'appear' })
                                        order += 1
                                        total += 1
                                    })
                                }

                                if (scope === 'slide') {
                                    await applyOnCurrentPage()
                                } else {
                                    const selected = ed.Pages.getSelected?.()
                                    const pages = ed.Pages.getAll?.() || []
                                    for (const pg of pages) {
                                        ed.Pages.select(pg)
                                        await applyOnCurrentPage()
                                    }
                                    if (selected) ed.Pages.select(selected)
                                }

                                try { window.alert?.(`Set TTS + fragments on ${total} elements (${scope}).`) } catch {}
                            }
                        })

                        // Ensure all new components dropped at root are moved inside the slide container
                        editor.on('component:add', (cmp: any) => {
                            try {
                                const wrapper = editor.DomComponents.getWrapper()
                                if (!wrapper) return
                                // Skip if we're adding the container itself or editor theme <style> blocks
                                const attrs = cmp.getAttributes?.() || {}
                                if (attrs['data-slide-container']) return
                                const tag = (cmp.get?.('tagName') || cmp.getTagName?.() || '').toString().toLowerCase()
                                if (tag === 'style') return
                                const parent = cmp.parent?.()
                                if (parent && parent === wrapper) {
                                    const container = wrapper.find?.('[data-slide-container]')?.[0]
                                    if (container) {
                                        try {
                                            container.append(cmp)
                                        } catch {
                                            // Fallback: re-create via HTML if needed
                                            const html = cmp.toHTML?.() || ''
                                            try { cmp.remove?.() } catch {}
                                            if (html) container.append(html)
                                        }
                                    }
                                }
                            } catch { }
                        })

                        // On initial ready (existing deck), ensure all pages carry inline theme
                        try {
                            applyThemeToAllPages(editor, getSelectedThemeId()).catch(() => {})
                        } catch {}

                        // Migration: ensure all slide containers have class="reveal" for variable scoping
                        try {
                            const pages = editor.Pages.getAll?.() || []
                            pages.forEach((p: any) => {
                                const cmp = p.getMainComponent?.() || editor.DomComponents.getWrapper()
                                const containers = cmp?.find?.('[data-slide-container]') || []
                                const c = containers[0]
                                if (c) {
                                    const cls = (c.getClasses?.() || c.getClass?.() || []) as string[]
                                    if (!cls.includes('reveal')) {
                                        const set = new Set(cls)
                                        set.add('reveal')
                                        c.setClass?.(Array.from(set))
                                    }
                                }
                            })
                        } catch {}
                    }}
                    options={{
                        licenseKey,
                        theme: 'light',
                        plugins: [
                            canvasFullSize.init({
                                deviceMaxWidth: DEFAULT_SLIDE_FORMAT.width,
                                canvasOffsetX: 50,
                                canvasOffsetY: 50,
                            }),
                            canvasAbsoluteMode,
                            marqueeSelect,
                            grapesRevealTraits,
                            iconifyComponent.init({
                                block: {
                                    category: 'Media',
                                    label: 'Icon'
                                },
                                collections: [
                                    'mdi',        // Material Design Icons
                                    'fa-solid',   // Font Awesome Solid
                                    'heroicons',  // Heroicons
                                    'lucide',     // Lucide Icons
                                    'tabler'      // Tabler Icons
                                ],
                                extendIconComponent: true
                            }),
                            rteProseMirror
                        ],
                        templates: {
                            onLoad: async () => TEMPLATES,
                        },
                        project: {
                            type: 'web',
                            id: projectId
                        },
                        identity: {
                            id: identityId,
                        },
                        assets: {
                            storageType: 'cloud'
                        },
                        storage: {
                            type: 'self',
                            onSave: async ({ project }) => {
                                try {
                                    await saveDeck({
                                        projectId,
                                        uid: userDetail._id,
                                        project: JSON.stringify(project),
                                    })
                                } catch (error) {
                                    console.error('Failed to save project:', error)
                                    throw error
                                }
                            },
                            onLoad: async () => {
                                return { project: initialProject };
                            },
                            autosaveChanges: 100,
                            autosaveIntervalMs: 10000
                        }
                    }}
                />
            </div>
        </div>
    )
}
