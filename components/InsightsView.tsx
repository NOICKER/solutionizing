"use client";

export function InsightsView() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="heading-eyebrow">Mission insights</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-text-main">Homepage usability - synthesis</h1>
        </div>
        <div className="pill-muted text-xs">3 testers - 2-4 minutes each</div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.6fr,1fr]">
        <section className="surface-card flex flex-col gap-5 p-6 text-sm">
          <header className="border-b border-border-subtle/70 pb-4">
            <div className="mb-2 text-sm font-semibold text-text-main">Synthesis</div>
            <p className="text-sm leading-relaxed text-text-muted">
              We clustered the feedback into a few clear patterns so you can see where the homepage is doing work and where it is leaking attention.
            </p>
          </header>
          <div className="grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl bg-background px-4 py-4">
              <div className="mb-2 text-sm font-semibold text-text-main">Signal - plan comprehension</div>
              <p className="text-sm leading-relaxed text-text-muted">
                Testers found pricing quickly but struggled to map plan names to their own company size. The word &quot;Scale&quot; read as too advanced for early teams.
              </p>
            </article>
            <article className="rounded-2xl bg-background px-4 py-4">
              <div className="mb-2 text-sm font-semibold text-text-main">Signal - navigation clarity</div>
              <p className="text-sm leading-relaxed text-text-muted">
                People scanned the hero and primary CTA first, then looked for a pricing label in the top nav. Renaming the item to &quot;Plans and pricing&quot; removed the last bit of guesswork.
              </p>
            </article>
          </div>
          <article className="rounded-2xl bg-surface-elevated px-4 py-4 text-sm text-text-muted">
            <div className="mb-2 text-sm font-semibold text-text-main">Recommendation</div>
            <p className="leading-relaxed">
              Rename &quot;Scale&quot; to a more outcome-oriented label such as &quot;Growing teams&quot; and add a one-line fit description in the card. That keeps early teams from self-excluding based on the name alone.
            </p>
          </article>
        </section>
        <aside className="space-y-4 text-sm">
          <section className="surface-card p-5">
            <div className="mb-3 text-sm font-semibold text-text-main">Timeline</div>
            <ul className="list-disc space-y-2 pl-5 text-sm text-text-muted">
              <li>First tester match in 9 minutes</li>
              <li>All sessions completed in 46 minutes</li>
              <li>Synthesis generated in under 3 minutes</li>
            </ul>
          </section>
          <section className="surface-card p-5">
            <div className="mb-3 text-sm font-semibold text-text-main">Export options</div>
            <p className="text-sm leading-relaxed text-text-muted">
              Copy the summary into your PRD, share a read-only link with stakeholders, or attach it directly to design review notes.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
