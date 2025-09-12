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
                        editor.on('page:add', (page) => {
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
                            }
                        });

                        // If this is a new project (deck is null), open the template browser.
                        if (!deck) {
                            // New project: clear any previous template id and hold off applying styles
                            try {
                                localStorage.removeItem('selectedTemplateId')
                                localStorage.removeItem(`selectedTemplateId:${projectId}`)
                            } catch {}
                            shouldApplyTemplateStylesRef.current = false
                            editor.runCommand('studio:layoutToggle', {
                                id: 'template-browser',
                                header: false,
                                placer: { type: 'dialog', title: 'Choose a template for your project', size: 'l' },
                                layout: {
                                    type: 'panelTemplates',
                                    content: { itemsPerRow: 4 },
                                    onSelect: ({ loadTemplate, template }: any) => {
                                        // Store selected template id BEFORE loading, so any page:add from the loader sees the correct id
                                        try {
                                            const tid = template?.id || ''
                                            localStorage.setItem('selectedTemplateId', tid)
                                            localStorage.setItem(`selectedTemplateId:${projectId}`, tid)
                                        } catch {}
                                        shouldApplyTemplateStylesRef.current = true
                                        // Load the selected template to the current project
                                        loadTemplate(template);
                                        // Close the dialog layout
                                        editor.runCommand('studio:layoutRemove', { id: 'template-browser' })
                                        // Ensure first template page is selected
                                        const pages = editor.Pages.getAll()
                                        if (pages && pages[0]) editor.Pages.select(pages[0])
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
