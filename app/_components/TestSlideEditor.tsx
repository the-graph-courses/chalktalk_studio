'use client'

import StudioEditor from '@grapesjs/studio-sdk/react'
import '@grapesjs/studio-sdk/style'
import { canvasAbsoluteMode } from '@grapesjs/studio-sdk-plugins'
import { useRef, useEffect, useState } from 'react'

// Configurable slide formats
export const SLIDE_FORMATS = {
    PRESENTATION_16_9: {
        id: '16:9',
        name: 'Presentation (16:9)',
        width: 1920,
        height: 1080,
    },
    PRESENTATION_4_3: {
        id: '4:3',
        name: 'Presentation (4:3)',
        width: 1440,
        height: 1080,
    },
    SQUARE: {
        id: '1:1',
        name: 'Square',
        width: 1080,
        height: 1080,
    },
    PORTRAIT: {
        id: '9:16',
        name: 'Portrait',
        width: 1080,
        height: 1920,
    }
}

interface TestSlideEditorProps {
    licenseKey: string
    identityId: string
    projectId?: string
}

export default function TestSlideEditor({
    licenseKey,
    identityId,
    projectId = 'test-project'
}: TestSlideEditorProps) {
    const editorRef = useRef<any>(null)
    const [currentFormat, setCurrentFormat] = useState(SLIDE_FORMATS.PRESENTATION_16_9)
    const [slideSettings, setSlideSettings] = useState({
        format: 'PRESENTATION_16_9',
        customWidth: 1920,
        customHeight: 1080,
        backgroundColor: '#f0f2f5',
        slideBackground: '#ffffff',
        containerPadding: 60, // Padding around slide container
        infiniteCanvas: true,
        defaultZoomMode: 'fit-slide', // 'fit-slide' | 'actual-size' | 'custom'
        defaultZoomLevel: 75
    })

    // Function to create slide container with settings
    const getSlideContainer = (content: string, settings = slideSettings) => {
        const format = SLIDE_FORMATS[settings.format as keyof typeof SLIDE_FORMATS] || {
            width: settings.customWidth,
            height: settings.customHeight
        }

        // Calculate styles based on infinite canvas setting
        const containerStyles = settings.infiniteCanvas ? {
            position: 'absolute',
            width: `${format.width}px`,
            height: `${format.height}px`,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: settings.slideBackground,
            borderRadius: '8px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            overflow: 'visible'
        } : {
            position: 'relative',
            width: '100%',
            height: '100%',
            backgroundColor: settings.slideBackground,
            overflow: 'visible'
        }

        const styleString = Object.entries(containerStyles)
            .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}:${value}`)
            .join(';')

        return `
            <div
                data-slide-container="true"
                data-slide-format="${settings.format}"
                data-slide-width="${format.width}"
                data-slide-height="${format.height}"
                draggable="false"
                style="${styleString}"
            >
                ${content}
            </div>
        `
    }

    // Function to calculate and set optimal zoom
    const setOptimalZoom = (editor: any, settings = slideSettings) => {
        if (!editor || !editor.Canvas) return

        const format = SLIDE_FORMATS[settings.format as keyof typeof SLIDE_FORMATS] || {
            width: settings.customWidth,
            height: settings.customHeight
        }

        setTimeout(() => {
            const canvasEl = editor.Canvas.getFrameEl()
            if (!canvasEl) return

            const canvasRect = canvasEl.getBoundingClientRect()
            const padding = settings.containerPadding * 2
            const availableWidth = canvasRect.width - padding
            const availableHeight = canvasRect.height - padding

            let zoom = 100

            switch (settings.defaultZoomMode) {
                case 'fit-slide':
                    const zoomX = (availableWidth / format.width) * 100
                    const zoomY = (availableHeight / format.height) * 100
                    zoom = Math.min(zoomX, zoomY, 100)
                    break
                case 'actual-size':
                    zoom = 100
                    break
                case 'custom':
                    zoom = settings.defaultZoomLevel
                    break
            }

            editor.Canvas.setZoom(Math.max(10, Math.min(zoom, 300)))

            // Center the canvas if infinite canvas mode
            if (settings.infiniteCanvas) {
                const canvas = editor.Canvas.getBody()
                if (canvas) {
                    canvas.style.minHeight = '200%'
                    canvas.style.minWidth = '200%'
                    canvas.style.position = 'relative'
                }
            }
        }, 500)
    }

    const defaultProject = {
        pages: [
            {
                name: 'Test Slide',
                component: getSlideContainer(`
                    <h1 style="position: absolute; top: 100px; left: 100px; font-size: 72px; margin: 0; font-weight: 700; color: #1a1a1a;">
                        Slide Format Test
                    </h1>
                    <p style="position: absolute; top: 220px; left: 100px; font-size: 28px; max-width: 800px; line-height: 1.6; color: #555;">
                        Testing infinite canvas with configurable slide containers
                    </p>
                    <div style="position: absolute; bottom: 100px; right: 100px; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; color: white;">
                        <p style="margin: 0; font-size: 20px; font-weight: 600;">Format: ${currentFormat.name}</p>
                        <p style="margin: 5px 0 0 0; font-size: 16px;">Dimensions: ${currentFormat.width} x ${currentFormat.height}</p>
                    </div>
                `)
            }
        ]
    }

    return (
        <div className="h-screen w-screen flex flex-col">
            {/* Control Panel */}
            <div className="bg-white border-b border-gray-200 p-4">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">Format:</label>
                        <select 
                            className="px-3 py-1 border rounded"
                            value={slideSettings.format}
                            onChange={(e) => {
                                const newSettings = { ...slideSettings, format: e.target.value }
                                setSlideSettings(newSettings)
                                if (editorRef.current) {
                                    const editor = editorRef.current
                                    const wrapper = editor.DomComponents.getWrapper()
                                    if (wrapper) {
                                        const currentContent = wrapper.find('[data-slide-container]')[0]?.getInnerHTML() || ''
                                        wrapper.components(getSlideContainer(currentContent, newSettings))
                                        setOptimalZoom(editor, newSettings)
                                    }
                                }
                            }}
                        >
                            {Object.entries(SLIDE_FORMATS).map(([key, format]) => (
                                <option key={key} value={key}>{format.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">Zoom Mode:</label>
                        <select 
                            className="px-3 py-1 border rounded"
                            value={slideSettings.defaultZoomMode}
                            onChange={(e) => {
                                const newSettings = { ...slideSettings, defaultZoomMode: e.target.value as any }
                                setSlideSettings(newSettings)
                                if (editorRef.current) {
                                    setOptimalZoom(editorRef.current, newSettings)
                                }
                            }}
                        >
                            <option value="fit-slide">Fit Slide</option>
                            <option value="actual-size">Actual Size</option>
                            <option value="custom">Custom</option>
                        </select>
                    </div>

                    {slideSettings.defaultZoomMode === 'custom' && (
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium">Zoom:</label>
                            <input
                                type="range"
                                min="10"
                                max="200"
                                value={slideSettings.defaultZoomLevel}
                                onChange={(e) => {
                                    const newSettings = { ...slideSettings, defaultZoomLevel: parseInt(e.target.value) }
                                    setSlideSettings(newSettings)
                                    if (editorRef.current) {
                                        editorRef.current.Canvas.setZoom(newSettings.defaultZoomLevel)
                                    }
                                }}
                                className="w-32"
                            />
                            <span className="text-sm">{slideSettings.defaultZoomLevel}%</span>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">
                            <input
                                type="checkbox"
                                checked={slideSettings.infiniteCanvas}
                                onChange={(e) => {
                                    const newSettings = { ...slideSettings, infiniteCanvas: e.target.checked }
                                    setSlideSettings(newSettings)
                                    if (editorRef.current) {
                                        const editor = editorRef.current
                                        const wrapper = editor.DomComponents.getWrapper()
                                        if (wrapper) {
                                            const currentContent = wrapper.find('[data-slide-container]')[0]?.getInnerHTML() || ''
                                            wrapper.components(getSlideContainer(currentContent, newSettings))
                                        }
                                    }
                                }}
                                className="mr-1"
                            />
                            Infinite Canvas
                        </label>
                    </div>

                    <button
                        onClick={() => {
                            if (editorRef.current) {
                                setOptimalZoom(editorRef.current, slideSettings)
                            }
                        }}
                        className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Reset Zoom
                    </button>
                </div>
            </div>

            {/* Editor */}
            <div className="flex-1">
                <StudioEditor
                    onReady={(editor) => {
                        editorRef.current = editor

                        // Set up canvas styles for infinite canvas effect
                        const cssComposer = editor.CssComposer
                        cssComposer.addRules(`
                            body {
                                background: ${slideSettings.backgroundColor};
                                background-image: 
                                    linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px),
                                    linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px);
                                background-size: 50px 50px;
                                margin: 0;
                                min-height: 200vh;
                                min-width: 200vw;
                                position: relative;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                            }
                        `)

                        // Set initial zoom
                        setOptimalZoom(editor, slideSettings)

                        // Enhanced scroll wheel zoom with position tracking
                        const canvas = editor.Canvas.getElement()
                        if (canvas) {
                            const handleWheelZoom = (event: WheelEvent) => {
                                if (event.ctrlKey || event.metaKey) {
                                    event.preventDefault()
                                    
                                    const delta = event.deltaY
                                    let currentZoom = editor.Canvas.getZoom()
                                    const zoomSpeed = 5
                                    const minZoom = 10
                                    const maxZoom = 300

                                    // Calculate new zoom
                                    let newZoom = currentZoom
                                    if (delta < 0) {
                                        newZoom = Math.min(currentZoom + zoomSpeed, maxZoom)
                                    } else {
                                        newZoom = Math.max(currentZoom - zoomSpeed, minZoom)
                                    }

                                    // Apply zoom
                                    editor.Canvas.setZoom(newZoom)

                                    // Update settings if in custom mode
                                    if (slideSettings.defaultZoomMode === 'custom') {
                                        setSlideSettings(prev => ({ ...prev, defaultZoomLevel: newZoom }))
                                    }
                                }
                            }

                            canvas.addEventListener('wheel', handleWheelZoom, { passive: false })
                        }

                        // Handle page changes
                        editor.on('page:add', (page) => {
                            editor.Pages.select(page)
                            const wrapper = editor.DomComponents.getWrapper()
                            if (wrapper && !wrapper.find('[data-slide-container]').length) {
                                wrapper.components(getSlideContainer('', slideSettings))
                            }
                        })
                    }}
                    options={{
                        licenseKey,
                        theme: 'light',
                        plugins: [canvasAbsoluteMode],
                        project: {
                            type: 'web',
                            id: projectId
                        },
                        identity: {
                            id: identityId,
                        },
                        storage: {
                            type: 'browser',
                            onLoad: async () => ({ project: defaultProject })
                        },
                        canvas: {
                            // Enable scrolling in the canvas
                            scripts: [],
                            styles: []
                        }
                    }}
                />
            </div>
        </div>
    )
}