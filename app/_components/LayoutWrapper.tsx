'use client'

import { useUser } from "@clerk/nextjs";
import AppSidebar from "./Sidebar";
import Header from "./Header";
import TestPanel from "./TestPanel";
import AIChatPanel from "./AIChatPanel";
import PersistentChatPanel from "./PersistentChatPanel";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { createContext, useContext, useState } from "react";

// Create a context to track if sidebar is available
const SidebarAvailableContext = createContext<{ hasSidebar: boolean }>({ hasSidebar: false });

export const useSidebarAvailable = () => useContext(SidebarAvailableContext);

export default function LayoutWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isSignedIn, isLoaded } = useUser();
    const [isTestPanelOpen, setIsTestPanelOpen] = useState(false);
    const [isAIChatOpen, setIsAIChatOpen] = useState(false);
    const [isPersistentChatOpen, setIsPersistentChatOpen] = useState(false);

    const toggleTestPanel = () => {
        setIsTestPanelOpen(!isTestPanelOpen);
    };

    const toggleAIChat = () => {
        setIsAIChatOpen(!isAIChatOpen);
    };

    const togglePersistentChat = () => {
        setIsPersistentChatOpen(!isPersistentChatOpen);
    };

    // Show loading state while Clerk is loading
    if (!isLoaded) {
        return (
            <SidebarAvailableContext.Provider value={{ hasSidebar: false }}>
                <div className="min-h-screen">
                    <Header
                        onToggleAIChat={toggleAIChat}
                        onTogglePersistentChat={togglePersistentChat}
                    />
                    <div className="flex-1">
                        {children}
                    </div>
                    <AIChatPanel
                        isOpen={isAIChatOpen}
                        onClose={() => setIsAIChatOpen(false)}
                        isTestPanelOpen={isPersistentChatOpen || isTestPanelOpen}
                    />
                    <PersistentChatPanel
                        isOpen={isPersistentChatOpen}
                        onClose={() => setIsPersistentChatOpen(false)}
                        isTestPanelOpen={isAIChatOpen || isTestPanelOpen}
                    />
                </div>
            </SidebarAvailableContext.Provider>
        );
    }

    // If user is signed in, show layout with sidebar
    if (isSignedIn) {
        return (
            <SidebarAvailableContext.Provider value={{ hasSidebar: true }}>
                <SidebarProvider>
                    <AppSidebar />
                    <SidebarInset className="overflow-hidden">
                        <Header
                            onToggleTestPanel={toggleTestPanel}
                            onToggleAIChat={toggleAIChat}
                            onTogglePersistentChat={togglePersistentChat}
                        />
                        <div className={`flex-1 overflow-auto transition-all duration-300 ${
                            // Calculate margin based on number of open panels
                            (() => {
                                const openPanels = [isTestPanelOpen, isAIChatOpen, isPersistentChatOpen].filter(Boolean).length;
                                if (openPanels >= 3) return 'mr-[72rem]'; // 3 * 24rem
                                if (openPanels === 2) return 'mr-[48rem]'; // 2 * 24rem  
                                if (openPanels === 1) return 'mr-96'; // 24rem
                                return 'mr-0';
                            })()
                            }`}>
                            {children}
                        </div>
                    </SidebarInset>
                    <AIChatPanel
                        isOpen={isAIChatOpen}
                        onClose={() => setIsAIChatOpen(false)}
                        isTestPanelOpen={isPersistentChatOpen || isTestPanelOpen}
                    />
                    <PersistentChatPanel
                        isOpen={isPersistentChatOpen}
                        onClose={() => setIsPersistentChatOpen(false)}
                        isTestPanelOpen={isAIChatOpen || isTestPanelOpen}
                    />
                    <TestPanel isOpen={isTestPanelOpen} onClose={() => setIsTestPanelOpen(false)} />
                </SidebarProvider>
            </SidebarAvailableContext.Provider>
        );
    }

    // If user is not signed in, show layout without sidebar
    return (
        <SidebarAvailableContext.Provider value={{ hasSidebar: false }}>
            <div className="min-h-screen">
                <Header
                    onToggleTestPanel={toggleTestPanel}
                    onToggleAIChat={toggleAIChat}
                    onTogglePersistentChat={togglePersistentChat}
                />
                <div className={`flex-1 transition-all duration-300 ${
                    // Calculate margin based on number of open panels
                    (() => {
                        const openPanels = [isTestPanelOpen, isAIChatOpen, isPersistentChatOpen].filter(Boolean).length;
                        if (openPanels >= 3) return 'mr-[72rem]'; // 3 * 24rem
                        if (openPanels === 2) return 'mr-[48rem]'; // 2 * 24rem  
                        if (openPanels === 1) return 'mr-96'; // 24rem
                        return 'mr-0';
                    })()
                    }`}>
                    {children}
                </div>
                <AIChatPanel
                    isOpen={isAIChatOpen}
                    onClose={() => setIsAIChatOpen(false)}
                    isTestPanelOpen={isPersistentChatOpen || isTestPanelOpen}
                />
                <PersistentChatPanel
                    isOpen={isPersistentChatOpen}
                    onClose={() => setIsPersistentChatOpen(false)}
                    isTestPanelOpen={isAIChatOpen || isTestPanelOpen}
                />
                <TestPanel isOpen={isTestPanelOpen} onClose={() => setIsTestPanelOpen(false)} />
            </div>
        </SidebarAvailableContext.Provider>
    );
}
