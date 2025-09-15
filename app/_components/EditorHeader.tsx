'use client'

import { useState, useEffect, useRef } from 'react'
import { useMutation } from 'convex/react'
import { useRouter } from 'next/navigation'
import { api } from '@/convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UserButton } from '@clerk/nextjs'
import { usePanelControls } from './LayoutWrapper'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import {
    ChevronDown,
    Save,
    Download,
    Copy,
    Trash2,
    Settings,
    Eye,
    Share2,
    Undo2,
    Redo2,
    MousePointer2,
    Zap
} from 'lucide-react'

interface EditorHeaderProps {
    projectId: string
    deckId?: string
    initialTitle?: string
    userDetailId: string
}

export default function EditorHeader({ projectId, deckId, initialTitle, userDetailId }: EditorHeaderProps) {
    const { toggleAIChat, toggleTestPanel, isAIChatOpen, isTestPanelOpen } = usePanelControls()
    const [title, setTitle] = useState(initialTitle || 'Untitled Presentation')
    const [isEditing, setIsEditing] = useState(false)
    const [tempTitle, setTempTitle] = useState(title)
    const [marqueeActive, setMarqueeActive] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const router = useRouter()
    const saveDeck = useMutation(api.slideDeck.SaveDeck)
    const renameDeck = useMutation(api.slideDeck.RenameDeck)
    const deleteDeck = useMutation(api.slideDeck.DeleteDeck)
    const duplicateDeck = useMutation(api.slideDeck.DuplicateDeck)

    useEffect(() => {
        if (initialTitle) {
            setTitle(initialTitle)
            setTempTitle(initialTitle)
        }
    }, [initialTitle])

    const handleTitleEdit = () => {
        setIsEditing(true)
        setTempTitle(title)
        setTimeout(() => inputRef.current?.focus(), 0)
    }

    const handleTitleSave = async () => {
        if (tempTitle.trim() && tempTitle !== title) {
            setTitle(tempTitle.trim())
            try {
                if (deckId) {
                    await renameDeck({
                        deckId: deckId as any,
                        uid: userDetailId as any,
                        newTitle: tempTitle.trim()
                    })
                } else {
                    // For new decks, save with title
                    await saveDeck({
                        projectId,
                        uid: userDetailId as any,
                        title: tempTitle.trim(),
                        project: JSON.stringify({ pages: [] }) // Empty project for new decks
                    })
                }
            } catch (error) {
                console.error('Failed to save title:', error)
                // Revert title on error
                setTempTitle(title)
            }
        }
        setIsEditing(false)
    }

    const handleTitleCancel = () => {
        setTempTitle(title)
        setIsEditing(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleTitleSave()
        } else if (e.key === 'Escape') {
            handleTitleCancel()
        }
    }

    const handleSave = () => {
        // Trigger editor save
        if (typeof window !== 'undefined' && window.grapesjsAITools?.getEditor) {
            const editor = window.grapesjsAITools.getEditor()
            if (editor) {
                editor.store()
            }
        }
    }

    const handleExport = () => {
        if (typeof window !== 'undefined' && window.grapesjsAITools?.getEditor) {
            const editor = window.grapesjsAITools.getEditor()
            if (editor) {
                // Get HTML and CSS
                const html = editor.getHtml()
                const css = editor.getCss()

                // Create a complete HTML document
                const fullHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${title}</title>
    <style>
        body { margin: 0; padding: 0; }
        ${css}
    </style>
    <style>
        @media print {
            body { print-color-adjust: exact; }
            .page { page-break-after: always; }
        }
    </style>
</head>
<body>
    ${html}
</body>
</html>`

                // Create and download the file
                const blob = new Blob([fullHtml], { type: 'text/html' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)
            }
        }
    }

    const handleDuplicate = async () => {
        if (!deckId) {
            console.warn('Cannot duplicate: No deck ID available')
            return
        }

        try {
            const result = await duplicateDeck({
                deckId: deckId as any,
                uid: userDetailId as any,
                newTitle: `${title} (Copy)`
            })

            if (result.success) {
                // Navigate to the new duplicated deck
                router.push(`/editor/${result.newProjectId}`)
            }
        } catch (error) {
            console.error('Failed to duplicate deck:', error)
            alert('Failed to duplicate presentation. Please try again.')
        }
    }

    const handleDelete = async () => {
        if (!deckId) {
            console.warn('Cannot delete: No deck ID available')
            return
        }

        if (window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
            try {
                await deleteDeck({
                    deckId: deckId as any,
                    uid: userDetailId as any
                })

                // Navigate back to decks page
                router.push('/decks')
            } catch (error) {
                console.error('Failed to delete deck:', error)
                alert('Failed to delete presentation. Please try again.')
            }
        }
    }

    const handleUndo = () => {
        if (typeof window !== 'undefined' && window.grapesjsAITools?.getEditor) {
            const editor = window.grapesjsAITools.getEditor()
            if (editor) {
                editor.UndoManager.undo()
            }
        }
    }

    const handleRedo = () => {
        if (typeof window !== 'undefined' && window.grapesjsAITools?.getEditor) {
            const editor = window.grapesjsAITools.getEditor()
            if (editor) {
                editor.UndoManager.redo()
            }
        }
    }

    const handleShare = () => {
        // Copy the current URL to clipboard
        if (navigator.clipboard) {
            const url = window.location.href
            navigator.clipboard.writeText(url).then(() => {
                alert('Link copied to clipboard!')
            }).catch(() => {
                alert('Failed to copy link. Please copy the URL from your address bar.')
            })
        } else {
            alert('Please copy the URL from your address bar to share this presentation.')
        }
    }

    const handlePresent = () => {
        if (typeof window !== 'undefined') window.open(`/present/${projectId}`, '_blank')
    }

    const handleVideo = () => {
        if (typeof window !== 'undefined') window.open(`/present/${projectId}?autoplay=1`, '_blank')
    }

    const handleGenerateAudio = async () => {
        try {
            const res = await fetch('/api/tts/generate', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId })
            })
            if (!res.ok) throw new Error(await res.text())
            const data = await res.json()
            // Store cache in localStorage for present page
            try { localStorage.setItem(`ttsCache:${projectId}`, JSON.stringify(data)) } catch { }
            // Also fetch from Convex to verify persistence
            try {
                const verify = await fetch(`/api/tts/cache?projectId=${encodeURIComponent(projectId)}`)
                const serverData = verify.ok ? await verify.json() : null
                const totalServerClips = serverData ? Object.values(serverData).reduce((acc: number, arr: any) => acc + (Array.isArray(arr) ? arr.length : 0), 0) : 0
                alert(`Audio generated. Saved ${data.saved ?? '?'} clips. Server has ${totalServerClips}.`)
            } catch {
                alert(`Audio generated. Saved ${data.saved ?? '?'} clips.`)
            }
        } catch (e) {
            console.error(e)
            alert('Audio generation failed. See console for details.')
        }
    }

    const handleZoomIn = () => {
        if (typeof window !== 'undefined' && window.grapesjsAITools?.getEditor) {
            const editor = window.grapesjsAITools.getEditor()
            if (editor) {
                const currentZoom = editor.Canvas.getZoom()
                const newZoom = Math.min(currentZoom + 10, 300)
                editor.Canvas.setZoom(newZoom)
            }
        }
    }

    const handleZoomOut = () => {
        if (typeof window !== 'undefined' && window.grapesjsAITools?.getEditor) {
            const editor = window.grapesjsAITools.getEditor()
            if (editor) {
                const currentZoom = editor.Canvas.getZoom()
                const newZoom = Math.max(currentZoom - 10, 10)
                editor.Canvas.setZoom(newZoom)
            }
        }
    }

    const handleFitToWindow = () => {
        if (typeof window !== 'undefined' && window.grapesjsAITools?.getEditor) {
            const editor = window.grapesjsAITools.getEditor()
            if (editor) {
                // Reset zoom to fit the slide optimally
                editor.Canvas.setZoom(50) // A reasonable default
            }
        }
    }

    const handleToggleMarquee = () => {
        if (typeof window !== 'undefined' && window.grapesjsAITools?.getEditor) {
            const editor = window.grapesjsAITools.getEditor()
            if (editor) {
                if (marqueeActive) {
                    editor.runCommand('marquee-select:toggle', { stop: true })
                    setMarqueeActive(false)
                } else {
                    editor.runCommand('marquee-select:toggle')
                    setMarqueeActive(true)
                }
            }
        }
    }

    return (
        <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm">
            {/* Left side - Logo and title */}
            <div className="flex items-center space-x-4">
                <div className="text-xl font-bold text-blue-600">ChalkTalk</div>

                <div className="flex items-center space-x-2">
                    {isEditing ? (
                        <Input
                            ref={inputRef}
                            value={tempTitle}
                            onChange={(e) => setTempTitle(e.target.value)}
                            onBlur={handleTitleSave}
                            onKeyDown={handleKeyDown}
                            className="h-8 text-sm font-medium min-w-[200px] max-w-[400px]"
                            placeholder="Enter presentation title..."
                        />
                    ) : (
                        <button
                            onClick={handleTitleEdit}
                            className="text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                        >
                            {title}
                        </button>
                    )}
                </div>
            </div>

            {/* Center - Menu bar */}
            <div className="flex items-center space-x-1">
                {/* File Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8">
                            File <ChevronDown className="ml-1 h-3 w-3" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={handleSave}>
                            <Save className="mr-2 h-4 w-4" />
                            Save
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleExport}>
                            <Download className="mr-2 h-4 w-4" />
                            Export single page as HTML
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleShare}>
                            <Share2 className="mr-2 h-4 w-4" />
                            Share
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleDuplicate}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* TTS Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8">
                            TTS <ChevronDown className="ml-1 h-3 w-3" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => {
                            if (typeof window !== 'undefined' && window.grapesjsAITools?.getEditor) {
                                const editor = window.grapesjsAITools.getEditor()
                                editor?.runCommand('tts:set-fragments-from-text', { scope: 'slide' })
                            }
                        }}>
                            Set fragments from text (slide)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                            if (typeof window !== 'undefined' && window.grapesjsAITools?.getEditor) {
                                const editor = window.grapesjsAITools.getEditor()
                                editor?.runCommand('tts:set-fragments-from-text', { scope: 'deck' })
                            }
                        }}>
                            Set fragments from text (deck)
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Edit Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8">
                            Edit <ChevronDown className="ml-1 h-3 w-3" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={handleUndo}>
                            <Undo2 className="mr-2 h-4 w-4" />
                            Undo
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleRedo}>
                            <Redo2 className="mr-2 h-4 w-4" />
                            Redo
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleToggleMarquee}>
                            <MousePointer2 className="mr-2 h-4 w-4" />
                            {marqueeActive ? 'Disable' : 'Enable'} Marquee Select
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* View Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8">
                            View <ChevronDown className="ml-1 h-3 w-3" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={handlePresent}>
                            <Eye className="mr-2 h-4 w-4" />
                            Present
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleGenerateAudio}>
                            Generate Audio (cache)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleVideo}>
                            Video (auto TTS)
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleZoomIn}>
                            Zoom In
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleZoomOut}>
                            Zoom Out
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleFitToWindow}>
                            Fit to Window
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

            </div>

            {/* Right side - Quick actions and AI/User controls */}
            <TooltipProvider>
                <div className="flex items-center space-x-2">
                    {projectId && (
                        <>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant={isAIChatOpen ? "default" : "ghost"}
                                        size="sm"
                                        onClick={toggleAIChat}
                                        title="Toggle Chat"
                                    >
                                        <Zap className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Toggle Chat</p>
                                </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant={isTestPanelOpen ? "default" : "ghost"}
                                        size="sm"
                                        onClick={toggleTestPanel}
                                        title="Toggle AI Tests Panel"
                                    >
                                        <Settings className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Toggle AI Tests Panel</p>
                                </TooltipContent>
                            </Tooltip>
                        </>
                    )}
                    <Button variant="ghost" size="sm" onClick={handleUndo}>
                        <Undo2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleRedo}>
                        <Redo2 className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={marqueeActive ? "default" : "ghost"}
                        size="sm"
                        onClick={handleToggleMarquee}
                        title={marqueeActive ? "Disable marquee selection (Shift+drag)" : "Enable marquee selection (Shift+drag)"}
                    >
                        <MousePointer2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleSave}>
                        <Save className="h-4 w-4" />
                    </Button>
                    <UserButton afterSignOutUrl="/" />
                </div>
            </TooltipProvider>
        </div>
    )
}
