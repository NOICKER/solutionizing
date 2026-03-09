export function TestimonialBlock() {
  return (
    <section className="bg-background">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="panel-dark relative overflow-hidden px-6 py-7 md:px-10 md:py-9">
          <div className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full bg-primary/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 left-6 h-40 w-40 rounded-full bg-panel-dark-soft/50 blur-3xl" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl space-y-3">
              <div className="heading-eyebrow text-[0.65rem] text-white/60">CUSTOMER QUOTE</div>
              <p className="text-balance text-[0.95rem] leading-relaxed">
                &quot;Solutionizing is the only platform that gives us the confidence to
                ship. The quality of testers is high and they&apos;re calibrated to our
                context, not just generic panel tools.&quot;
              </p>
              <div className="text-xs text-white/70">
                <div className="font-semibold">Sara James - Founder</div>
                <div>Early-stage B2B SaaS</div>
              </div>
            </div>
            <div className="mt-4 flex flex-col items-start gap-2 md:mt-0 md:items-end">
              <div className="rounded-2xl bg-panel-dark-soft/80 px-4 py-3 text-xs text-white/80 shadow-card">
                <div className="mb-1 text-[0.65rem] uppercase tracking-[0.18em] text-white/45">BEFORE</div>
                <p>&quot;We were reacting to every comment instead of weighting signal.&quot;</p>
              </div>
              <div className="rounded-2xl bg-primary px-4 py-3 text-xs text-white shadow-card">
                <div className="mb-1 text-[0.65rem] uppercase tracking-[0.18em] text-white/70">AFTER</div>
                <p>&quot;Now we know exactly which 2-3 moments to fix in each release.&quot;</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
