'use client'

import StudioEditor from '@grapesjs/studio-sdk/react'
import '@grapesjs/studio-sdk/style'
import { useEffect, useMemo, useRef, useState, use } from 'react'
import { useUser } from '@clerk/nextjs'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useUserDetail } from '@/app/provider'

type PageProps = { params: Promise<{ projectId: string }> }

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

    // Load deck when user is available
    const loadArgs = user ? { projectId, uid: (user as any).id } : null

    // Track editor remounts and hashes to avoid loops - ALWAYS call these hooks
    const [editorKey, setEditorKey] = useState(0)
    const lastSavedHashRef = useRef<string | null>(null)
    const lastLoadedHashRef = useRef<string | null>(null)

    // If project from Convex changes and it's not our own last save, remount editor
    useEffect(() => {
        if (!deck?.project) return
        const currentHash = JSON.stringify(deck.project)
        // Skip if this is the same as what we already loaded
        if (currentHash === lastLoadedHashRef.current) return
        // Skip if this equals the last saved hash we wrote (avoid loop)
        if (currentHash === lastSavedHashRef.current) {
            // Mark as loaded to prevent future remounts on same data
            lastLoadedHashRef.current = currentHash
            return
        }
        // External update detected → remount editor with fresh project
        lastLoadedHashRef.current = currentHash
        setEditorKey((k) => k + 1)
    }, [deck?.project])

    if (!userDetail) return null
    if (deck === undefined) return null

    const initialProject = deck?.project || {
        pages: [
            { name: 'Slide 1', component: '<h1>New Slide Deck</h1>' },
        ],
    }

    return (
        <div className="h-full">
            <StudioEditor
                key={editorKey}
                options={{
                    licenseKey,
                    storage: {
                        type: 'self',
                        autosaveChanges: 5,
                        project: initialProject,
                        onSave: async ({ project }) => {
                            await saveDeck({
                                projectId,
                                uid: userDetail._id,
                                project,
                            })
                            // Remember what we wrote to avoid self-refresh loops
                            try {
                                lastSavedHashRef.current = JSON.stringify(project)
                            } catch {
                                lastSavedHashRef.current = null
                            }
                        },
                    },
                    project: {
                        id: projectId,
                        type: 'web',
                    },
                    identity: {
                        id: identityId,
                    },
                }}
            />
        </div>
    )
}


