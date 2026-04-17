"use client";

import { AuthActionLink } from "@/components/AuthActionLink";

export function LandingPageHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-secondary/20 bg-neutral-bg/90 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg border border-primary bg-primary text-white shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-xl sm:text-2xl font-bold">analytics</span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-text-main">
            Solutionizing
          </h2>
        </div>

        <nav className="hidden items-center gap-8 md:flex">
          <a className="text-sm font-bold text-text-main transition-colors hover:text-primary" href="#product">Product</a>
          <a className="text-sm font-bold text-text-main transition-colors hover:text-primary" href="#methodology">Methodology</a>
          <a className="text-sm font-bold text-text-main transition-colors hover:text-primary" href="#testers">Testers</a>
          <a className="text-sm font-bold text-text-main transition-colors hover:text-primary" href="#pricing">Pricing</a>
        </nav>

        <div className="flex items-center gap-2 sm:gap-4">
          <AuthActionLink authedHref="/dashboard/founder" role="founder" mode="signin" className="hidden px-4 py-2 text-sm font-extrabold text-text-main transition-colors hover:text-primary lg:block">
            Sign In
          </AuthActionLink>
          <AuthActionLink authedHref="/dashboard/founder" role="founder" mode="signin" className="rounded-xl border border-primary bg-primary px-4 sm:px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-cta-orange transition-all hover:bg-primary-hover">
            Start
          </AuthActionLink>
        </div>
      </div>
    </header>
  );
}
