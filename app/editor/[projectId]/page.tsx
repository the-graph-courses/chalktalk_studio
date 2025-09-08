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
                component: `
                <div style="position: relative; width: 800px; height: 500px; margin: 70px auto 0; background: linear-gradient(135deg, #f5f7fa, #c3cfe2); color: #1a1a1a; border-radius: 12px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1); overflow: hidden;">
                  <div style="position: absolute; top: 0; left: 550px; width: 300px; height: 100%; background-color: #baccec; transform: skewX(-12deg)"></div>
    
                  <h1 style="position: absolute; top: 40px; left: 40px; font-size: 50px; margin: 0; font-weight: 700;">
                    Absolute Mode
                  </h1>
    
                  <p style="position: absolute; top: 135px; left: 40px; font-size: 22px; max-width: 450px; line-height: 1.5; color: #333;">
                    Enable free positioning for your elements — perfect for fixed layouts like presentations, business cards, or print-ready designs.
                  </p>
    
                  <ul data-gjs-type="text" style="position: absolute; top: 290px; left: 40px; font-size: 18px; line-height: 2; list-style: none; padding: 0;">
                    <li>🎯 Drag & place elements anywhere</li>
                    <li>🧲 Smart snapping & axis locking</li>
                    <li>⚙️ You custom logic</li>
                  </ul>
    
                  <div style="position: absolute; left: 540px; top: 100px; width: 200px; height: 200px; background: rgba(255, 255, 255, 0.3); border-radius: 20px; backdrop-filter: blur(10px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; font-size: 80px;">
                    📐
                  </div>
    
                  <div style="position: absolute; top: 405px; left: 590px; font-size: 14px; color: #555;">
                    Studio SDK · GrapesJS
                  </div>
              </div>
    
              <style>
                body {
                  position: relative;
                  background: linear-gradient(135deg, #f5f7fa, #c3cfe2);
                  font-family: system-ui;
                  overflow: hidden;
                }
              </style>
                `
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
                }}
                options={{
                    licenseKey,
                    plugins: [canvasAbsoluteMode],
                    devices: {
                        default: [
                            { id: 'desktop', name: 'Desktop', width: '' }
                        ]
                    },
                    storage: {
                        type: 'self',
                        autosaveChanges: 1,
                        onSave: async ({ project }) => {
                            await saveDeck({
                                projectId,
                                uid: userDetail._id,
                                project: JSON.stringify(project),
                            })
                        },
                        onLoad: async () => {
                            return { project: initialProject };
                        },
                    },
                    project: {
                        id: projectId,
                        type: 'web',
                        default: {
                            pages: [
                                {
                                    name: 'Fallback Slide',
                                    component: `
                                        <div style="position: relative; width: 800px; height: 500px; margin: 70px auto 0; background: linear-gradient(135deg, #ff6b6b, #4ecdc4); color: white; border-radius: 12px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1); overflow: hidden;">
                                            <h1 style="position: absolute; top: 180px; left: 60px; font-size: 36px; margin: 0; font-weight: 700;">
                                                Fallback Project
                                            </h1>
                                            <p style="position: absolute; top: 240px; left: 60px; font-size: 18px; opacity: 0.9;">
                                                Please reload to retry loading your project
                                            </p>
                                        </div>
                                        <style>
                                            body {
                                                position: relative;
                                                background: linear-gradient(135deg, #f0f2f5, #c3cfe2);
                                                font-family: system-ui;
                                                overflow: hidden;
                                            }
                                        </style>
                                    `
                                },
                            ]
                        },
                    },
                    identity: {
                        id: identityId,
                    },
                }}
            />
        </div>
    )
}


