"use client"
import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { SignInButton, UserButton, useUser } from '@clerk/nextjs'
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useSidebarAvailable } from './LayoutWrapper'
import { Settings, Bot, Zap } from 'lucide-react'

const menuOptions = [
    {
        label: "Home",
        path: "/"
    },
    {
        label: "Pricing",
        path: "/pricing"
    },
    {
        label: "Contact us",
        path: "/contact-us"
    },

]

interface HeaderProps {
    onToggleTestPanel?: () => void;
    showTestPanelToggle?: boolean;
    onToggleAIChat?: () => void;
    showAIChatToggle?: boolean;
}

function Header({ onToggleTestPanel, showTestPanelToggle = true, onToggleAIChat, showAIChatToggle = true }: HeaderProps = {}) {
    const { isSignedIn } = useUser();
    const { hasSidebar } = useSidebarAvailable();

    return (
        <div className='flex justify-between items-center p-4 bg-background border-b border-border min-w-0'>
            {/* Mobile Trigger + Logo */}
            <div className='flex items-center gap-3 min-w-0'>
                {hasSidebar && <SidebarTrigger className="md:hidden" />}
                <Image src="/logo.svg" alt="logo" width={30} height={30} className="flex-shrink-0" />
                <h2 className='text-xl lg:text-2xl font-bold truncate'>ChalkTalk</h2>
            </div>
            {/* Menu Options */}
            <div className='hidden md:flex items-center gap-4 lg:gap-8 flex-shrink-0'> {menuOptions.map((menu, index) => (
                <Link href={menu.path} key={index}>
                    <h2 className='text-sm lg:text-lg hover:scale-105 transition-all hover:text-primary'> {menu.label}</h2>
                </Link>
            ))} </div>
            {/* Authentication + Panel Toggles */}
            <div className="flex items-center gap-2 flex-shrink-0">

                {/* AI Chat Toggle - only show for signed in users */}
                {isSignedIn && showAIChatToggle && onToggleAIChat && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onToggleAIChat}
                        title="Toggle AI Chat"
                        className="hidden md:flex"
                    >
                        <Zap className="size-4" />
                    </Button>
                )}

                {/* Test Panel Toggle - only show for signed in users */}
                {isSignedIn && showTestPanelToggle && onToggleTestPanel && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onToggleTestPanel}
                        title="Toggle AI Tests Panel"
                        className="hidden md:flex"
                    >
                        <Settings className="size-4" />
                    </Button>
                )}

                {isSignedIn ? (
                    <UserButton afterSignOutUrl="/" />
                ) : (
                    <SignInButton mode="modal">
                        <Button className="cursor-pointer">Get Started</Button>
                    </SignInButton>
                )}
            </div>

        </div>
    )
}

export default Header