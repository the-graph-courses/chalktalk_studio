'use client'
import { ConvexReactClient } from 'convex/react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { useAuth } from '@clerk/nextjs';
import React, { ReactNode } from 'react'
import Provider from './provider';

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);


export function ConvexClientProvider({ children }: { children: ReactNode }) {
    return <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <Provider>
            {children}
        </Provider>
    </ConvexProviderWithClerk>;
}