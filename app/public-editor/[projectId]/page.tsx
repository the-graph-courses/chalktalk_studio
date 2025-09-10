'use client'

import StudioEditor from '@grapesjs/studio-sdk/react'
import '@grapesjs/studio-sdk/style'
import { canvasAbsoluteMode } from '@grapesjs/studio-sdk-plugins'
import { useMemo, use, useRef, useEffect } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { getSlideContainer, DEFAULT_SLIDE_FORMAT } from '@/lib/slide-formats'
import { TEMPLATES } from '@/lib/slide-templates'
import { useSearchParams } from 'next/navigation'

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

export default function PublicEditorPage({ params }: PageProps) {
    const { projectId } = use(params)
    const searchParams = useSearchParams()

    // Use anonymous identity for public access
    const identityId = useMemo(() => 'anonymous-public-editor', [])
    const licenseKey = process.env.NEXT_PUBLIC_GRAPES_SDK_LICENSE_KEY || ''

    const saveDeck = useMutation(api.slideDeck.SaveDeck)

    // For public access, we'll either load a demo project or create a temporary one
    const deck = useQuery(
        api.slideDeck.GetDeck,
        // For public access, we'll use a demo project ID or create one on the fly
        { projectId: 'demo-project', uid: 'public-user' }
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

    // Handle demo project loading
    let initialProject = deck?.project || {
        pages: [
            {
                name: 'Demo Presentation',
                component: getSlideContainer(`
                    <h1 style="position: absolute; top: 200px; left: 100px; font-size: 60px; margin: 0; font-weight: 700; color: #2c3e50;">
                        Demo Presentation
                    </h1>
                    <p style="position: absolute; top: 320px; left: 100px; font-size: 24px; max-width: 600px; line-height: 1.5; color: #555;">
                        This is a public demo of the slide editor. You can create and edit slides without authentication.
                    </p>
                    <div style="position: absolute; bottom: 50px; left: 100px; padding: 15px 25px; background: rgba(52, 152, 219, 0.1); border-radius: 8px; border: 2px solid #3498db;">
                        <span style="font-size: 16px; font-weight: 600; color: #3498db;">Public Demo Mode</span>
                    </div>
                `)
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
            console.error('Failed to parse project in public editor:', error)
            return <div>Error: Invalid project format</div>
        }
    }

    return (
        <div className="h-full flex flex-col">
            {/* Public Editor Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <h1 className="text-xl font-semibold text-gray-900">Slide Editor - Public Demo</h1>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Demo Mode
                        </span>
                    </div>
                    <div className="text-sm text-gray-500">
                        Project ID: {projectId}
                    </div>
                </div>
            </div>

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

                        // Add basic canvas styles
                        const cssComposer = editor.CssComposer;
                        cssComposer.addRules(`
                      body {
                        background-color: #f0f2f5;
                        margin: 0;
                        height: 10000px;
                        width: 10000px;
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
                        plugins: [canvasAbsoluteMode],
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
                                // For public demo, we'll save to localStorage instead of the database
                                if (typeof window !== 'undefined') {
                                    try {
                                        const projectData = JSON.stringify(project);
                                        localStorage.setItem(`public-editor-${projectId}`, projectData);
                                        console.log('Project saved to localStorage');
                                    } catch (error) {
                                        console.error('Failed to save project to localStorage:', error);
                                    }
                                }
                            },
                            onLoad: async () => {
                                // Try to load from localStorage first, then fall back to initial project
                                if (typeof window !== 'undefined') {
                                    try {
                                        const savedProject = localStorage.getItem(`public-editor-${projectId}`);
                                        if (savedProject) {
                                            return { project: JSON.parse(savedProject) };
                                        }
                                    } catch (error) {
                                        console.error('Failed to load project from localStorage:', error);
                                    }
                                }
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
