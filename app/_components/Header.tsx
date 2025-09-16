"use client"
import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { SignInButton, UserButton, useUser } from '@clerk/nextjs'
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useSidebarAvailable } from './LayoutWrapper'
import { Settings, Bot, Zap, FileSliders } from 'lucide-react'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

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

type HeaderProps = {
    onToggleTestPanel?: () => void;
    onToggleAIChat?: () => void;
}

export default function Header({ onToggleTestPanel, onToggleAIChat }: HeaderProps) {
    const { isSignedIn } = useUser();
    const { hasSidebar } = useSidebarAvailable();

    return (
        <TooltipProvider>
            <header className="flex h-16 items-center justify-between gap-4 border-b border-border bg-background dark:bg-gray-600 text-foreground px-4 md:px-6 flex-shrink-0 z-50">
                <div className="flex items-center gap-2">
                    {hasSidebar && <SidebarTrigger />}
                    <Link
                        href={isSignedIn ? "/decks" : "/"}
                        className="flex items-center gap-2 font-semibold"
                    >
                        <span className="">Chalktalk Studio</span>
                    </Link>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                    {onToggleAIChat && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onToggleAIChat}
                                    title="Toggle AI Chat"
                                    className="hidden md:flex"
                                >
                                    <Zap className="size-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Toggle AI Chat</p>
                            </TooltipContent>
                        </Tooltip>
                    )}

                    {isSignedIn && onToggleTestPanel && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onToggleTestPanel}
                                    title="Toggle AI Tests Panel"
                                    className="hidden md:flex"
                                >
                                    <Settings className="size-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Toggle AI Tests Panel</p>
                            </TooltipContent>
                        </Tooltip>
                    )}

                    {isSignedIn ? (
                        <UserButton afterSignOutUrl="/" />
                    ) : (
                        <div className="flex items-center gap-2">
                            <Button asChild variant="outline" size="sm">
                                <Link href="/sign-in">Login</Link>
                            </Button>
                            <Button asChild size="sm">
                                <Link href="/sign-up">Sign up</Link>
                            </Button>
                        </div>
                    )}
                </div>
            </header>
        </TooltipProvider>
    )
}