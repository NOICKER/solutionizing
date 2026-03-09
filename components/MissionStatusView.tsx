"use client";

import { TesterBrand } from "@/components/tester/TesterBrand";
import { testerBodyFont, testerDisplayFont } from "@/components/tester/testerTheme";
import { founderMissionStatus } from "@/data/testerExperience";

interface MissionStatusViewProps {
  readonly className?: string;
}

const sparklineBars = [20, 35, 25, 15, 10, 12, 8, 5, 15, 20, 18, 22, 14, 10, 7, 9, 11, 13, 8, 6, 4, 5, 7, 10];

export function MissionStatusView({ className }: Readonly<MissionStatusViewProps>) {
  const progress = (founderMissionStatus.joined / founderMissionStatus.target) * 100;

  return (
    <main className={`${testerBodyFont.className} min-h-screen bg-tester-cream px-6 py-6 text-tester-ink ${className ?? ""}`.trim()}>
      <nav className="mx-auto flex max-w-7xl items-center justify-between border-b border-tester-beige/70 py-4">
        <TesterBrand />
        <div className="flex items-center gap-3 text-sm font-bold text-tester-muted">
          <div className="rounded-full bg-white px-4 py-2">Founder Dashboard</div>
          <a
            href="/dashboard/founder"
            className="rounded-full border border-tester-beige bg-white px-5 py-2.5 shadow-sm transition-colors hover:bg-tester-beige/35"
          >
            Logout
          </a>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl gap-8 pb-14 pt-10 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          <header>
            <h1 className={`${testerDisplayFont.className} text-4xl font-extrabold tracking-tight text-tester-sage`}>
              Mission: Mobile App Usability
            </h1>
            <p className="mt-2 text-lg text-tester-muted">A calm look at how your mission is gathering momentum.</p>
          </header>

          <section className="rounded-[2rem] border border-white bg-white p-8 shadow-tester-soft">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.18em] text-tester-muted">
                  Current matching
                </div>
                <div className="mt-4 flex items-end gap-2">
                  <span className={`${testerDisplayFont.className} text-6xl font-extrabold leading-none text-tester-sage`}>
                    {founderMissionStatus.joined}
                  </span>
                  <span className="pb-2 text-2xl text-tester-muted">/ {founderMissionStatus.target} testers joined</span>
                </div>
              </div>
              <div className="grid gap-3 rounded-[1.25rem] bg-[#f5f1e8] p-4 text-right sm:grid-cols-2">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.18em] text-tester-muted">Time elapsed</div>
                  <div className="mt-1 text-xl font-extrabold text-tester-ink">{founderMissionStatus.elapsed}</div>
                </div>
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.18em] text-tester-muted">Avg. match speed</div>
                  <div className="mt-1 text-xl font-extrabold text-tester-ink">{founderMissionStatus.avgSpeed}</div>
                </div>
              </div>
            </div>

            <div className="mt-10 h-4 rounded-full bg-[#ece4d7]">
              <div className="h-full rounded-full bg-tester-sage" style={{ width: `${progress}%` }} />
            </div>

            <div className="mt-10 border-t border-tester-beige pt-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-tester-sage">Matching Velocity</h2>
                  <p className="mt-2 text-sm text-tester-muted">Tester discovery rate over the last 12 hours</p>
                </div>
                <span className="material-symbols-outlined text-tester-sage/60">query_stats</span>
              </div>

              <div className="mt-8 flex items-end gap-[3px]">
                {sparklineBars.map((height, index) => (
                  <div
                    key={height + index}
                    className={`rounded-t-sm ${index === sparklineBars.length - 1 ? "w-10 border border-dashed border-tester-sage bg-tester-sage/20" : "w-2 bg-tester-sage"}`}
                    style={{ height: `${Math.max(height, 4)}%`, minHeight: 8 }}
                  />
                ))}
              </div>
              <div className="mt-3 flex justify-between text-[11px] font-black uppercase tracking-[0.18em] text-tester-muted">
                <span>Launch</span>
                <span>Now</span>
              </div>
            </div>
          </section>

          <div className="flex items-start gap-3 rounded-[1.25rem] border border-tester-sage/10 bg-tester-sage/8 px-4 py-4 text-sm leading-relaxed text-tester-sage">
            <span className="material-symbols-outlined mt-0.5">info</span>
            <p>{founderMissionStatus.note}</p>
          </div>
        </div>

        <aside>
          <section className="sticky top-8 rounded-[2rem] border border-white bg-[#f2eee5] p-8 shadow-tester-soft">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-tester-apricot/20 text-tester-terracotta">
              <span className="material-symbols-outlined">lightbulb</span>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-tester-sage">Need a boost?</h2>
            <p className="mt-4 text-sm leading-relaxed text-tester-muted">
              Specific questions attract testers much faster. Your current speed suggests some people may be unsure whether they fit your criteria.
            </p>
            <ul className="mt-6 space-y-4 text-sm font-bold text-tester-ink">
              <li className="flex gap-3">
                <span className="material-symbols-outlined text-base text-tester-sage">check_circle</span>
                Clarify your target audience
              </li>
              <li className="flex gap-3">
                <span className="material-symbols-outlined text-base text-tester-sage">check_circle</span>
                Break down complex questions
              </li>
            </ul>
            <a
              href="/mission/wizard"
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-tester-terracotta px-6 py-4 text-base font-extrabold text-white shadow-tester-modal transition-all hover:bg-tester-terracotta-dark hover:-translate-y-0.5"
            >
              <span className="material-symbols-outlined text-sm">edit_note</span>
              Clarity Review
            </a>
            <p className="mt-6 text-center text-xs italic text-tester-muted">
              &quot;Transparency is the foundation of great feedback.&quot;
            </p>
          </section>
        </aside>
      </section>
    </main>
  );
}
