'use client'

import { useMemo } from 'react'
import dynamic from 'next/dynamic'

const TestSlideEditor = dynamic(
    () => import('@/app/_components/TestSlideEditor'),
    { ssr: false }
)

export default function TestSlideFormatPage() {
    const licenseKey = process.env.NEXT_PUBLIC_GRAPES_SDK_LICENSE_KEY || ''
    const identityId = useMemo(() => 'test-user', [])

    return (
        <div className="h-screen w-screen">
            <TestSlideEditor
                licenseKey={licenseKey}
                identityId={identityId}
                projectId="test-slide-format"
            />
        </div>
    )
}