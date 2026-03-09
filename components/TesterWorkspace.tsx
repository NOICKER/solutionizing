"use client";

import { testerBodyFont, testerDisplayFont } from "@/components/tester/testerTheme";
import { useAppState } from "@/context/AppStateContext";
import { testerDepthExamples, testerWorkspacePrompts } from "@/data/testerExperience";
import { useTesterWorkspace } from "@/hooks/useTesterWorkspace";

interface TesterWorkspaceProps {
  readonly className?: string;
}

export function TesterWorkspace({ className }: Readonly<TesterWorkspaceProps>) {
  const { state } = useAppState();
  const { feedback, feedbackLength, canSubmit, handleSubmit, setFeedback } = useTesterWorkspace();

  const activeMission = state.missions.find((mission) => mission.status === "active") ?? state.missions[0];

  return (
    <main className={`${testerBodyFont.className} min-h-screen bg-tester-cream px-6 py-8 text-tester-ink ${className ?? ""}`.trim()}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-tester-sage/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-tester-sage">
              <span className="material-symbols-outlined text-sm">edit_note</span>
              Guided tester mission
            </div>
            <h1 className={`${testerDisplayFont.className} mt-4 text-4xl font-extrabold tracking-tight text-tester-sage sm:text-5xl`}>
              {activeMission?.name ?? "Homepage Usability"}
            </h1>
            <p className="mt-3 max-w-3xl text-lg leading-relaxed text-tester-muted">
              {testerWorkspacePrompts.task}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-full bg-white px-4 py-2 text-sm font-bold text-tester-terracotta shadow-sm">
              Approx. 3 minutes
            </div>
            <div className="rounded-full bg-tester-sage/10 px-4 py-2 text-sm font-bold text-tester-sage">
              Reputation-sensitive review
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_360px]">
          <section className="rounded-[2rem] border border-white bg-white p-7 shadow-tester-soft sm:p-8">
            <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[1.5rem] bg-tester-cream p-5">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-tester-muted">
                  Mission prompt
                </div>
                <p className="mt-3 text-base leading-relaxed text-tester-ink">
                  {testerWorkspacePrompts.prompt}
                </p>
                <div className="mt-5 rounded-[1.25rem] border border-tester-beige bg-white px-4 py-4 text-sm leading-relaxed text-tester-muted">
                  <strong className="text-tester-ink">What founders need:</strong> one clear
                  moment of confusion, the copy or layout that caused it, and what you thought
                  would happen next.
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-tester-beige bg-[#f7f2ea] p-5">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-tester-muted">
                  Good response ingredients
                </div>
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-tester-ink">
                  {testerWorkspacePrompts.coaching.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-tester-terracotta" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <label className="block">
                <span className="mb-3 block text-lg font-extrabold text-tester-ink">
                  Your feedback
                </span>
                <textarea
                  value={feedback}
                  onChange={(event) => setFeedback(event.target.value)}
                  rows={8}
                  placeholder="Describe the exact moment you hesitated, what you re-read, and the change you would make."
                  className="w-full rounded-[1.5rem] border border-tester-beige bg-[#fcfaf7] px-5 py-4 text-base leading-relaxed text-tester-ink outline-none transition focus-visible:border-tester-terracotta focus-visible:ring-2 focus-visible:ring-tester-terracotta/25"
                />
              </label>

              <div className="flex flex-col gap-4 rounded-[1.5rem] border border-tester-beige bg-[#f7f2ea] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-bold text-tester-ink">Depth target</div>
                  <div className="mt-1 text-sm text-tester-muted">
                    Aim for at least 120 characters and include one specific example.
                  </div>
                </div>
                <div className={`text-sm font-extrabold ${canSubmit ? "text-tester-sage" : "text-tester-terracotta"}`}>
                  {feedbackLength} / 120 characters
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  className="rounded-full border border-tester-beige bg-white px-6 py-3 text-sm font-bold text-tester-muted transition-colors hover:bg-tester-beige/35"
                  onClick={() => setFeedback(testerDepthExamples.greatInsight)}
                >
                  Load high-depth example
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-tester-terracotta px-7 py-3 text-sm font-extrabold text-white shadow-tester-modal transition-all hover:bg-tester-terracotta-dark hover:-translate-y-0.5"
                >
                  Submit Feedback
                </button>
              </div>
            </form>
          </section>

          <aside className="space-y-5">
            <section className="rounded-[1.75rem] border border-white bg-white p-6 shadow-tester-soft">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-tester-muted">
                Low depth example
              </div>
              <blockquote className="mt-4 rounded-[1.25rem] border border-dashed border-tester-beige bg-[#f8f3ec] px-4 py-4 text-sm italic leading-relaxed text-tester-muted">
                {testerDepthExamples.lowDepth}
              </blockquote>
              <p className="mt-3 text-xs leading-relaxed text-tester-muted">
                This is too vague. It names a feeling, but not the exact part of the flow that caused it.
              </p>
            </section>

            <section className="rounded-[1.75rem] border border-tester-sage/10 bg-tester-sage-soft p-6 shadow-sm">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-tester-sage">
                Great insight example
              </div>
              <blockquote className="mt-4 rounded-[1.25rem] border border-white bg-white px-4 py-4 text-sm leading-relaxed text-tester-ink shadow-sm">
                {testerDepthExamples.greatInsight}
              </blockquote>
              <p className="mt-3 text-xs leading-relaxed text-tester-sage/80">
                Device, specific friction, and a suggested change make the feedback much more useful.
              </p>
            </section>

            <section className="rounded-[1.75rem] border border-tester-beige bg-[#f5eee4] p-6">
              <div className="text-sm font-extrabold text-tester-ink">Reputation reminder</div>
              <p className="mt-3 text-sm leading-relaxed text-tester-muted">
                Your score improves when founders mark responses as decision-moving: detailed,
                honest, and grounded in the actual interface.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
