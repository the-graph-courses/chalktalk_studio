'use client'

import { useUser } from "@clerk/nextjs";
import AppSidebar from "./Sidebar";
import Header from "./Header";
import TestPanel from "./TestPanel";
import EphemeralChatPanel from "@/app/_components/EphemeralChatPanel";
import SlideThumbnailPanel from "./SlideThumbnailPanel";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { createContext, useContext, useState } from "react";
import { useParams, usePathname } from 'next/navigation';
import { FEATURES } from '@/lib/feature-flags';

const SidebarAvailableContext = createContext<{ hasSidebar: boolean }>({ hasSidebar: false });

export const useSidebarAvailable = () => useContext(SidebarAvailableContext);

export const PanelControlsContext = createContext<{
    isSignedIn: boolean;
    isAIChatOpen: boolean;
    isTestPanelOpen: boolean;
    toggleAIChat: () => void;
    toggleTestPanel: () => void;
    isThumbnailPanelOpen: boolean;
    toggleThumbnailPanel: () => void;
}>({
    isSignedIn: false,
    isAIChatOpen: false,
    isTestPanelOpen: false,
    toggleAIChat: () => { },
    toggleTestPanel: () => { },
    isThumbnailPanelOpen: true,
    toggleThumbnailPanel: () => { },
});

export const usePanelControls = () => useContext(PanelControlsContext);

export default function LayoutWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isSignedIn, isLoaded } = useUser();
    const params = useParams();
    const pathname = usePathname();
    const projectId = params.projectId;

    // Check if we're in present mode
    const isPresentMode = pathname?.startsWith('/present/');

    const [isTestPanelOpen, setIsTestPanelOpen] = useState(false);
    const [isAIChatOpen, setIsAIChatOpen] = useState(false);
    const [isThumbnailPanelOpen, setIsThumbnailPanelOpen] = useState<boolean>(FEATURES.THUMBNAIL_PANEL);

    const toggleTestPanel = () => {
        setIsTestPanelOpen(prev => !prev);
        if (!isTestPanelOpen) setIsAIChatOpen(false);
    };

    const toggleAIChat = () => {
        setIsAIChatOpen(prev => !prev);
        if (!isAIChatOpen) setIsTestPanelOpen(false);
    };

    const toggleThumbnailPanel = () => {
        // Only allow toggling if the feature is enabled
        if (FEATURES.THUMBNAIL_PANEL) {
            setIsThumbnailPanelOpen(prev => !prev);
        }
    };

    // If in present mode, render without any layout wrapper
    if (isPresentMode) {
        return (
            <SidebarAvailableContext.Provider value={{ hasSidebar: false }}>
                <PanelControlsContext.Provider value={{
                    isSignedIn: isSignedIn || false,
                    isAIChatOpen: false,
                    isTestPanelOpen: false,
                    toggleAIChat: () => { },
                    toggleTestPanel: () => { },
                    isThumbnailPanelOpen: FEATURES.THUMBNAIL_PANEL,
                    toggleThumbnailPanel: () => { },
                }}>
                    {children}
                </PanelControlsContext.Provider>
            </SidebarAvailableContext.Provider>
        );
    }

    if (!isLoaded) {
        return (
            <SidebarAvailableContext.Provider value={{ hasSidebar: false }}>
                <PanelControlsContext.Provider value={{
                    isSignedIn: false,
                    isAIChatOpen,
                    isTestPanelOpen,
                    toggleAIChat,
                    toggleTestPanel,
                    isThumbnailPanelOpen: true,
                    toggleThumbnailPanel: () => { },
                }}>
                    <div className="min-h-screen">
                        <Header
                            onToggleAIChat={toggleAIChat}
                        />
                        <div className="flex-1">
                            {children}
                        </div>
                        {projectId && (
                            <>
                                <EphemeralChatPanel
                                    isOpen={isAIChatOpen}
                                    onClose={() => setIsAIChatOpen(false)}
                                    isTestPanelOpen={isTestPanelOpen}
                                />
                            </>
                        )}
                    </div>
                </PanelControlsContext.Provider>
            </SidebarAvailableContext.Provider>
        );
    }

    if (isSignedIn) {
        return (
            <SidebarAvailableContext.Provider value={{ hasSidebar: true }}>
                <PanelControlsContext.Provider value={{
                    isSignedIn,
                    isAIChatOpen,
                    isTestPanelOpen,
                    toggleAIChat,
                    toggleTestPanel,
                    isThumbnailPanelOpen,
                    toggleThumbnailPanel,
                }}>
                    <SidebarProvider defaultOpen={false}>
                        <AppSidebar />
                        <SidebarInset className="overflow-hidden flex flex-col">
                            <div className="flex-1 relative">
                                <div className={`h-full transition-all duration-300 ${(() => {
                                    const openPanels = [isTestPanelOpen, isAIChatOpen].filter(Boolean).length;
                                    if (openPanels >= 2) return 'mr-[48rem]';
                                    if (openPanels === 1) return 'mr-96';
                                    return 'mr-0';
                                })()
                                    }`}>
                                    {children}
                                </div>
                            </div>

                            <div className="flex-shrink-0">
                                {projectId && isThumbnailPanelOpen && (
                                    <SlideThumbnailPanel />
                                )}
                            </div>
                            {projectId && (
                                <>
                                    <EphemeralChatPanel
                                        isOpen={isAIChatOpen}
                                        onClose={() => setIsAIChatOpen(false)}
                                        isTestPanelOpen={isTestPanelOpen}
                                    />
                                    <TestPanel isOpen={isTestPanelOpen} onClose={() => setIsTestPanelOpen(false)} />
                                </>
                            )}
                        </SidebarInset>
                    </SidebarProvider>
                </PanelControlsContext.Provider>
            </SidebarAvailableContext.Provider>
        );
    }

    return (
        <SidebarAvailableContext.Provider value={{ hasSidebar: false }}>
            <PanelControlsContext.Provider value={{
                isSignedIn: false,
                isAIChatOpen,
                isTestPanelOpen,
                toggleAIChat,
                toggleTestPanel,
                isThumbnailPanelOpen: FEATURES.THUMBNAIL_PANEL, // Controlled by feature flag
                toggleThumbnailPanel: () => { }, // No-op for non-sidebar layout
            }}>
                <div className="min-h-screen flex flex-col">
                    <Header
                        onToggleTestPanel={toggleTestPanel}
                        onToggleAIChat={projectId ? toggleAIChat : undefined}
                    />
                    <div className="flex-1 relative">
                        <div className={`h-full transition-all duration-300 ${(() => {
                            const openPanels = [isTestPanelOpen, isAIChatOpen].filter(Boolean).length;
                            if (openPanels >= 2) return 'mr-[48rem]';
                            if (openPanels === 1) return 'mr-96';
                            return 'mr-0';
                        })()
                            }`}>
                            {children}
                        </div>
                    </div>

                    {/* Thumbnail Panel - TEMPORARILY DISABLED for debugging */}
                    {FEATURES.THUMBNAIL_PANEL && (
                        <div className="flex-shrink-0">
                            {projectId && (
                                <SlideThumbnailPanel />
                            )}
                        </div>
                    )}

                    {projectId && (
                        <>
                            <EphemeralChatPanel
                                isOpen={isAIChatOpen}
                                onClose={() => setIsAIChatOpen(false)}
                                isTestPanelOpen={isTestPanelOpen}
                            />
                            <TestPanel isOpen={isTestPanelOpen} onClose={() => setIsTestPanelOpen(false)} />
                        </>
                    )}
                </div>
            </PanelControlsContext.Provider>
        </SidebarAvailableContext.Provider>
    );
}
