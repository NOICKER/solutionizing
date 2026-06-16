"use client";

import Image from "next/image";
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
    <header className="sticky top-0 z-50 w-full border-b border-[var(--ink)] bg-[var(--bg)]/90 backdrop-blur-md">
      <div className="mx-auto max-w-[1100px] px-4 sm:px-6">
        <div className="flex h-20 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg overflow-hidden sm:h-10 sm:w-10">
              <Image src="/logo-icon.png" alt="Solutionizing" width={40} height={40} className="h-9 w-9 sm:h-10 sm:w-10 object-cover" />
            </div>
            <h2 className="text-lg font-[family-name:var(--font-fraunces)] italic font-normal tracking-tight text-white sm:text-xl">
              Solutionizing
            </h2>
          </div>

          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <a key={link.href} className="text-[14px] font-bold text-[var(--ink-soft)] transition-colors hover:text-white cursor-none" href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--ink)] text-[var(--ink-soft)] transition-colors hover:border-[var(--ink-soft)]/50 hover:text-white md:hidden cursor-none"
              aria-expanded={isMobileNavOpen}
              aria-label={isMobileNavOpen ? "Close navigation menu" : "Open navigation menu"}
              onClick={() => setIsMobileNavOpen((currentValue) => !currentValue)}
            >
              <span className="material-symbols-outlined text-[22px]">
                {isMobileNavOpen ? "close" : "menu"}
              </span>
            </button>
            <AuthActionLink authedHref="/dashboard/founder" role="founder" mode="signin" className="hidden px-4 py-2 text-[14px] font-bold text-[var(--ink-soft)] transition-colors hover:text-white lg:block">
              Sign In
            </AuthActionLink>
            <AuthActionLink authedHref="/dashboard/founder" role="founder" mode="signup" className="rounded-xl border border-primary bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-[0_0_20px_rgba(249,124,90,0.3)] transition-all hover:shadow-[0_0_30px_rgba(249,124,90,0.6)] hover:bg-primary-hover active:scale-[0.98] sm:px-6 sm:text-sm">
              Start
            </AuthActionLink>
          </div>
        </div>

        {isMobileNavOpen ? (
          <nav className="flex flex-col gap-2 border-t border-[var(--ink)] py-4 md:hidden">
            {navLinks.map((link) => (
              <a
                key={link.href}
                className="rounded-2xl px-3 py-3 text-sm font-bold text-[var(--ink-soft)] transition-colors hover:bg-[var(--bg-light)] hover:text-white cursor-none"
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
