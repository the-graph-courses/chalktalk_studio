'use client'

import { useUser } from "@clerk/nextjs";
import AppSidebar from "./Sidebar";
import Header from "./Header";
import TestPanel from "./TestPanel";
import EphemeralChatPanel from "@/app/_components/EphemeralChatPanel";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { createContext, useContext, useState } from "react";
import { useParams, usePathname } from 'next/navigation';

const SidebarAvailableContext = createContext<{ hasSidebar: boolean }>({ hasSidebar: false });

export const useSidebarAvailable = () => useContext(SidebarAvailableContext);

export const PanelControlsContext = createContext<{
    isSignedIn: boolean;
    isAIChatOpen: boolean;
    isTestPanelOpen: boolean;
    toggleAIChat: () => void;
    toggleTestPanel: () => void;
}>({
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

    // Check if we're in present mode or editor mode
    const isPresentMode = pathname?.startsWith('/present/');
    const isEditorMode = pathname?.startsWith('/editor/');
    const isPresentVoiceMode = pathname?.startsWith('/present-voice/');

    const isDev = process.env.NODE_ENV === 'development';
    const [isTestPanelOpen, setIsTestPanelOpen] = useState(false);
    const [isAIChatOpen, setIsAIChatOpen] = useState(false);

    const toggleTestPanel = () => {
        setIsTestPanelOpen(prev => !prev);
        if (!isTestPanelOpen) setIsAIChatOpen(false);
    };

    const toggleAIChat = () => {
        setIsAIChatOpen(prev => !prev);
        if (!isAIChatOpen) setIsTestPanelOpen(false);
    };

    // If in present mode, render without any layout wrapper
    if (isPresentMode || isPresentVoiceMode) {
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
                    <SidebarProvider defaultOpen={false}>
                        <AppSidebar />
                        <SidebarInset className="overflow-hidden flex flex-col">
                            {/* Only show main Header when NOT in editor mode (editor has its own EditorHeader) */}
                            {!isEditorMode && (
                                <Header
                                    onToggleTestPanel={isDev ? toggleTestPanel : undefined}
                                    onToggleAIChat={projectId ? toggleAIChat : undefined}
                                />
                            )}
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

                            {projectId && (
                                <>
                                    <EphemeralChatPanel
                                        isOpen={isAIChatOpen}
                                        onClose={() => setIsAIChatOpen(false)}
                                        isTestPanelOpen={isTestPanelOpen}
                                    />
                                    {isDev && <TestPanel isOpen={isTestPanelOpen} onClose={() => setIsTestPanelOpen(false)} />}
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
                        onToggleTestPanel={isDev ? toggleTestPanel : undefined}
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

                    {projectId && (
                        <>
                            <EphemeralChatPanel
                                isOpen={isAIChatOpen}
                                onClose={() => setIsAIChatOpen(false)}
                                isTestPanelOpen={isTestPanelOpen}
                            />
                            {isDev && <TestPanel isOpen={isTestPanelOpen} onClose={() => setIsTestPanelOpen(false)} />}
                        </>
                    )}
                </div>
            </PanelControlsContext.Provider>
        </SidebarAvailableContext.Provider>
    );
}
