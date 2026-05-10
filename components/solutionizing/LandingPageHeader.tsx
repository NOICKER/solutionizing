"use client";

import { AuthActionLink } from "@/components/AuthActionLink";
import { useState } from "react";

export function LandingPageHeader() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const navLinks = [
    { href: "#product", label: "Product" },
    { href: "#methodology", label: "Methodology" },
    { href: "#testers", label: "Testers" },
    { href: "#pricing", label: "Pricing" }
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-secondary/20 bg-neutral-bg/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-20 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg overflow-hidden sm:h-10 sm:w-10">
              <img src="/logo-icon.png" alt="Solutionizing" className="h-9 w-9 sm:h-10 sm:w-10 object-cover" />
            </div>
            <h2 className="text-lg font-extrabold tracking-tight text-text-main sm:text-xl">
              Solutionizing
            </h2>
          </div>

          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <a key={link.href} className="text-sm font-bold text-text-main transition-colors hover:text-primary" href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-secondary/30 text-text-main transition-colors hover:border-primary/50 hover:text-primary md:hidden"
              aria-expanded={isMobileNavOpen}
              aria-label={isMobileNavOpen ? "Close navigation menu" : "Open navigation menu"}
              onClick={() => setIsMobileNavOpen((currentValue) => !currentValue)}
            >
              <span className="material-symbols-outlined text-[22px]">
                {isMobileNavOpen ? "close" : "menu"}
              </span>
            </button>
            <AuthActionLink authedHref="/dashboard/founder" role="founder" mode="signin" className="hidden px-4 py-2 text-sm font-extrabold text-text-main transition-colors hover:text-primary lg:block">
              Sign In
            </AuthActionLink>
            <AuthActionLink authedHref="/dashboard/founder" role="founder" mode="signup" className="rounded-xl border border-primary bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-cta-orange transition-all hover:bg-primary-hover sm:px-6 sm:text-sm">
              Start
            </AuthActionLink>
          </div>
        </div>

        {isMobileNavOpen ? (
          <nav className="flex flex-col gap-2 border-t border-secondary/20 py-4 md:hidden">
            {navLinks.map((link) => (
              <a
                key={link.href}
                className="rounded-2xl px-3 py-3 text-sm font-bold text-text-main transition-colors hover:bg-secondary/15 hover:text-primary"
                href={link.href}
                onClick={() => setIsMobileNavOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </nav>
        ) : null}
      </div>
    </header>
  );
}
