'use client';
import './globals.css';
import Provider from './provider';
import { ClerkProvider } from '@clerk/nextjs';
import { ConvexClientProvider } from './ConvexClientProvider';
import LayoutWrapper from './_components/LayoutWrapper';
import { usePathname } from 'next/navigation';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isPresentMode = pathname?.startsWith('/present/');
  const isPresentVoiceMode = pathname?.startsWith('/present-voice/');

  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`font-sans ${isPresentMode || isPresentVoiceMode ? 'present-mode' : ''}`}
          suppressHydrationWarning
        >
          <ConvexClientProvider>
            <Provider>
              <LayoutWrapper>{children}</LayoutWrapper>
            </Provider>
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
