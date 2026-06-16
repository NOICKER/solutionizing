"use client";

import { useAppState } from "@/context/AppStateContext";

export function SafetyModal() {
  const { state, resolveSafetyUpdate } = useAppState();
  const question = state.ui.safetyFlaggedQuestion ?? "";

  const suggestion =
    "Ask testers how they would expect to contact you or what would make them comfortable reaching out, without asking them to share personal details.";

  return (
    <div className="surface-card max-w-md rounded-2xl bg-[var(--cream)] p-5 shadow-card-soft">
      <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">
        SAFETY REVIEW
      </div>
      <h2 className="mb-2 text-base font-semibold tracking-tight text-[var(--ink)]">
        We noticed a small safety concern
      </h2>
      <p className="mb-3 text-xs leading-relaxed text-[var(--ink-soft)]">
        To keep testers safe and focused on the product, we flag prompts that ask for
        personal contact details. Here&apos;s what we caught.
      </p>
      <div className="mb-3 space-y-2 rounded-2xl bg-[var(--bg)] px-3 py-3 text-[0.7rem] text-[var(--ink-soft)]">
        <div className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">
          Flagged question
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--cream)] px-3 py-2 text-xs text-[var(--ink)]">
          {question || "Can you share your email or phone so we can follow up?"}
        </div>
      </div>
      <div className="mb-4 space-y-2 rounded-2xl bg-[var(--cream)] px-3 py-3 text-[0.7rem] text-[var(--ink-soft)]">
        <div className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]">
          Safer alternative
        </div>
        <div className="rounded-xl bg-[var(--bg)] px-3 py-2 text-xs text-[var(--ink)]">
          {suggestion}
        </div>
        <p className="text-[0.65rem]">
          You can still learn how testers expect to stay in touch without collecting any
          personal contact information.
        </p>
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          className="btn-secondary-muted justify-center text-[0.75rem] cursor-none"
          onClick={resolveSafetyUpdate}
        >
          I&apos;ll revise later
        </button>
        <button
          type="button"
          className="btn-primary justify-center text-[0.75rem] cursor-none"
          onClick={resolveSafetyUpdate}
        >
          Update &amp; resubmit
        </button>
      </div>
    </div>
  );
}
