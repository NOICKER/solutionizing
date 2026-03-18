"use client";

import { testerBodyFont, testerDisplayFont } from "@/components/tester/testerTheme";
import { useAppState } from "@/context/AppStateContext";
import { testerDepthExamples } from "@/data/testerExperience";

interface ReputationModalProps {
  readonly className?: string;
}

export function ReputationModal({ className }: Readonly<ReputationModalProps>) {
  const { state, resolveReputationResubmission } = useAppState();
  const { tester } = state;
  const delta = Math.max(0, tester.previousScore - tester.score);

  return (
    <div className={`${testerBodyFont.className} w-full max-w-5xl ${className ?? ""}`.trim()}>
      <div className="overflow-hidden rounded-panel border border-white/70 bg-white/90 shadow-[0_28px_60px_rgba(45,42,38,0.16)] backdrop-blur-md">
        <div className="bg-gradient-to-r from-tester-apricot/10 via-transparent to-tester-sage/10 px-8 py-8 sm:px-10 sm:py-10 lg:px-12">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-tester-terracotta/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-tester-terracotta">
                <span className="material-symbols-outlined text-sm">trending_up</span>
                Growth opportunity
              </div>
              <h2 className={`${testerDisplayFont.className} mt-5 text-4xl font-extrabold tracking-tight text-tester-sage`}>
                Refining Your Feedback
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-tester-muted">
                Your latest mission was marked as <strong className="text-tester-ink">Low Depth</strong>.
                Here is how to turn that into a stronger response next time.
              </p>
            </div>

            <div className="w-full max-w-[260px] rounded-card border border-tester-beige bg-white p-5 shadow-tester-soft">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-tester-muted">
                  Reputation
                </span>
                <span className="text-xs font-black text-amber-600">-{delta.toFixed(1)} pts</span>
              </div>
              <div className="mt-5 flex items-end gap-2">
                <span className={`${testerDisplayFont.className} text-5xl font-extrabold leading-none text-tester-sage`}>
                  {(tester.score / 10).toFixed(1)}
                </span>
                <span className="pb-2 text-sm font-bold text-tester-muted">/ 100</span>
              </div>
              <div className="mt-5 grid grid-cols-5 gap-1.5">
                {[8, 10, 11, 12, 9].map((height, index) => (
                  <div
                    key={height}
                    className={`rounded-t-sm ${index === 4 ? "bg-tester-terracotta/25" : "bg-tester-sage/12"}`}
                    style={{ height: `${height * 4}px` }}
                  />
                ))}
              </div>
              <p className="mt-4 text-center text-xs leading-relaxed text-tester-muted">
                Slight dip, but you are still in the top tier pool.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <section className="rounded-[1.75rem] border-2 border-dashed border-tester-beige bg-[#fbf7f1] p-6">
              <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-tester-muted">
                <span className="material-symbols-outlined text-sm">sentiment_neutral</span>
                Low depth
              </div>
              <blockquote className="mt-5 rounded-[1.2rem] border border-white/70 bg-white/70 px-4 py-4 text-sm italic leading-relaxed text-tester-muted">
                {testerDepthExamples.lowDepth}
              </blockquote>
              <p className="mt-4 text-xs leading-relaxed text-tester-muted">
                This lacks specific details about why it was confusing and which parts of the UI felt off.
              </p>
            </section>

            <section className="relative rounded-[1.75rem] border border-tester-sage/15 bg-tester-sage-soft p-6">
              <div className="absolute -right-3 -top-3 flex h-9 w-9 items-center justify-center rounded-full bg-tester-sage text-white shadow-lg">
                <span className="material-symbols-outlined text-sm">check</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-tester-sage">
                <span className="material-symbols-outlined text-sm">stars</span>
                Great insight
              </div>
              <blockquote className="mt-5 rounded-[1.2rem] border border-white bg-white px-4 py-4 text-sm leading-relaxed text-tester-ink shadow-sm">
                {testerDepthExamples.greatInsight}
              </blockquote>
              <p className="mt-4 text-xs leading-relaxed text-tester-sage/85">
                Founders value device context, concrete friction, and a suggested change they can act on.
              </p>
            </section>
          </div>

          <div className="mt-10 border-t border-tester-beige pt-8 text-center">
            <p className="mx-auto max-w-xl text-base leading-relaxed text-tester-muted">
              High-quality feedback increases your chance of being matched with higher-value missions.
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <button
                type="button"
                onClick={() => resolveReputationResubmission(true)}
                className="rounded-full bg-tester-sage px-8 py-4 text-base font-extrabold text-white shadow-[0_18px_35px_rgba(74,124,117,0.25)] transition-all hover:-translate-y-0.5 hover:bg-[#3f6d67]"
              >
                Got it, I&apos;ll be more detailed
              </button>
              <button
                type="button"
                onClick={() => resolveReputationResubmission(false)}
                className="rounded-full px-6 py-4 text-base font-bold text-tester-muted transition-colors hover:text-tester-ink"
              >
                View Reputation Guide
              </button>
            </div>
          </div>
        </div>
        <div className="h-2 w-full bg-gradient-to-r from-tester-apricot via-tester-terracotta to-tester-sage opacity-35" />
      </div>
    </div>
  );
}
