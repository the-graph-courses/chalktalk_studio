'use client'

import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useUserDetail } from '@/app/provider'
import Link from 'next/link'

export default function DecksPage() {
    const { userDetail } = useUserDetail()
    const decks = useQuery(api.slideDeck.ListDecksByUser, userDetail ? { uid: userDetail._id } : 'skip')

    if (!userDetail) return null
    if (!decks?.length) {
        return (
            <div className="p-6">
                <div className="text-sm text-muted-foreground">No slide decks yet.</div>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-3">
            {decks.map((d) => (
                <Link key={d._id} href={`/editor/${d.projectId}`} className="block p-3 rounded border hover:bg-accent">
                    <div className="font-medium">{d.title || 'Untitled deck'}</div>
                    <div className="text-xs text-muted-foreground">{d.projectId}</div>
                </Link>
            ))}
        </div>
    )
}


