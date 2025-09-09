import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Provider from "./provider";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "./ConvexClientProvider";
import LayoutWrapper from "./_components/LayoutWrapper";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Chalktalk Studio",
  description: "AI-powered presentations with a human touch.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className} suppressHydrationWarning>
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
