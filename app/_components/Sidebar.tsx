'use client'

import { Presentation } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarTrigger,
} from "@/components/ui/sidebar"

export default function AppSidebar() {
    const { user } = useUser()
    const router = useRouter()

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

    return (
        <Sidebar collapsible="icon" variant="sidebar">
            <SidebarHeader>
                <SidebarTrigger />
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton onClick={handleCreateNewProject} tooltip="Create New Presentation">
                                    <Presentation className="text-blue-400" />
                                    <span>New Presentation</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton onClick={handleMyProjects} tooltip="My Presentations">
                                    <Presentation className="text-green-400" />
                                    <span>My Presentations</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}
