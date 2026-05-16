import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { AppStateProvider } from "@/context/AppStateContext";
import { Toaster } from "@/components/ui/sonner";
import PostHogProvider from "@/providers/PostHogProvider";
import { CookieConsent } from "@/components/solutionizing/CookieConsent";
import { AppThemeBoundary } from "@/components/AppThemeBoundary";
import FeedbackWidget from "@/components/feedback/FeedbackWidget";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope"
});

const materialSymbolsHref =
  "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap";

export const metadata: Metadata = {
  title: "Solutionizing | Signal Over Noise",
  description: "Founders do not need more feedback, they need signal."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preload" href={materialSymbolsHref} as="style" />
        <link id="material-symbols-stylesheet" rel="stylesheet" href={materialSymbolsHref} media="print" />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "const link=document.getElementById('material-symbols-stylesheet');if(link){link.addEventListener('load',function(){this.media='all';});}",
          }}
        />
        <noscript>
          <link rel="stylesheet" href={materialSymbolsHref} />
        </noscript>
      </head>
      <body className={`${manrope.variable} min-h-screen bg-neutral-bg text-text-main dark:bg-gray-900 dark:text-white`}>
        <PostHogProvider>
          <AuthProvider>
            <AppThemeBoundary>
              <AppStateProvider>
                {children}
                <CookieConsent />
                <FeedbackWidget />
                <Toaster />
              </AppStateProvider>
            </AppThemeBoundary>
          </AuthProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
