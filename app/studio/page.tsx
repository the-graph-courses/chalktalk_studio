'use client'

import StudioEditor from '@grapesjs/studio-sdk/react'
import '@grapesjs/studio-sdk/style'
import { useEffect, useMemo } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

const generateId = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2)}_${Date.now()}`

export default function StudioPage() {
    const { user } = useUser()
    const router = useRouter()

    useEffect(() => {
        // Redirect to dynamic page with new project id
        const newId = generateId('project')
        router.replace(`/editor/${newId}`)
    }, [router])

    return null
}


