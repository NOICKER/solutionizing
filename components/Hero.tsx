import Link from "next/link";

export function Hero() {
  return (
    <section className="border-b border-border-subtle/70 bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 pb-16 pt-12 md:flex-row md:items-center md:pt-16">
        <div className="flex-1 space-y-6">
          <div className="pill-muted w-max">A structured way to de-risk UX bets</div>
          <div className="space-y-4">
            <h1 className="text-balance text-4xl font-semibold tracking-tight text-text-main md:text-5xl">
              Turn Uncertainty Into Decisions
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-text-muted">
              Run structured 2-4 minute tests with assigned testers selected for fit,
              not speed. See signal in minutes without guessing which feedback to trust.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link href="/dashboard/founder" className="btn-primary">
              Launch your mission
            </Link>
            <Link href="#workflow" className="btn-secondary-muted">
              See how it works
            </Link>
          </div>
          <div className="flex items-center gap-3 pt-3 text-xs text-text-muted">
            <div className="inline-flex items-center gap-1 rounded-full bg-surface-elevated px-3 py-1 shadow-card-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span>Assigned testers, not anonymous clicks</span>
            </div>
            <span>Structured in 3-5 prompts - No setup</span>
          </div>
        </div>
        <div className="flex-1">
          <div className="relative">
            <div className="absolute -inset-10 -z-10 rounded-[2.5rem] bg-gradient-to-br from-panel-dark/4 via-primary/5 to-panel-dark-soft/2 blur-2xl" />
            <div className="surface-card relative overflow-hidden rounded-[2.25rem] border border-border-subtle/80 shadow-card">
              <div className="flex items-center justify-between border-b border-border-subtle/70 bg-surface-elevated px-5 py-3">
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-xl bg-primary/10 text-[0.7rem] font-semibold text-primary">
                    HQ
                  </span>
                  <div>
                    <div className="font-medium text-text-main">Homepage usability - Live</div>
                    <div className="text-[0.7rem]">3 testers in session</div>
                  </div>
                </div>
                <div className="rounded-full bg-background px-3 py-1 text-[0.65rem] font-medium text-text-muted">
                  2-4 min / tester
                </div>
              </div>
              <div className="grid gap-4 px-5 pb-4 pt-4 md:grid-cols-[1.1fr,0.9fr]">
                <div className="space-y-3">
                  <div className="pill-muted w-max text-[0.65rem]">Active missions</div>
                  <div className="space-y-2 rounded-2xl bg-surface-elevated/80 p-3 shadow-card-soft">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-medium text-text-main">Pricing clarity checkout</span>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.65rem] font-semibold text-primary">
                        Matching slower than avg
                      </span>
                    </div>
                    <div className="mt-1 flex items-end justify-between gap-3">
                      <div className="relative h-10 flex-1 overflow-hidden rounded-xl bg-background">
                        <div className="absolute inset-0 flex items-end gap-1 px-1 pb-1">
                          {Array.from({ length: 10 }).map((_, i) => (
                            <div
                              // eslint-disable-next-line react/no-array-index-key
                              key={i}
                              className="flex-1 rounded-full bg-primary/15"
                              style={{ height: `${40 + (i % 3) * 15}%` }}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1 text-[0.65rem] text-text-muted">
                        <div className="flex items-center justify-between gap-4">
                          <span>Clarity score</span>
                          <span className="font-semibold text-text-main">92</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span>Time to match</span>
                          <span>~ 11 min</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-dashed border-border-subtle/90 bg-background px-4 py-3 text-xs text-text-muted">
                    <div className="mb-1 flex items-center justify-between">
                      <span>Upcoming tests</span>
                      <span className="rounded-full bg-surface-elevated px-2 py-0.5 text-[0.65rem]">Queue - 3</span>
                    </div>
                    <p>Line up your next 2-3 questions before you run the session.</p>
                  </div>
                </div>
                <div className="space-y-3 rounded-2xl bg-panel-dark text-white shadow-card">
                  <div className="border-b border-white/6 px-4 pb-2 pt-3 text-xs">
                    <div className="heading-eyebrow text-[0.6rem] text-white/50">SYNTHESIZED INSIGHT</div>
                    <div className="mt-1 text-[0.9rem] font-medium">
                      &quot;Testers could not tell if &quot;Scale&quot; or &quot;Studio&quot; was meant for them.&quot;
                    </div>
                  </div>
                  <div className="space-y-3 px-4 pb-4 pt-1 text-[0.7rem] text-white/80">
                    <div className="flex items-center justify-between gap-4">
                      <span>Signals surfaced</span>
                      <span className="rounded-full bg-white/6 px-2 py-0.5 text-[0.65rem]">7 critical - 4 neutral</span>
                    </div>
                    <div className="h-16 rounded-xl bg-panel-dark-soft/80">
                      <div className="flex h-full items-center justify-center text-[0.65rem] text-white/55">
                        Cognitive load trace - 2:14 -&gt; 0:41
                      </div>
                    </div>
                    <div className="space-y-1 text-[0.65rem]">
                      <div className="flex items-center justify-between">
                        <span>Confidence to ship</span>
                        <span className="font-semibold text-white">84%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-white/10">
                        <div className="h-full w-[84%] rounded-full bg-primary" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
