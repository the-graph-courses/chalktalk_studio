'use client'

import StudioEditor from '@grapesjs/studio-sdk/react'
import '@grapesjs/studio-sdk/style'
import { canvasAbsoluteMode, rteProseMirror, iconifyComponent } from '@grapesjs/studio-sdk-plugins'
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

    // Create global functions for AI tools to interact with the editor
    useEffect(() => {
        if (typeof window !== 'undefined') {
            // @ts-ignore - Adding to window for AI tools access
            window.grapesjsAITools = {
                addSlide: (name: string, content: string, insertAtIndex?: number) => {
                    if (!editorRef.current) return false
                    const editor = editorRef.current
                    const page = editor.Pages.add({
                        name,
                        component: getSlideContainer(content)
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

                    // Always use container wrapper for consistency
                    editor.Pages.select(page);
                    editor.setComponents(getSlideContainer(newContent));
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

                    // Always use container wrapper for consistency
                    editor.Pages.select(page);
                    editor.setComponents(getSlideContainer(newContent));
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
        <div className="h-full flex flex-col">
            <EditorHeader
                projectId={projectId}
                deckId={deck?._id}
                initialTitle={deck?.title}
                userDetailId={userDetail._id}
            />
            <div className="flex-1">
                <StudioEditor
                    onReady={(editor) => {
                        editorRef.current = editor

                        // This is the fix for your point about "opening a new page in an existing presentation"
                        // When a new page is added via the UI, we ensure it gets our slide container.
                        editor.on('page:add', (page) => {
                            // Select the page first to access its components
                            editor.Pages.select(page);
                            const wrapper = editor.DomComponents.getWrapper();

                            // Check if it already has a container (e.g., from AI tools)
                            if (wrapper && !wrapper.find('[data-slide-container]').length) {
                                // Get the inner HTML, wrap it, and set it back.
                                const currentContent = wrapper.getInnerHTML();
                                wrapper.components(getSlideContainer(currentContent));
                            }
                        });

                        // If this is a new project (deck is null), open the template browser.
                        if (!deck) {
                            editor.runCommand('studio:layoutToggle', {
                                id: 'template-browser',
                                header: false,
                                placer: { type: 'dialog', title: 'Choose a template for your project', size: 'l' },
                                layout: {
                                    type: 'panelTemplates',
                                    content: { itemsPerRow: 4 },
                                    onSelect: ({ loadTemplate, template }: any) => {
                                        // Load the selected template to the current project
                                        loadTemplate(template);
                                        // Close the dialog layout
                                        editor.runCommand('studio:layoutRemove', { id: 'template-browser' })
                                    }
                                }
                            });
                        }

                        // Add basic canvas styles
                        const cssComposer = editor.CssComposer;
                        cssComposer.addRules(`
                      body {
                        background-color: #f0f2f5;
                        margin: 0;
                        height: 100%;
                        width: 100%;
                      }
                    `);

                        // Set default zoom to fit slide with 15% padding on each side
                        setTimeout(() => {
                            const canvasEl = editor.Canvas.getFrameEl();
                            if (canvasEl) {
                                // Get the slide dimensions from the default format
                                const slideWidth = DEFAULT_SLIDE_FORMAT.width;
                                const slideHeight = DEFAULT_SLIDE_FORMAT.height;

                                // Get the canvas viewport dimensions
                                const canvasRect = canvasEl.getBoundingClientRect();

                                // Calculate available space with 15% padding on each side
                                // This means 70% of the width should be used for the slide (100% - 15% - 15%)
                                const availableWidth = canvasRect.width * 0.7; // 70% of viewport width
                                const availableHeight = canvasRect.height * 0.7; // 70% of viewport height

                                // Calculate zoom to fit the slide with padding
                                const zoomX = (availableWidth / slideWidth) * 100;
                                const zoomY = (availableHeight / slideHeight) * 100;
                                const optimalZoom = Math.min(zoomX, zoomY); // Take the smaller zoom to ensure both dimensions fit

                                // Set the zoom level with reasonable bounds
                                editor.Canvas.setZoom(Math.max(Math.min(optimalZoom, 100), 10)); // Between 10% and 100%
                            }
                        }, 300); // Wait for canvas to initialize

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
                            canvasAbsoluteMode, 
                            marqueeSelect,
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
                            rteProseMirror?.init({
                                // Enable RTE on single click instead of double-click for better UX
                                enableOnClick: true,
                                // Don't disable RTE on Escape key to prevent accidental exits
                                disableOnEsc: false,
                                // Customize toolbar with additional formatting options
                                toolbar({ items, layouts, proseMirror, commands }) {
                                    const { view } = proseMirror;
                                    return [
                                        // Default toolbar items (bold, italic, etc.)
                                        ...items,
                                        // Add separator
                                        layouts.separator,
                                        // Custom button for slide-specific functionality
                                        {
                                            id: 'slideFormatting',
                                            type: 'button',
                                            icon: 'palette',
                                            tooltip: 'Apply slide formatting',
                                            onClick: () => {
                                                // Get current selected text
                                                const selectedText = commands.text.selected();
                                                if (selectedText) {
                                                    // Apply slide-specific formatting
                                                    const { state, dispatch } = view;
                                                    const formattedText = `✨ ${selectedText} ✨`;
                                                    dispatch(state.tr.replaceSelectionWith(state.schema.text(formattedText)));
                                                }
                                            }
                                        },
                                        // Dropdown for common slide variables/placeholders
                                        {
                                            id: 'slideVariables',
                                            type: 'selectField',
                                            emptyState: 'Insert Variables',
                                            options: [
                                                { id: '{{ title }}', label: 'Slide Title' },
                                                { id: '{{ subtitle }}', label: 'Subtitle' },
                                                { id: '{{ author }}', label: 'Author Name' },
                                                { id: '{{ date }}', label: 'Current Date' },
                                                { id: '{{ company }}', label: 'Company Name' }
                                            ],
                                            onChange: ({ value }: { value: string }) => {
                                                commands.text.replace(value, { select: true });
                                            }
                                        }
                                    ];
                                },
                                // Handle Enter key for better slide formatting
                                onEnter({ commands }) {
                                    // Create a line break for better slide formatting
                                    commands.text.createBreak();
                                    return true;
                                }
                            })
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
                        },
                        // Custom layout optimized for slide presentations
                        layout: {
                            default: {
                                type: 'row',
                                style: { height: '100%' },
                                children: [
                                    // Left sidebar with blocks panel always visible
                                    {
                                        type: 'column',
                                        style: {
                                            width: 280,
                                            minWidth: 280,
                                            maxWidth: 280,
                                            borderRightWidth: 1,
                                            borderRightColor: '#e5e7eb',
                                            backgroundColor: '#f9fafb',
                                            overflow: 'hidden'
                                        },
                                        children: [
                                            // Blocks panel - always visible
                                            {
                                                type: 'panelBlocks',
                                                style: {
                                                    flex: 1,
                                                    padding: 8,
                                                    overflow: 'auto'
                                                },
                                                symbols: false, // Hide symbols section for cleaner UI
                                                search: true,   // Keep search functionality
                                                hideCategories: false // Keep categories for organization
                                            }
                                        ]
                                    },
                                    // Main canvas area
                                    {
                                        type: 'canvasSidebarTop',
                                        style: {
                                            flex: 1,
                                        }
                                    },
                                    // Right sidebar with properties and layers
                                    {
                                        type: 'column',
                                        style: {
                                            width: 300,
                                            minWidth: 300,
                                            maxWidth: 300,
                                            borderLeftWidth: 1,
                                            borderLeftColor: '#e5e7eb',
                                            backgroundColor: '#f9fafb'
                                        },
                                        children: [
                                            // Properties and Styles panels
                                            {
                                                type: 'tabs',
                                                style: {
                                                    flex: 1,
                                                },
                                                tabs: [
                                                    {
                                                        id: 'properties',
                                                        label: 'Properties',
                                                        children: [
                                                            {
                                                                type: 'panelProperties',
                                                                style: {
                                                                    padding: 8,
                                                                    overflow: 'auto'
                                                                }
                                                            }
                                                        ]
                                                    },
                                                    {
                                                        id: 'styles',
                                                        label: 'Styles',
                                                        children: [
                                                            {
                                                                type: 'panelStyles',
                                                                style: {
                                                                    padding: 8,
                                                                    overflow: 'auto'
                                                                }
                                                            }
                                                        ]
                                                    }
                                                ]
                                            },
                                            // Layers panel at bottom
                                            {
                                                type: 'panelLayers',
                                                header: {
                                                    label: 'Layers',

                                                },
                                                style: {
                                                    height: 250,
                                                    borderTopWidth: 1,
                                                    borderTopColor: '#e5e7eb',
                                                    overflow: 'auto'
                                                }
                                            }
                                        ]
                                    }
                                ]
                            },
                            // Responsive layout for smaller screens
                            responsive: {
                                // Switch to simpler layout below 1200px (remove right sidebar)
                                1200: {
                                    type: 'row',
                                    style: { height: '100%' },
                                    children: [
                                        {
                                            type: 'column',
                                            style: {
                                                width: 250,
                                                borderRightWidth: 1,
                                                borderRightColor: '#e5e7eb',
                                                backgroundColor: '#f9fafb'
                                            },
                                            children: [
                                                {
                                                    type: 'panelBlocks',
                                                    style: { flex: 1, padding: 6 },
                                                    symbols: false,
                                                    search: true,
                                                    hideCategories: true
                                                }
                                            ]
                                        },
                                        {
                                            type: 'column',
                                            style: { flex: 1 },
                                            children: [
                                                {
                                                    type: 'row',
                                                    style: {
                                                        height: 45,
                                                        borderBottomWidth: 1,
                                                        borderBottomColor: '#e5e7eb',
                                                        backgroundColor: '#ffffff',
                                                        alignItems: 'center',
                                                        padding: '0 12px'
                                                    },
                                                    children: [
                                                        { type: 'panelPages', style: { flex: 1 } }
                                                    ]
                                                },
                                                { type: 'canvas', style: { flex: 1 } }
                                            ]
                                        }
                                    ]
                                }
                            }
                        }
                    }}
                />
            </div>
        </div>
    )
}


