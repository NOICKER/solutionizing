"use client";

import Link from "next/link";
import { AuthActionLink } from "@/components/AuthActionLink";
import { TesterBrand } from "@/components/tester/TesterBrand";
import { testerBodyFont, testerDisplayFont } from "@/components/tester/testerTheme";
import { testerOnboardingSteps } from "@/data/testerExperience";

interface TesterOnboardingProps {
  readonly showSignIn?: boolean;
}

export function TesterOnboarding({ showSignIn = true }: Readonly<TesterOnboardingProps>) {
  return (
    <main className={`${testerBodyFont.className} min-h-screen bg-tester-cream text-tester-ink`}>
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
        <TesterBrand />
        <div className="flex items-center gap-3 text-sm font-bold text-tester-muted">
          <Link href="/contact" className="hidden transition-colors hover:text-tester-terracotta sm:inline-flex">
            Help Center
          </Link>
          {showSignIn ? (
            <Link
              href="/auth?mode=signin&role=tester&next=%2Fdashboard%2Ftester"
              className="rounded-full border border-tester-beige bg-white px-5 py-2.5 text-tester-ink shadow-sm transition-colors hover:bg-tester-beige/40"
            >
              Sign In
            </Link>
          ) : null}
        </div>
      </nav>

      <section className="mx-auto flex max-w-6xl flex-col items-center px-6 pb-20 pt-6 text-center lg:px-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-tester-sage/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-tester-sage">
          <span className="material-symbols-outlined text-sm">handshake</span>
          Tester onboarding
        </div>

        <h1 className={`${testerDisplayFont.className} mt-7 max-w-3xl text-5xl font-extrabold tracking-tight text-tester-sage sm:text-6xl`}>
          How Matches Work
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-relaxed text-tester-muted sm:text-xl">
          We do not ask testers to hunt for gigs. We match your perspective to founders
          who need exactly that kind of context, then reserve the mission for you.
        </p>

        <div className="relative mt-12 w-full max-w-xl overflow-visible rounded-[3rem] border border-white bg-white p-10 shadow-tester-soft">
          <div className="absolute right-4 top-0 h-20 w-20 rounded-full bg-tester-apricot/20 blur-2xl" />
          <div className="absolute bottom-6 left-6 h-24 w-24 rounded-full bg-tester-sage/10 blur-2xl" />

          <div className="relative flex aspect-square flex-col items-center justify-center rounded-[2.5rem] border border-tester-beige bg-gradient-to-br from-white via-white to-tester-cream/70 px-10">
            <div className="flex h-28 w-28 rotate-45 items-center justify-center rounded-[2rem] bg-tester-terracotta shadow-[0_18px_40px_rgba(217,119,87,0.25)]">
              <span className="material-symbols-outlined -rotate-45 text-6xl text-white">psychology_alt</span>
            </div>
            <div className="mt-12 flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-tester-apricot/70 text-white shadow-sm">
                <span className="material-symbols-outlined text-lg">person</span>
              </div>
              <div className="h-1 w-16 rounded-full bg-tester-beige">
                <div className="h-full w-2/3 rounded-full bg-tester-sage" />
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-tester-sage text-white shadow-sm">
                <span className="material-symbols-outlined text-lg">rocket_launch</span>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-4 right-6 flex items-center gap-3 rounded-[1.4rem] border border-tester-beige bg-white px-4 py-3 text-left shadow-[0_20px_35px_rgba(45,42,38,0.12)]">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <span className="material-symbols-outlined text-lg">verified</span>
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-[0.18em] text-tester-ink">No competition</div>
              <div className="text-[11px] text-tester-muted">A mission is reserved for you.</div>
            </div>
          </div>
        </div>

        <div id="matching-details" className="relative mt-20 grid w-full gap-8 border-t border-tester-beige pt-8 md:grid-cols-4 md:pt-0">
          <div className="pointer-events-none absolute left-0 right-0 top-7 hidden h-px bg-tester-beige md:block" />
          {testerOnboardingSteps.map((step) => (
            <article key={step.title} className="relative flex flex-col items-center px-4 text-center">
              <div className="z-10 flex h-14 w-14 items-center justify-center rounded-full border-2 border-tester-apricot bg-white text-tester-terracotta shadow-sm">
                <span className="material-symbols-outlined text-xl">{step.icon}</span>
              </div>
              <h2 className={`${testerDisplayFont.className} mt-5 text-xl font-bold text-tester-sage`}>
                {step.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-tester-muted">{step.body}</p>
            </article>
          ))}
        </div>

        <div className="mt-16 w-full max-w-4xl rounded-[2.5rem] border border-white bg-[#efe9dc] px-8 py-12 shadow-tester-soft sm:px-12">
          <h3 className={`${testerDisplayFont.className} text-3xl font-extrabold tracking-tight text-tester-sage`}>
            Ready to enter the eligibility pool?
          </h3>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-tester-muted sm:text-lg">
            Complete your tester profile so we can start looking for missions that match
            your background, device setup, and the way you explain product decisions.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <AuthActionLink
              authedHref="/dashboard/tester"
              role="tester"
              mode="signup"
              className="inline-flex rounded-full bg-tester-terracotta px-8 py-4 text-base font-extrabold text-white shadow-tester-modal transition-all hover:bg-tester-terracotta-dark hover:-translate-y-0.5"
            >
              Complete My Profile
            </AuthActionLink>
            <a
              href="#matching-details"
              className="inline-flex rounded-full border border-tester-beige bg-white px-8 py-4 text-base font-bold text-tester-sage transition-colors hover:bg-tester-beige/40"
            >
              Learn More
            </a>
          </div>
          <p className="mt-6 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-tester-muted">
            <span className="material-symbols-outlined text-sm">shield</span>
            Your data is safe and only used for matching.
          </p>
        </div>

        <div id="matching-details" className="sr-only">
          Matching details anchor
        </div>

        <footer className="mt-20 text-xs font-black uppercase tracking-[0.22em] text-tester-muted/70">
          Solutionizing 2024
        </footer>
      </section>
    </main>
  );
}

