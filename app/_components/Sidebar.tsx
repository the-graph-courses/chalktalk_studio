'use client'

import {
    Plus,
    FolderOpen,
    Settings,
    History,
    Star,
    Share2,
    Download,
    HelpCircle,
    Sun,
    Moon,
    Home,
    LayoutPanelTop
} from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarTrigger,
    SidebarFooter,
} from "@/components/ui/sidebar"
import { usePanelControls } from './LayoutWrapper'

export default function AppSidebar() {
    const { user } = useUser()
    const router = useRouter()
    const { theme, setTheme } = useTheme()
    const { isThumbnailPanelOpen, toggleThumbnailPanel } = usePanelControls()
    const [mounted, setMounted] = useState(false)

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true)
    }, [])

    const generateId = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2)}_${Date.now()}`

    const handleCreateNewProject = () => {
        if (!user) {
            router.push('/sign-in')
            return
        }
        const newId = generateId('project')
        router.push(`/editor/${newId}`)
    }

    const handleMyProjects = () => {
        if (!user) {
            router.push('/sign-in')
            return
        }
        router.push('/decks')
    }

    const handleHomeClick = () => {
        router.push('/')
    }

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark')
    }

    const commonIconClass = "h-5 w-5"

    return (
        <Sidebar
            collapsible="icon"
            variant="sidebar"
            className="bg-sidebar text-sidebar-foreground"
        >
            <SidebarHeader className="border-b border-sidebar-border h-14">
                <div className="flex items-center justify-center group-data-[collapsible=icon]:h-14 p-2">
                    <SidebarMenuButton
                        onClick={handleHomeClick}
                        tooltip="Go to Home"
                        className="w-full justify-center group-data-[collapsible=icon]:w-auto"
                    >
                        <Home className="h-5 w-5 text-blue-700 dark:text-blue-400" />
                        <span className="font-bold text-lg text-blue-700 dark:text-blue-400 tracking-tight group-data-[collapsible=icon]:hidden">ChalkTalk</span>
                    </SidebarMenuButton>
                </div>
            </SidebarHeader>

            <SidebarContent className="p-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={handleCreateNewProject}
                            tooltip="New Presentation"
                        >
                            <Plus className={commonIconClass} />
                            <span>New Presentation</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={handleMyProjects}
                            tooltip="My Presentations"
                        >
                            <FolderOpen className={commonIconClass} />
                            <span>My Presentations</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            tooltip="Recent"
                            disabled
                        >
                            <History className={commonIconClass} />
                            <span>Recent</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            tooltip="Starred"
                            disabled
                        >
                            <Star className={commonIconClass} />
                            <span>Starred</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={toggleThumbnailPanel}
                            tooltip={isThumbnailPanelOpen ? 'Hide Thumbnails' : 'Show Thumbnails'}
                        >
                            <LayoutPanelTop className={commonIconClass} />
                            <span>{isThumbnailPanelOpen ? 'Hide Thumbnails' : 'Show Thumbnails'}</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarContent>

            <SidebarFooter className="p-2 mt-auto">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={toggleTheme}
                            tooltip={mounted && theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        >
                            {mounted && theme === 'dark' ? (
                                <Sun className={commonIconClass} />
                            ) : (
                                <Moon className={commonIconClass} />
                            )}
                            <span>{mounted && theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            tooltip="Share"
                            disabled
                        >
                            <Share2 className={commonIconClass} />
                            <span>Share</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            tooltip="Export"
                            disabled
                        >
                            <Download className={commonIconClass} />
                            <span>Export</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            tooltip="Settings"
                            disabled
                        >
                            <Settings className={commonIconClass} />
                            <span>Settings</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            tooltip="Help"
                            disabled
                        >
                            <HelpCircle className={commonIconClass} />
                            <span>Help</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                <div className="border-t border-sidebar-border mt-2 pt-2">
                    <SidebarTrigger className="w-full" />
                </div>
            </SidebarFooter>
        </Sidebar>
    )
}
