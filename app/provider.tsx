'use client'
import React, { useEffect, useState } from 'react'
import { useContext } from 'react';
import Header from './_components/Header';
import { api } from '@/convex/_generated/api';
import { useMutation } from 'convex/react';
import { useUser } from '@clerk/nextjs';
import { UserDetailContext } from '@/context/UserDetailContext';
import { ProjectContextType, ProjectDetailContext, ProjectInfo } from '@/context/ProjectDetailContext';





function Provider({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {

    const CreateUser = useMutation(api.user.CreateNewUser)
    const [userDetail, setUserDetail] = useState<any>(null);
    const [projectDetailInfo, setProjectDetailInfo] = useState<ProjectInfo | null>(null);
    const [isGeneratingProject, setIsGeneratingProject] = useState<boolean>(false);
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
            // Save New User if Not Exist 
        });
        setUserDetail(result)
    }

    return (
        <UserDetailContext.Provider value={{ userDetail, setUserDetail }}>
            <ProjectDetailContext.Provider value={{ projectDetailInfo, setProjectDetailInfo, isGeneratingProject, setIsGeneratingProject }}>
                {children}
            </ProjectDetailContext.Provider>
        </UserDetailContext.Provider>
    )
}

export default Provider

export const useUserDetail = () => {
    return useContext(UserDetailContext);
}

export const useProjectDetail = (): ProjectContextType | undefined => {
    return useContext(ProjectDetailContext);
}