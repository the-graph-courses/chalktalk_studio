'use client'

import { useMemo } from 'react'
import StudioEditorComponent from '@/app/_components/StudioEditorComponent'
import SlideThumbnailPanel from '@/app/_components/SlideThumbnailPanel'

export default function DemoEditorPage() {
    const licenseKey = process.env.NEXT_PUBLIC_GRAPES_SDK_LICENSE_KEY || ''
    const identityId = useMemo(() => 'demo-user', [])

    return (
        <div className="h-screen flex flex-col">
            {/* Simple header for demo */}
            <div className="h-14 bg-white border-b border-gray-200 flex items-center px-4">
                <div className="flex items-center space-x-2">
                    <h1 className="text-lg font-semibold text-gray-900">
                        ChalkTalk Studio Demo
                    </h1>
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        Demo Mode
                    </span>
                </div>
                <div className="ml-auto text-sm text-gray-500">
                    No login required • Changes are not saved
                </div>
            </div>

            {/* Editor takes remaining space */}
            <div className="flex-1">
                <StudioEditorComponent
                    licenseKey={licenseKey}
                    identityId={identityId}
                    showTemplateDialog={true}
                />
            </div>

            {/* Slide thumbnail panel at bottom */}
            <div className="flex-shrink-0">
                <SlideThumbnailPanel />
            </div>
        </div>
    )
}
