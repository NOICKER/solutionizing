"use client";

import { TesterBrand } from "@/components/tester/TesterBrand";
import { testerBodyFont, testerDisplayFont } from "@/components/tester/testerTheme";
import { founderSafetyReview } from "@/data/testerExperience";

interface MissionSafetyReviewProps {
  readonly className?: string;
}

export function MissionSafetyReview({ className }: Readonly<MissionSafetyReviewProps>) {
  return (
    <main className={`${testerBodyFont.className} min-h-screen bg-[#f9f1e9] px-6 py-8 text-tester-ink ${className ?? ""}`.trim()}>
      <nav className="mx-auto flex max-w-7xl items-center justify-between py-4">
        <TesterBrand />
        <div className="flex items-center gap-3 text-sm font-bold text-tester-muted">
          <a href="/terms" className="transition-colors hover:text-tester-terracotta">
            Review Policies
          </a>
          <a
            href="/dashboard/founder"
            className="rounded-full border border-tester-beige bg-white px-5 py-2.5 shadow-sm transition-colors hover:bg-tester-beige/40"
          >
            Dashboard
          </a>
        </div>
      </nav>

      <section className="mx-auto max-w-5xl pb-16 pt-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-tester-terracotta/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-tester-terracotta">
          <span className="material-symbols-outlined text-sm">shield_with_heart</span>
          Safety review feedback
        </div>
        <h1 className={`${testerDisplayFont.className} mt-7 text-4xl font-extrabold tracking-tight text-tester-sage sm:text-5xl`}>
          We noticed a small safety concern.
        </h1>
        <p className="mx-auto mt-5 max-w-3xl text-lg leading-relaxed text-tester-muted">
          This is a routine part of the process. We just need a quick adjustment so the
          mission stays safe for testers and your data remains clean.
        </p>

        <div className="mt-12 space-y-6 text-left">
          <section className="rounded-[2rem] border border-white bg-white p-8 shadow-tester-soft">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-tester-apricot/20 text-tester-terracotta">
                <span className="material-symbols-outlined">search_check</span>
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-tester-sage">What we found</h2>
                <p className="mt-2 text-sm text-tester-muted">
                  Our safety layer flagged a question that asks for personal contact information.
                </p>
              </div>
            </div>
            <div className="mt-6 rounded-[1.5rem] border-l-4 border-tester-terracotta bg-[#fbf2eb] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-tester-terracotta">
                  Question #4
                </span>
                <span className="rounded-full bg-tester-terracotta/10 px-3 py-1 text-[11px] font-black text-tester-terracotta">
                  Flagged for contact info request
                </span>
              </div>
              <div className="mt-4 rounded-[1rem] border border-white bg-white/70 px-4 py-4 font-mono text-sm text-tester-ink">
                &quot;{founderSafetyReview.question}&quot;
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-tester-sage/10 bg-[#f1eee7] p-8 shadow-sm">
            <h2 className="flex items-center gap-2 text-2xl font-extrabold text-tester-sage">
              <span className="material-symbols-outlined">lightbulb</span>
              How to fix this
            </h2>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div className="space-y-5 text-sm leading-relaxed text-tester-muted">
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tester-sage/20 font-black text-tester-sage">
                    1
                  </div>
                  <p>Remove requests for personal emails, phone numbers, or home addresses.</p>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tester-sage/20 font-black text-tester-sage">
                    2
                  </div>
                  <p>Use the built-in Reward Center to distribute discounts anonymously instead.</p>
                </div>
              </div>
              <div className="rounded-[1.5rem] border border-white bg-white p-6 shadow-sm">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-tester-sage">
                  Try this instead
                </div>
                <p className="mt-4 text-sm italic leading-relaxed text-tester-muted">
                  &quot;{founderSafetyReview.saferAlternative}&quot;
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <a
            href="/mission/wizard"
            className="rounded-full bg-tester-terracotta px-8 py-4 text-base font-extrabold text-white shadow-tester-modal transition-all hover:bg-tester-terracotta-dark hover:-translate-y-0.5"
          >
            Update and Resubmit Mission
          </a>
          <a
            href="/contact"
            className="rounded-full border border-tester-beige bg-white px-8 py-4 text-base font-bold text-tester-sage transition-colors hover:bg-tester-beige/35"
          >
            Talk to a Human
          </a>
        </div>

        <p className="mt-4 text-xs font-medium text-tester-muted">Typical re-review time: under 2 hours</p>

        <footer className="mt-20 border-t border-tester-beige pt-8 text-xs font-black uppercase tracking-[0.2em] text-tester-muted/70">
          Solutionizing 2024
        </footer>
      </section>
    </main>
  );
}
