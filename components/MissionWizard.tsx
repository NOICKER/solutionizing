"use client";

import { FormEvent, useState } from "react";
import { useAppState } from "@/context/AppStateContext";

export function MissionWizard() {
  const { triggerSafetyFlag } = useAppState();
  const [question, setQuestion] = useState(
    "Ask testers to find your pricing in under 3 seconds and share what felt unclear."
  );
  const [step, setStep] = useState<"question" | "audience" | "review">("question");

  const handleNext = (event: FormEvent) => {
    event.preventDefault();
    if (step === "question") {
      const lower = question.toLowerCase();
      if (lower.includes("email") || lower.includes("phone") || lower.includes("contact")) {
        triggerSafetyFlag(question);
        return;
      }
      setStep("audience");
    } else if (step === "audience") {
      setStep("review");
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="heading-eyebrow">New mission</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-text-main">Capture what you are trying to learn</h1>
        </div>
        <div className="pill-muted text-xs">2-4 minute tests - structured for signal</div>
      </div>
      <form onSubmit={handleNext} className="grid gap-6 lg:grid-cols-[1.55fr,0.95fr]" aria-label="Mission wizard">
        <section className="surface-card flex flex-col gap-6 p-6 text-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-text-main">
              {step === "question" ? "Mission question" : step === "audience" ? "Audience fit" : "Review"}
            </div>
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <span className={`h-2 w-2 rounded-full ${step === "question" ? "bg-primary" : "bg-border-subtle"}`} />
              <span className={`h-2 w-2 rounded-full ${step === "audience" ? "bg-primary" : "bg-border-subtle"}`} />
              <span className={`h-2 w-2 rounded-full ${step === "review" ? "bg-primary" : "bg-border-subtle"}`} />
            </div>
          </div>
          {step === "question" && (
            <>
              <p className="text-sm leading-relaxed text-text-muted">
                Describe the decision you are trying to make. Focus on one moment in the experience, not the entire product.
              </p>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-text-main">What do you want to ask?</span>
                <textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={5} className="rounded-xl border border-border-subtle bg-background px-4 py-3 text-sm text-text-main outline-none focus-visible:ring-2 focus-visible:ring-primary/50" />
                <span className="text-xs text-text-muted">Avoid asking for direct contact details such as email, phone, or social handles.</span>
              </label>
            </>
          )}
          {step === "audience" && (
            <>
              <p className="text-sm leading-relaxed text-text-muted">
                We will suggest testers who match this description and already have context from similar missions.
              </p>
              <div className="space-y-4">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-text-main">Who is this for?</span>
                  <input type="text" defaultValue="Early-stage founders evaluating pricing pages" className="rounded-xl border border-border-subtle bg-background px-4 py-3 text-sm text-text-main outline-none focus-visible:ring-2 focus-visible:ring-primary/50" />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-text-main">Device and context</span>
                  <input type="text" defaultValue="Mobile - first-time visit from a shared link" className="rounded-xl border border-border-subtle bg-background px-4 py-3 text-sm text-text-main outline-none focus-visible:ring-2 focus-visible:ring-primary/50" />
                </label>
              </div>
            </>
          )}
          {step === "review" && (
            <div className="space-y-4 text-sm text-text-muted">
              <p className="leading-relaxed">
                You are set up to run a 2-4 minute mission with assigned testers. We will hold a short safety and clarity check before sending.
              </p>
              <div className="rounded-2xl bg-background px-4 py-4">
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Summary</div>
                <ul className="list-disc space-y-2 pl-5">
                  <li>3 calibrated testers</li>
                  <li>1 primary mission question</li>
                  <li>Synthesized insight within 45-60 minutes</li>
                </ul>
              </div>
            </div>
          )}
          <div className="mt-2 flex justify-end gap-3 pt-2">
            {step !== "question" && (
              <button type="button" className="btn-secondary-muted justify-center text-sm" onClick={() => setStep(step === "review" ? "audience" : "question")}>Back</button>
            )}
            <button type="submit" className="btn-primary justify-center text-sm">{step === "review" ? "Launch mission" : "Next"}</button>
          </div>
        </section>
        <aside className="space-y-4 text-sm">
          <section className="surface-card p-5">
            <div className="mb-3 text-sm font-semibold text-text-main">Safety and signal guardrails</div>
            <p className="mb-3 text-sm leading-relaxed text-text-muted">
              We automatically review prompts for personal-data requests and weak framing so testers can stay focused on the product decision itself.
            </p>
            <ul className="list-disc space-y-2 pl-5 text-sm text-text-muted">
              <li>No email, phone, or social handles</li>
              <li>Clear time-boxed tasks</li>
              <li>One decision per mission</li>
            </ul>
          </section>
        </aside>
      </form>
    </div>
  );
}
