'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DemoPage() {
    const router = useRouter()

    useEffect(() => {
        // Auto-redirect to the public editor with a demo project ID
        router.replace('/public-editor/demo-project')
    }, [router])

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Loading Demo Editor...</h2>
                <p className="text-gray-500">Redirecting to the public slide editor</p>
            </div>
        </div>
    )
}
