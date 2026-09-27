'use client'
import React, { useEffect, useState, createContext, useContext } from 'react'
import Header from './_components/Header';
import { api } from '@/convex/_generated/api';
import { useConvexAuth, useMutation } from 'convex/react';
import { useUser } from '@clerk/nextjs';
import { ThemeProvider } from 'next-themes';

// Move UserDetailContext here instead of separate file
const UserDetailContext = createContext<any>(null);





function Provider({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {

    const CreateUser = useMutation(api.user.CreateNewUser)
    const [userDetail, setUserDetail] = useState<any>(null);
    const { user } = useUser();
    const { isAuthenticated } = useConvexAuth();

    useEffect(() => {
        if (!isAuthenticated || !user) return;

        let cancelled = false;
        (async () => {
            const result = await CreateUser({
                email: user.primaryEmailAddress?.emailAddress || "",
                imageUrl: user.imageUrl || "",
                name: user.fullName || "",
                clerkId: user.id,
            });
            if (!cancelled) setUserDetail(result);
        })();

        return () => {
            cancelled = true;
        };
    }, [isAuthenticated, user, CreateUser])

    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            storageKey="chalktalk-theme"
            disableTransitionOnChange
        >
            <UserDetailContext.Provider value={{ userDetail, setUserDetail }}>
                {children}
            </UserDetailContext.Provider>
        </ThemeProvider>
    )
}

export default Provider

export const useUserDetail = () => {
    return useContext(UserDetailContext);
}