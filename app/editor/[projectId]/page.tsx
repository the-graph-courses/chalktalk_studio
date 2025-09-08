'use client'

import StudioEditor from '@grapesjs/studio-sdk/react'
import '@grapesjs/studio-sdk/style'
import { canvasAbsoluteMode } from '@grapesjs/studio-sdk-plugins'
import { useMemo, use, useRef, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useUserDetail } from '@/app/provider'

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
                        component: content
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

                    // Select the page and update its content
                    editor.Pages.select(page)
                    editor.setComponents(newContent)
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

                    // Select the page and update its content
                    editor.Pages.select(page)
                    editor.setComponents(newContent)
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
                name: 'Slide 1',
                component: ''
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
        <div className="h-full">
            <StudioEditor
                onReady={(editor) => {
                    editorRef.current = editor

                    // Add scroll wheel zoom functionality
                    const canvas = editor.Canvas.getElement()
                    if (canvas) {
                        const handleWheelZoom = (event: WheelEvent) => {
                            // Only zoom if Shift key is pressed
                            if (event.shiftKey) {
                                event.preventDefault() // Prevent default scroll behavior

                                // Determine scroll direction
                                const delta = event.deltaY

                                // Get current zoom level
                                let zoom = editor.Canvas.getZoom()

                                // Adjust zoom level (using same increment as the plugin buttons)
                                if (delta < 0) {
                                    // Scroll up, zoom in
                                    zoom += 2
                                } else {
                                    // Scroll down, zoom out
                                    zoom -= 2
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
                    devices: {
                        default: [
                            { id: 'desktop', name: 'Desktop', width: '' }
                        ]
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
                }}
            />
        </div>
    )
}


