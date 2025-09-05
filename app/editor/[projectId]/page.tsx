'use client'

import StudioEditor from '@grapesjs/studio-sdk/react'
import '@grapesjs/studio-sdk/style'
import { useEffect, useMemo } from 'react'
import { useUser } from '@clerk/nextjs'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useUserDetail } from '@/app/provider'

type PageProps = { params: { projectId: string } }

export default function EditorPage({ params }: PageProps) {
    const { user } = useUser()
    const identityId = useMemo(() => user?.id || 'anonymous', [user?.id])
    const licenseKey = process.env.NEXT_PUBLIC_GRAPES_SDK_LICENSE_KEY
    const projectId = params.projectId

    const saveDeck = useMutation(api.slideDeck.SaveDeck)
    const { userDetail } = useUserDetail()
    const deck = useQuery(
        api.slideDeck.GetDeck,
        userDetail ? { projectId, uid: userDetail._id } : 'skip'
    )

    // Load deck when user is available
    const loadArgs = user ? { projectId, uid: (user as any).id } : null

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


