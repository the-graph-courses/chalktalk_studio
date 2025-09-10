import type { Metadata } from "next";
import "./globals.css";
import Provider from "./provider";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "./ConvexClientProvider";
import LayoutWrapper from "./_components/LayoutWrapper";

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
        <body className="font-sans" suppressHydrationWarning>
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
