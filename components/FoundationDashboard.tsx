"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAppState } from "@/context/AppStateContext";
import { useAuth } from "@/context/AuthContext";

interface MissionCardView {
  id: string;
  title: string;
  subtitle: string;
  statusLabel: string;
  testersLabel: string;
  progressLabel: string;
  progressValue: number;
  ctaLabel: string;
  ctaHref?: string;
}

const guideItems = [
  {
    title: "How to ask unbiased questions",
    minutes: 3,
    icon: "help"
  },
  {
    title: "Understanding your first feedback",
    minutes: 5,
    icon: "neurology"
  },
  {
    title: "Iterating on design based on data",
    minutes: 7,
    icon: "autorenew"
  }
];

const recentActivity = [
  { text: "Mission homepage approved", time: "2h ago", color: "bg-green-500" },
  { text: "New feedback received", time: "4h ago", color: "bg-primary" }
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function toMissionCards(raw: ReturnType<typeof useAppState>["state"]["missions"]): MissionCardView[] {
  const first = raw[0];
  const second = raw[1];

  return [
    {
      id: first?.id ?? "m1",
      title: first?.name ?? "Homepage Usability",
      subtitle: "Testing the new hero section clarity.",
      statusLabel: "In progress",
      testersLabel: "3/5 testers",
      progressLabel: "60%",
      progressValue: 60,
      ctaLabel: "View insights",
      ctaHref: "/mission/insights"
    },
    {
      id: second?.id ?? "m2",
      title: second?.name ?? "Pricing Clarity",
      subtitle: "Validating the freemium tier understanding.",
      statusLabel: "Just started",
      testersLabel: "1/5 testers",
      progressLabel: "20%",
      progressValue: 20,
      ctaLabel: "Waiting for data..."
    }
  ];
}

export function FounderDashboard() {
  const { state, incrementMatchingProgress } = useAppState();
  const { auth } = useAuth();
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const userName = auth.user?.name ?? "Alex Founder";
  const isDark = theme === "dark";

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("solutionizing-founder-theme");
    if (savedTheme === "dark" || savedTheme === "light") {
      setTheme(savedTheme);
      document.documentElement.style.colorScheme = savedTheme;
      return;
    }
    document.documentElement.style.colorScheme = "light";
  }, []);

  useEffect(() => {
    window.localStorage.setItem("solutionizing-founder-theme", theme);
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const matching = state.missions.find((mission) => mission.status === "matching");
      if (!matching || matching.matchingProgress >= 96) {
        return;
      }
      incrementMatchingProgress(matching.id, 2);
    }, 2500);

    return () => window.clearInterval(interval);
  }, [state.missions, incrementMatchingProgress]);

  const missionCards = useMemo(() => toMissionCards(state.missions), [state.missions]);
  const activeMissionCount = missionCards.length;
  const firstName = userName.split(" ")[0] ?? "Alex";

  return (
    <div
      className={cx(
        "min-h-screen transition-colors duration-300",
        isDark ? "bg-[#0f1312] text-[#f3efe6]" : "bg-neutral-bg text-text-main"
      )}
    >
      <header
        className={cx(
          "border-b backdrop-blur transition-colors duration-300",
          isDark ? "border-white/10 bg-[#141918]/85" : "border-secondary/15 bg-white/80"
        )}
      >
        <div className="mx-auto flex h-16 w-full max-w-[1560px] items-center justify-between px-8 xl:px-10">
          <div className="flex items-center gap-3">
            <div
              className={cx(
                "flex h-9 w-9 items-center justify-center rounded-full text-primary",
                isDark ? "bg-[#2a2f2d]" : "bg-[#f5e0d3]"
              )}
            >
              <span className="material-symbols-outlined text-lg">deployed_code</span>
            </div>
            <div className="text-xl font-extrabold tracking-tight">Solutionizing</div>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <button
              type="button"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className={cx(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                isDark
                  ? "bg-white/10 text-white hover:bg-white/15"
                  : "border border-secondary/15 bg-white text-text-main hover:bg-neutral-bg"
              )}
            >
              <span className="material-symbols-outlined text-base">
                {isDark ? "light_mode" : "dark_mode"}
              </span>
              {isDark ? "Light mode" : "Dark mode"}
            </button>
            <div
              className={cx(
                "rounded-full px-4 py-2 text-sm font-semibold",
                isDark
                  ? "bg-[#1d3b38] text-[#bce7dd]"
                  : "bg-[#e3ede9] text-[#3a7c72]"
              )}
            >
              <span className="material-symbols-outlined mr-2 align-[-2px] text-base">
                shield
              </span>
              Safety shield active
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right leading-tight">
              <div className="text-sm font-bold">{userName}</div>
              <div className={cx("text-xs font-medium", isDark ? "text-white/55" : "text-text-main/55")}>
                Pro Plan
              </div>
            </div>
            <div
              className={cx(
                "flex h-8 w-8 items-center justify-center rounded-full",
                isDark ? "bg-[#2a2f2d] text-[#d9b896]" : "bg-[#e9c7a9] text-[#6f4f35]"
              )}
            >
              <span className="material-symbols-outlined text-base">person</span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1560px] px-8 py-8 xl:px-10">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,2.4fr)_360px]">
          <section className="space-y-5">
            <div
              className={cx(
                "rounded-[2rem] border px-8 py-8 shadow-card-soft transition-colors duration-300",
                isDark ? "border-white/10 bg-[#161b19]" : "border-secondary/10 bg-[#f1ebe3]"
              )}
            >
              <div className={cx("text-sm font-black uppercase tracking-[0.18em]", isDark ? "text-[#7fa8a3]" : "text-secondary")}>
                Founder workspace
              </div>
              <h1 className="mt-3 max-w-4xl text-4xl font-extrabold leading-tight tracking-tight lg:text-[3.6rem] xl:text-[3.85rem]">
                Good morning, {firstName}. Ready to learn?
              </h1>
              <p className={cx("mt-4 max-w-3xl text-lg leading-relaxed xl:text-xl", isDark ? "text-white/68" : "text-text-main/65")}>
                You have {activeMissionCount} active missions collecting feedback right now.
              </p>
            </div>

            <div className="flex items-center justify-between px-1 pt-1">
              <h2 className="text-2xl font-extrabold tracking-tight lg:text-3xl">Active missions</h2>
              <button className="text-sm font-semibold text-primary hover:underline">View archived</button>
            </div>

            <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
              {missionCards.map((mission, index) => (
                <article
                  key={mission.id}
                  className={cx(
                    "flex flex-col rounded-[2rem] border px-5 py-5 shadow-card-soft transition-colors duration-300",
                    isDark ? "border-white/10 bg-[#161b19]" : "border-secondary/10 bg-white"
                  )}
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div
                      className={cx(
                        "flex h-9 w-9 items-center justify-center rounded-full text-primary",
                        isDark ? "bg-[#2a2f2d]" : "bg-[#f6ece5]"
                      )}
                    >
                      <span className="material-symbols-outlined text-base">
                        {index === 0 ? "web" : "tv_options_input_settings"}
                      </span>
                    </div>
                    <span className={cx(
                      "rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-widest",
                      isDark ? "bg-[#1d3b38] text-[#bce7dd]" : "bg-[#e3f0ed] text-[#3a7c72]"
                    )}>
                      {mission.statusLabel}
                    </span>
                  </div>

                  <h3 className="text-xl font-extrabold tracking-tight lg:text-[2rem]">{mission.title}</h3>
                  <p className={cx("mt-2 text-[15px] leading-relaxed lg:text-base", isDark ? "text-white/62" : "text-text-main/60")}>
                    {mission.subtitle}
                  </p>

                  <div className={cx("mt-5 flex items-center justify-between text-sm font-bold", isDark ? "text-[#8fd1c5]" : "text-[#4a716a]")}>
                    <span>{mission.testersLabel}</span>
                    <span className={isDark ? "text-white/45" : "text-text-main/50"}>{mission.progressLabel}</span>
                  </div>

                  <div className={cx("mt-2 h-2.5 w-full overflow-hidden rounded-full", isDark ? "bg-white/10" : "bg-[#ebe6df]")}>
                    <div className="h-full rounded-full bg-primary" style={{ width: `${mission.progressValue}%` }} />
                  </div>

                  <div className={cx("mt-5 border-t pt-4", isDark ? "border-white/10" : "border-[#ebe8e3]")}>
                    {mission.ctaHref ? (
                      <Link href={mission.ctaHref} className="inline-flex w-full items-center justify-center rounded-full bg-primary px-5 py-3 text-base font-extrabold text-white shadow-cta-orange">
                        {mission.ctaLabel}
                        <span className="material-symbols-outlined ml-1 text-base">arrow_forward</span>
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className={cx(
                          "w-full rounded-full px-5 py-3 text-base font-bold",
                          isDark ? "bg-white/10 text-white/88" : "bg-[#f0ece7] text-[#3c3a37]"
                        )}
                      >
                        {mission.ctaLabel}
                      </button>
                    )}
                  </div>
                </article>
              ))}

              <Link
                href="/mission/wizard"
                className={cx(
                  "grid min-h-[210px] place-items-center rounded-[2rem] border px-5 text-center transition-colors duration-300",
                  isDark
                    ? "border-dashed border-primary/50 bg-[#121715]"
                    : "border-dashed border-primary/40 bg-[#fcf8f5]"
                )}
              >
                <div>
                  <div
                    className={cx(
                      "mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full text-primary",
                      isDark ? "bg-[#2a2f2d]" : "bg-[#f5e8de]"
                    )}
                  >
                    <span className="material-symbols-outlined">add</span>
                  </div>
                  <div className="text-xl font-extrabold tracking-tight lg:text-2xl">Create new mission</div>
                  <div className={cx("mt-2 text-[15px]", isDark ? "text-white/60" : "text-text-main/60")}>
                    Validate a new idea safely
                  </div>
                </div>
              </Link>
            </div>
          </section>

          <aside className="space-y-4 xl:pt-1">
            <section
              className={cx(
                "overflow-hidden rounded-[2rem] border transition-colors duration-300",
                isDark ? "border-white/10 bg-[#161b19]" : "border-secondary/15 bg-[#f1ece3]"
              )}
            >
              <div className={cx("border-b px-5 py-4 text-lg font-extrabold", isDark ? "border-white/10 text-white" : "border-secondary/15 text-text-main")}>
                <span className="material-symbols-outlined mr-2 align-[-3px] text-lg text-primary">menu_book</span>
                Founder guide
              </div>
              <div className="space-y-4 px-5 py-4">
                {guideItems.map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <div
                      className={cx(
                        "mt-0.5 flex h-7 w-7 items-center justify-center rounded-full",
                        isDark ? "bg-white/10 text-[#9bd5ca]" : "bg-white text-[#4b6f68]"
                      )}
                    >
                      <span className="material-symbols-outlined text-base">{item.icon}</span>
                    </div>
                    <div>
                      <div className="text-base font-bold leading-tight">{item.title}</div>
                      <div className={cx("mt-1 text-[13px] font-medium", isDark ? "text-white/55" : "text-text-main/55")}>
                        {item.minutes} min read
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className={cx("relative overflow-hidden rounded-[2rem] px-5 py-5 text-white transition-colors duration-300", isDark ? "bg-[#2f5f5a]" : "bg-[#5f8f8a]")}>
              <div className="absolute right-[-26px] top-[-26px] h-20 w-20 rounded-full bg-white/10" />
              <div className="text-sm font-black uppercase tracking-widest text-[#ebd39d]">Pro tip</div>
              <p className="mt-3 text-lg font-semibold leading-snug lg:text-[1.7rem]">
                &quot;Open-ended questions reveal problems you did not know existed. Avoid
                yes/no prompts whenever possible.&quot;
              </p>
            </section>

            <section>
              <div className={cx("mb-2 px-1 text-sm font-black uppercase tracking-[0.2em]", isDark ? "text-white/40" : "text-text-main/45")}>
                Recent activity
              </div>
              <div className="space-y-2">
                {recentActivity.map((item) => (
                  <div
                    key={item.text}
                    className={cx(
                      "flex items-center justify-between rounded-full border px-4 py-2 transition-colors duration-300",
                      isDark ? "border-white/10 bg-[#161b19]" : "border-secondary/10 bg-white"
                    )}
                  >
                    <div className="flex items-center gap-2 text-sm font-medium lg:text-base">
                      <span className={`h-1.5 w-1.5 rounded-full ${item.color}`} />
                      <span>{item.text}</span>
                    </div>
                    <span className={cx("text-sm", isDark ? "text-white/45" : "text-text-main/45")}>
                      {item.time}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
