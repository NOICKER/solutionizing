"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { testerBodyFont, testerDisplayFont } from "@/components/tester/testerTheme";
import { useAppState } from "@/context/AppStateContext";
import { testerMatchOffer } from "@/data/testerExperience";

interface MatchingModalProps {
  readonly className?: string;
}

export function MatchingModal({ className }: Readonly<MatchingModalProps>) {
  const router = useRouter();
  const { state, acceptMissionOffer, passOnMissionOffer } = useAppState();
  const countdown = state.ui.matchingCountdown ?? 0;

  const countdownLabel = useMemo(() => {
    const minutes = Math.floor(countdown / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (countdown % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [countdown]);

  return (
    <div className={`${testerBodyFont.className} w-full max-w-2xl ${className ?? ""}`.trim()}>
      <div className="relative overflow-hidden rounded-[2rem] border border-white bg-white shadow-tester-modal">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-tester-apricot/15 blur-3xl" />
        <div className="px-8 pb-8 pt-7 sm:px-10 sm:pb-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-tester-terracotta/12 text-tester-terracotta">
                <span className="material-symbols-outlined text-3xl">handshake</span>
              </div>
              <div>
                <div className={`${testerDisplayFont.className} text-3xl font-extrabold tracking-tight text-tester-sage`}>
                  {testerMatchOffer.eyebrow}
                </div>
                <div className="mt-1 text-sm font-semibold text-tester-muted">
                  {testerMatchOffer.subtitle}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={passOnMissionOffer}
              className="flex h-10 w-10 items-center justify-center rounded-full text-tester-muted transition-colors hover:bg-tester-cream hover:text-tester-ink"
              aria-label="Close mission offer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-tester-terracotta/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-tester-terracotta">
              <span className="material-symbols-outlined text-sm">schedule</span>
              3 minutes
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-tester-sage/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-tester-sage">
              <span className="material-symbols-outlined text-sm">verified</span>
              Founder verified
            </div>
          </div>

          <div className="mt-7 rounded-[1.6rem] border border-tester-sage/10 bg-tester-sage-soft px-6 py-6">
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-tester-sage">
              <span className="material-symbols-outlined text-base">psychology</span>
              Why you were matched
            </div>
            <div className="mt-5 space-y-4">
              {testerMatchOffer.reasons.map((reason) => (
                <div key={reason.title} className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-tester-sage shadow-sm">
                    <span className="material-symbols-outlined text-base">{reason.icon}</span>
                  </div>
                  <div>
                    <div className="text-base font-extrabold text-tester-sage">{reason.title}</div>
                    <div className="text-sm text-tester-muted">{reason.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <h2 className={`${testerDisplayFont.className} text-2xl font-extrabold tracking-tight text-tester-sage`}>
              {testerMatchOffer.title}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-tester-muted">
              {testerMatchOffer.summary}
            </p>
          </div>

          <div className="mt-8 space-y-4">
            <button
              type="button"
              onClick={() => {
                acceptMissionOffer();
                router.push("/tester/workspace");
              }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-tester-terracotta px-6 py-4 text-lg font-extrabold text-white shadow-tester-modal transition-all hover:bg-tester-terracotta-dark hover:-translate-y-0.5"
            >
              Accept Mission
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>

            <div className="flex items-center justify-between gap-4 px-2">
              <button
                type="button"
                onClick={passOnMissionOffer}
                className="text-sm font-extrabold text-tester-muted transition-colors hover:text-tester-sage"
              >
                Pass for now
              </button>
              <div className="inline-flex items-center gap-2 text-sm text-tester-muted">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-tester-apricot bg-white text-xs font-black text-tester-terracotta">
                  {countdownLabel}
                </div>
                <span>Soft-lock active</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-tester-beige bg-tester-cream/60 px-8 py-4 text-center text-[11px] font-black uppercase tracking-[0.18em] text-tester-muted sm:px-10">
          Explainability and trust over random assignment
        </div>
      </div>
    </div>
  );
}
