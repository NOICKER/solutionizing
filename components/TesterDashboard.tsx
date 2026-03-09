"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { TesterBrand } from "@/components/tester/TesterBrand";
import { testerBodyFont, testerHeadingFont } from "@/components/tester/testerTheme";
import { useAppState } from "@/context/AppStateContext";
import { useAuth } from "@/context/AuthContext";
import { testerAchievements, testerDevices } from "@/data/testerExperience";

interface TesterDashboardProps {
  readonly className?: string;
}

export function TesterDashboard({ className }: Readonly<TesterDashboardProps>) {
  const router = useRouter();
  const { state, triggerNewMissionOffer } = useAppState();
  const { auth, signOut } = useAuth();

  const displayName = auth.user?.name ?? state.tester.name;
  const firstName = displayName.split(" ")[0] ?? "Jamie";

  return (
    <div className={`${testerBodyFont.className} min-h-screen bg-tester-cream text-tester-ink ${className ?? ""}`.trim()}>
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="flex w-full shrink-0 flex-col border-b border-tester-beige bg-[#f1ede4] lg:min-h-screen lg:w-[300px] lg:border-b-0 lg:border-r">
          <div className="p-6 lg:p-8">
            <TesterBrand />

            <div className="mt-10 space-y-8">
              <section>
                <div className="text-xs font-black uppercase tracking-[0.18em] text-tester-muted">
                  Your profile
                </div>
                <div className="mt-4 rounded-[1.4rem] bg-white p-4 shadow-tester-soft">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-tester-apricot/30 text-tester-terracotta">
                      <span className="material-symbols-outlined">person</span>
                    </div>
                    <div>
                      <div className="text-lg font-extrabold text-tester-ink">{displayName}</div>
                      <div className="text-sm text-tester-muted">Beta Enthusiast</div>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <div className="text-xs font-black uppercase tracking-[0.18em] text-tester-muted">
                  Device verification
                </div>
                <div className="mt-4 space-y-3">
                  {testerDevices.map((device) => (
                    <div
                      key={device.name}
                      className="flex items-center justify-between rounded-xl border border-white bg-white/55 px-4 py-3 text-sm"
                    >
                      <div className="flex items-center gap-3 text-tester-ink">
                        <span className="material-symbols-outlined text-base text-tester-sage">{device.icon}</span>
                        <span>{device.name}</span>
                      </div>
                      <span className="material-symbols-outlined text-base text-tester-sage">check_circle</span>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="w-full rounded-xl border border-dashed border-tester-muted/35 px-4 py-3 text-xs font-black text-tester-muted transition-colors hover:border-tester-terracotta hover:text-tester-terracotta"
                  >
                    + Verify New Device
                  </button>
                </div>
              </section>

              <section className="rounded-[1.4rem] border border-tester-sage/10 bg-tester-sage/8 px-4 py-5">
                <div className="flex items-center gap-2 text-sm font-bold text-tester-sage">
                  <span className="material-symbols-outlined text-base">shield</span>
                  Eligible for Missions
                </div>
                <p className="mt-3 text-sm leading-relaxed text-tester-muted">
                  Your profile is complete and vetted. You are now in the active testing pool.
                </p>
              </section>
            </div>
          </div>

          <div className="mt-auto border-t border-tester-beige/70 px-6 py-5 lg:px-8">
            <button
              type="button"
              onClick={() => {
                signOut();
                router.push("/");
              }}
              className="inline-flex items-center gap-2 text-sm font-bold text-tester-muted transition-colors hover:text-tester-terracotta"
            >
              <span className="material-symbols-outlined text-base">logout</span>
              Sign Out
            </button>
          </div>
        </aside>

        <main
          className="flex-1 px-6 py-8 lg:px-9 lg:py-10"
          style={{
            backgroundImage: "radial-gradient(rgba(217,119,87,0.18) 1px, transparent 1px)",
            backgroundSize: "30px 30px"
          }}
        >
          <header className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className={`${testerHeadingFont.className} text-4xl font-extrabold tracking-tight sm:text-5xl`}>
                Ready for Duty
              </h1>
              <p className="mt-3 text-lg text-tester-muted">
                Welcome back to your workspace, {firstName}. It is a quiet morning.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-3 rounded-full border border-tester-beige bg-white px-3 py-2 shadow-sm">
                <div className="relative h-8 w-14 rounded-full bg-tester-sage/20">
                  <div className="absolute left-[4px] top-[4px] h-6 w-6 rounded-full bg-tester-sage shadow-sm" />
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-black uppercase tracking-[0.18em] text-tester-sage">
                    Status
                  </div>
                  <div className="text-sm font-bold text-tester-ink">Ready for Missions</div>
                </div>
              </div>

              <Link
                href="/tester/workspace"
                className="inline-flex items-center rounded-full border border-tester-beige bg-white px-5 py-3 text-sm font-extrabold text-tester-sage shadow-sm transition-colors hover:bg-tester-beige/45"
              >
                Open mission workspace
              </Link>
            </div>
          </header>

          <div className="grid gap-8 xl:grid-cols-[340px_minmax(0,1fr)]">
            <div className="space-y-6">
              <section className="relative overflow-hidden rounded-[1.6rem] bg-tester-sage px-7 py-7 text-white shadow-[0_20px_40px_rgba(74,124,117,0.22)]">
                <div className="relative z-10">
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-white/70">
                    Reputation score
                  </div>
                  <div className="mt-5 flex items-end gap-3">
                    <span className={`${testerHeadingFont.className} text-6xl font-extrabold leading-none`}>
                      {state.tester.score}
                    </span>
                    <span className="pb-2 text-lg text-white/70">/ 1000</span>
                  </div>
                  <p className="mt-3 text-sm text-white/85">Top 5% of Solutionizing testers</p>
                  <div className="mt-6 h-2 rounded-full bg-white/20">
                    <div className="h-full w-[98%] rounded-full bg-white" />
                  </div>
                </div>
                <span className="material-symbols-outlined absolute -bottom-4 right-3 text-[120px] text-white/12">
                  workspace_premium
                </span>
              </section>

              <section className="rounded-[1.6rem] border border-white bg-white p-6 shadow-tester-soft">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-tester-muted">
                  Recent achievements
                </div>
                <div className="mt-6 space-y-5">
                  {testerAchievements.map((achievement) => (
                    <div
                      key={achievement.title}
                      className={`flex items-center gap-4 ${achievement.locked ? "opacity-45" : ""}`}
                    >
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                          achievement.locked
                            ? "bg-slate-100 text-slate-400"
                            : "bg-tester-apricot/20 text-tester-terracotta"
                        }`}
                      >
                        <span className="material-symbols-outlined text-lg">{achievement.icon}</span>
                      </div>
                      <div>
                        <div className="text-base font-extrabold text-tester-ink">{achievement.title}</div>
                        <div className="text-sm text-tester-muted">{achievement.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="mt-6 text-sm font-extrabold text-tester-sage transition-colors hover:text-tester-terracotta"
                >
                  View All Achievements
                </button>
              </section>
            </div>

            <section className="flex min-h-[560px] flex-col justify-center rounded-[2rem] border-2 border-dashed border-tester-apricot/45 bg-white px-8 py-10 text-center shadow-[0_18px_40px_rgba(45,42,38,0.05)] sm:px-12">
              <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-tester-apricot/25 text-tester-terracotta shadow-inner">
                <span className="material-symbols-outlined text-5xl">radar</span>
              </div>
              <h2 className={`${testerHeadingFont.className} mt-8 text-3xl font-extrabold tracking-tight text-tester-ink sm:text-4xl`}>
                Awaiting Your Next Mission
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-tester-muted">
                The air is calm. Our founders are currently hand-crafting new challenges.
                Keep this tab open and you will hear a soft ding when a new mission is ready.
              </p>
              <div className="mt-8 flex items-center justify-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-tester-cream px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-tester-sage shadow-sm">
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-tester-sage" />
                  Scanning for tasks
                </div>
              </div>
              <Link
                href="/tester/workspace"
                className="mx-auto mt-6 inline-flex items-center text-sm font-extrabold text-tester-terracotta underline decoration-transparent underline-offset-4 transition hover:decoration-current"
              >
                Review a sample mission while you wait
              </Link>
            </section>
          </div>

          <footer className="mt-8 rounded-[1.5rem] border border-tester-beige bg-[#f5efe5] px-6 py-5 text-sm italic text-tester-muted shadow-sm">
            <span className="mr-2 align-[-2px] text-tester-terracotta">�</span>
            <strong className="text-tester-ink">Pro Tip:</strong> Founders value detailed
            observations. Instead of saying something works, explain how it felt to use it.
          </footer>
        </main>
      </div>
    </div>
  );
}

