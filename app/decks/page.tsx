'use client'

import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useUserDetail } from '@/app/provider'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Plus,
    MoreVertical,
    Edit2,
    Trash2,
    FileText,
    Calendar,
    Search
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { Id } from '@/convex/_generated/dataModel'

function formatTimeAgo(timestamp: number | undefined): string {
    if (!timestamp) return 'Never'

    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 60) {
        return minutes <= 1 ? '1 minute ago' : `${minutes} minutes ago`
    } else if (hours < 24) {
        return hours === 1 ? '1 hour ago' : `${hours} hours ago`
    } else {
        return days === 1 ? '1 day ago' : `${days} days ago`
    }
}

interface DeckCardProps {
    deck: {
        _id: Id<'SlideDeckTable'>
        projectId: string
        title?: string
        lastModified?: number
        _creationTime: number
    }
    onDelete: (deckId: Id<'SlideDeckTable'>) => void
    onRename: (deckId: Id<'SlideDeckTable'>, newTitle: string) => void
}

function DeckCard({ deck, onDelete, onRename }: DeckCardProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [editTitle, setEditTitle] = useState(deck.title || 'Untitled deck')
    const [showMenu, setShowMenu] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false)
            }
        }

        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside)
            return () => document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [showMenu])

    const handleRename = () => {
        if (editTitle.trim() && editTitle !== deck.title) {
            onRename(deck._id, editTitle.trim())
        }
        setIsEditing(false)
        setShowMenu(false)
    }

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this presentation?')) {
            onDelete(deck._id)
        }
        setShowMenu(false)
    }

    return (
        <div className="group relative bg-card border rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:border-primary/20">
            <Link href={`/editor/${deck.projectId}`} className="block">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            {isEditing ? (
                                <Input
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    onBlur={handleRename}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleRename()
                                        if (e.key === 'Escape') {
                                            setEditTitle(deck.title || 'Untitled deck')
                                            setIsEditing(false)
                                        }
                                    }}
                                    className="font-semibold text-lg"
                                    autoFocus
                                    onClick={(e) => e.preventDefault()}
                                />
                            ) : (
                                <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                                    {deck.title || 'Untitled deck'}
                                </h3>
                            )}
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                                <Calendar className="w-4 h-4" />
                                <span>Edited {formatTimeAgo(deck.lastModified || deck._creationTime)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Link>

            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="relative" ref={menuRef}>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                            e.preventDefault()
                            setShowMenu(!showMenu)
                        }}
                        className="h-8 w-8"
                    >
                        <MoreVertical className="w-4 h-4" />
                    </Button>

                    {showMenu && (
                        <div className="absolute right-0 top-full mt-1 bg-popover border rounded-lg shadow-lg py-1 z-10 min-w-[140px]">
                            <button
                                onClick={(e) => {
                                    e.preventDefault()
                                    setIsEditing(true)
                                    setShowMenu(false)
                                }}
                                className="flex items-center space-x-2 w-full px-3 py-2 text-sm hover:bg-accent"
                            >
                                <Edit2 className="w-4 h-4" />
                                <span>Rename</span>
                            </button>
                            <button
                                onClick={(e) => {
                                    e.preventDefault()
                                    handleDelete()
                                }}
                                className="flex items-center space-x-2 w-full px-3 py-2 text-sm hover:bg-accent text-destructive"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span>Delete</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function DecksPage() {
    const { userDetail } = useUserDetail()
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState('')
    const decks = useQuery(api.slideDeck.ListDecksByUser, userDetail ? { uid: userDetail._id } : 'skip')
    const deleteDeck = useMutation(api.slideDeck.DeleteDeck)
    const renameDeck = useMutation(api.slideDeck.RenameDeck)

    const generateId = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2)}_${Date.now()}`

    const handleNewPresentation = () => {
        const newId = generateId('project')
        router.push(`/editor/${newId}`)
    }

    const handleDelete = async (deckId: Id<'SlideDeckTable'>) => {
        if (!userDetail) return
        try {
            await deleteDeck({ deckId, uid: userDetail._id })
        } catch (error) {
            console.error('Failed to delete deck:', error)
        }
    }

    const handleRename = async (deckId: Id<'SlideDeckTable'>, newTitle: string) => {
        if (!userDetail) return
        try {
            await renameDeck({ deckId, uid: userDetail._id, newTitle })
        } catch (error) {
            console.error('Failed to rename deck:', error)
        }
    }

    if (!userDetail) return null

    const filteredDecks = decks?.filter(deck =>
        (deck.title || 'Untitled deck').toLowerCase().includes(searchQuery.toLowerCase())
    ) || []

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">My Presentations</h1>
                        <p className="text-muted-foreground mt-1">
                            {decks?.length ? `${decks.length} presentation${decks.length === 1 ? '' : 's'}` : 'No presentations yet'}
                        </p>
                    </div>
                    <Button onClick={handleNewPresentation} className="flex items-center space-x-2">
                        <Plus className="w-4 h-4" />
                        <span>New Presentation</span>
                    </Button>
                </div>

                {/* Search Bar */}
                {decks && decks.length > 0 && (
                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                            placeholder="Search presentations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                )}

                {/* Content */}
                {!decks?.length ? (
                    <div className="text-center py-16">
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FileText className="w-12 h-12 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">No presentations yet</h3>
                        <p className="text-muted-foreground mb-6">Create your first presentation to get started</p>
                        <Button onClick={handleNewPresentation} className="flex items-center space-x-2">
                            <Plus className="w-4 h-4" />
                            <span>Create Presentation</span>
                        </Button>
                    </div>
                ) : filteredDecks.length === 0 ? (
                    <div className="text-center py-16">
                        <h3 className="text-xl font-semibold text-foreground mb-2">No presentations found</h3>
                        <p className="text-muted-foreground">Try adjusting your search query</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredDecks.map((deck) => (
                            <DeckCard
                                key={deck._id}
                                deck={deck}
                                onDelete={handleDelete}
                                onRename={handleRename}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}


