'use client'
import React, { useEffect, useState } from 'react'
import { useContext } from 'react';
import Header from './_components/Header';
import { api } from '@/convex/_generated/api';
import { useMutation } from 'convex/react';
import { useUser } from '@clerk/nextjs';
import { UserDetailContext } from '@/context/UserDetailContext';





function Provider({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {

    const CreateUser = useMutation(api.user.CreateNewUser)
    const [userDetail, setUserDetail] = useState<any>(null);
    const { user } = useUser();

    useEffect(() => {
        if (user) {
            CreateNewUser()
        }
    }, [user])

    const CreateNewUser = async () => {
        const result = await CreateUser({
            email: user?.primaryEmailAddress?.emailAddress || "",
            imageUrl: user?.imageUrl || "",
            name: user?.fullName || "",
            clerkId: user?.id || "", // Add this
        });
        setUserDetail(result)
    }

    return (
        <UserDetailContext.Provider value={{ userDetail, setUserDetail }}>
            {children}
        </UserDetailContext.Provider>
    )
}

export default Provider

export const useUserDetail = () => {
    return useContext(UserDetailContext);
}