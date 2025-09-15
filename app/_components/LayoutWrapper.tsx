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

const SidebarAvailableContext = createContext<{ hasSidebar: boolean }>({ hasSidebar: false });

export const useSidebarAvailable = () => useContext(SidebarAvailableContext);

type PanelControls = {
    isSignedIn: boolean;
    isAIChatOpen: boolean;
    isTestPanelOpen: boolean;
    toggleAIChat: () => void;
    toggleTestPanel: () => void;
};

const PanelControlsContext = createContext<PanelControls>({
    isSignedIn: false,
    isAIChatOpen: false,
    isTestPanelOpen: false,
    toggleAIChat: () => { },
    toggleTestPanel: () => { },
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

    const toggleTestPanel = () => {
        setIsTestPanelOpen(!isTestPanelOpen);
    };

    const toggleAIChat = () => {
        setIsAIChatOpen(!isAIChatOpen);
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
                }}>
                    <SidebarProvider>
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
                                {projectId && (
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

                    <div className="flex-shrink-0">
                        {projectId && (
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
                </div>
            </PanelControlsContext.Provider>
        </SidebarAvailableContext.Provider>
    );
}
