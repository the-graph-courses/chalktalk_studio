'use client'

import { Globe2, Presentation } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useTripDetail } from '@/app/provider'
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
    const { setTripDetailInfo } = useTripDetail() || { setTripDetailInfo: () => { } }

    const handleCreateNewTrip = () => {
        if (!user) {
            router.push('/sign-in')
            return
        }
        // Clear any existing trip data when creating a new trip
        setTripDetailInfo(null)
        router.push('/create-new-trip')
    }

    const handleMyTrips = () => {
        if (!user) {
            router.push('/sign-in')
            return
        }
        router.push('/trips')
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
                                <SidebarMenuButton onClick={handleCreateNewTrip} tooltip="Create New Trip">
                                    <Globe2 className="text-blue-400" />
                                    <span>Create New Trip</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton onClick={() => router.push('/editor')} tooltip="New Slide Deck">
                                    <Presentation className="text-yellow-400" />
                                    <span>New Slide Deck</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton onClick={handleMyTrips} tooltip="My Trips">
                                    <Globe2 className="text-green-400" />
                                    <span>My Trips</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}
