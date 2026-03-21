import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { AppStateProvider } from "@/context/AppStateContext";
import { Toaster } from "@/components/ui/sonner";
import PostHogProvider from "@/providers/PostHogProvider";
import { CookieConsent } from "@/components/solutionizing/CookieConsent";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope"
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
    <html lang="en" suppressHydrationWarning>
      <body className={`${manrope.variable} min-h-screen bg-neutral-bg text-text-main dark:bg-gray-900 dark:text-white`}>
        <PostHogProvider>
          <AuthProvider>
            <AppStateProvider>
              {children}
              <CookieConsent />
              <Toaster />
            </AppStateProvider>
          </AuthProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
