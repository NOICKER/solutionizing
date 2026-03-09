import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { AppStateProvider } from "@/context/AppStateContext";
import { DevControlPanel } from "@/components/DevControlPanel";
import { ModalHost } from "@/components/modals/ModalHost";

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
    <html lang="en">
      <body className={`${manrope.variable} min-h-screen bg-neutral-bg text-text-main`}>
        <AuthProvider>
          <AppStateProvider>
            {children}
            <ModalHost />
            <DevControlPanel />
          </AppStateProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
