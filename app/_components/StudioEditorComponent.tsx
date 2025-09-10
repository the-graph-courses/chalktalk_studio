'use client'

import StudioEditor from '@grapesjs/studio-sdk/react'
import '@grapesjs/studio-sdk/style'
import { canvasAbsoluteMode } from '@grapesjs/studio-sdk-plugins'
import { useRef, useEffect } from 'react'
import { getSlideContainer, DEFAULT_SLIDE_FORMAT } from '@/lib/slide-formats'
import { TEMPLATES } from '@/lib/slide-templates'

interface StudioEditorComponentProps {
    licenseKey: string
    identityId: string
    projectId?: string
    initialProject?: any
    onSave?: (project: any) => Promise<void>
    showTemplateDialog?: boolean
}

export default function StudioEditorComponent({
    licenseKey,
    identityId,
    projectId,
    initialProject,
    onSave,
    showTemplateDialog = false
}: StudioEditorComponentProps) {
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

    const defaultProject = {
        pages: [
            {
                name: 'Slide 1',
                component: getSlideContainer(`
                    <h1 style="position: absolute; top: 200px; left: 100px; font-size: 80px; margin: 0; font-weight: 700; color: #2c3e50;">
                        Welcome to ChalkTalk Studio
                    </h1>
                    <p style="position: absolute; top: 320px; left: 100px; font-size: 32px; max-width: 800px; line-height: 1.5; color: #555;">
                        Create beautiful slide presentations with AI assistance
                    </p>
                `)
            },
        ],
    }

    return (
        <StudioEditor
            onReady={(editor) => {
                editorRef.current = editor

                // Handle new page creation with slide container
                editor.on('page:add', (page) => {
                    editor.Pages.select(page);
                    const wrapper = editor.DomComponents.getWrapper();

                    if (wrapper && !wrapper.find('[data-slide-container]').length) {
                        const currentContent = wrapper.getInnerHTML();
                        wrapper.components(getSlideContainer(currentContent));
                    }
                });

                // Show template dialog if requested
                if (showTemplateDialog) {
                    editor.runCommand('studio:layoutToggle', {
                        id: 'template-browser',
                        header: false,
                        placer: { type: 'dialog', title: 'Choose a template for your project', size: 'l' },
                        layout: {
                            type: 'panelTemplates',
                            content: { itemsPerRow: 4 },
                            onSelect: ({ loadTemplate, template }: any) => {
                                loadTemplate(template);
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

                // Set default zoom to fit slide with padding
                setTimeout(() => {
                    const canvasEl = editor.Canvas.getFrameEl();
                    if (canvasEl) {
                        const slideWidth = DEFAULT_SLIDE_FORMAT.width;
                        const slideHeight = DEFAULT_SLIDE_FORMAT.height;
                        const canvasRect = canvasEl.getBoundingClientRect();
                        const availableWidth = canvasRect.width * 0.7;
                        const availableHeight = canvasRect.height * 0.7;
                        const zoomX = (availableWidth / slideWidth) * 100;
                        const zoomY = (availableHeight / slideHeight) * 100;
                        const optimalZoom = Math.min(zoomX, zoomY);
                        editor.Canvas.setZoom(Math.max(Math.min(optimalZoom, 100), 10));
                    }
                }, 300);

                // Add scroll wheel zoom functionality
                const canvas = editor.Canvas.getElement()
                if (canvas) {
                    const handleWheelZoom = (event: WheelEvent) => {
                        if (event.ctrlKey || event.metaKey) {
                            event.preventDefault()
                            const delta = event.deltaY
                            let zoom = editor.Canvas.getZoom()

                            if (delta < 0) {
                                zoom += 5
                            } else {
                                zoom -= 5
                            }

                            zoom = Math.max(10, Math.min(zoom, 300))
                            editor.Canvas.setZoom(zoom)
                        }
                    }

                    canvas.addEventListener('wheel', handleWheelZoom, { passive: false })
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
                    id: projectId || 'demo-project'
                },
                identity: {
                    id: identityId,
                },
                assets: {
                    storageType: 'cloud'
                },
                storage: onSave ? {
                    type: 'self',
                    onSave: async ({ project }) => {
                        try {
                            await onSave(project)
                        } catch (error) {
                            console.error('Failed to save project:', error)
                            throw error
                        }
                    },
                    onLoad: async () => {
                        return { project: initialProject || defaultProject };
                    },
                    autosaveChanges: 100,
                    autosaveIntervalMs: 10000
                } : {
                    type: 'browser',
                    onLoad: async () => {
                        return { project: initialProject || defaultProject };
                    }
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
                                        symbols: false,
                                        search: true,
                                        hideCategories: false
                                    }
                                ]
                            },
                            // Main canvas area with default top bar
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
    )
}
