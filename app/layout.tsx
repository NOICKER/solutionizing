import type { Metadata } from "next";
import { Fraunces, DM_Mono } from 'next/font/google';
import "./globals.css";
import ConditionalCursor from "@/components/solutionizing/ConditionalCursor";
import { AuthProvider } from "@/context/AuthContext";
import { AppStateProvider } from "@/context/AppStateContext";
import { Toaster } from "@/components/ui/sonner";
import PostHogProvider from "@/providers/PostHogProvider";
import { CookieConsent } from "@/components/solutionizing/CookieConsent";
import FeedbackWidget from "@/components/feedback/FeedbackWidget";
import { DevToolbar } from "@/components/dev/DevToolbar";

const materialSymbolsHref =
  "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap";

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
  display: 'swap',
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-dm-mono',
  display: 'swap',
});

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
    <html lang="en" className={`dark ${fraunces.variable} ${dmMono.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,100..900;1,9..144,100..900&family=DM+Mono:ital,wght@0,400;0,500&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-bg text-ink">
        <ConditionalCursor />
        <PostHogProvider>
          <AuthProvider>
            <AppStateProvider>
              {children}
              <CookieConsent />
              <FeedbackWidget />
              <Toaster />
              {process.env.NODE_ENV === 'development' && <DevToolbar />}
            </AppStateProvider>
          </AuthProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
