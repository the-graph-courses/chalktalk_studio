'use client'

import { useUser } from "@clerk/nextjs";
import AppSidebar from "./Sidebar";
import Header from "./Header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { createContext, useContext } from "react";

// Create a context to track if sidebar is available
const SidebarAvailableContext = createContext<{ hasSidebar: boolean }>({ hasSidebar: false });

export const useSidebarAvailable = () => useContext(SidebarAvailableContext);

export default function LayoutWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isSignedIn, isLoaded } = useUser();

    // Show loading state while Clerk is loading
    if (!isLoaded) {
        return (
            <SidebarAvailableContext.Provider value={{ hasSidebar: false }}>
                <div className="min-h-screen">
                    <Header />
                    <div className="flex-1">
                        {children}
                    </div>
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
                        <Header />
                        <div className="flex-1 overflow-auto">
                            {children}
                        </div>
                    </SidebarInset>
                </SidebarProvider>
            </SidebarAvailableContext.Provider>
        );
    }

    // If user is not signed in, show layout without sidebar
    return (
        <SidebarAvailableContext.Provider value={{ hasSidebar: false }}>
            <div className="min-h-screen">
                <Header />
                <div className="flex-1">
                    {children}
                </div>
            </div>
        </SidebarAvailableContext.Provider>
    );
}
