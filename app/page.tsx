import Link from "next/link";
import { AuthActionLink } from "@/components/AuthActionLink";

const productPillars = [
  {
    icon: "target",
    title: "Frame one product decision",
    body: "Turn a broad concern into a focused mission so testers answer one specific question instead of commenting on everything."
  },
  {
    icon: "group",
    title: "Match for context, not speed",
    body: "Route missions to testers with relevant experience and enough context to notice the friction that actually matters."
  },
  {
    icon: "insights",
    title: "Receive synthesis, not noise",
    body: "Get a recommendation, supporting evidence, and the exact language people used when they got stuck."
  }
];

const noiseCards = [
  {
    icon: "timer_off",
    title: "Speed over substance",
    body: "Volume-based panels reward quick answers. That creates polite noise instead of careful observation."
  },
  {
    icon: "person_search",
    title: "Weak participant fit",
    body: "Generic audiences miss the nuances of your market. We match by context and domain, not generic availability."
  },
  {
    icon: "data_exploration",
    title: "Too much raw feedback",
    body: "Transcripts alone do not help teams decide. We compress findings into a clear point of view you can act on."
  }
];

const exampleSignals = [
  {
    title: "Pricing page clarity",
    summary: "Early teams found the pricing table quickly, but the plan labels made them self-select out too early.",
    outcome: "Rename the middle tier and add a one-line fit description."
  },
  {
    title: "Checkout trust friction",
    summary: "Users hesitated right before payment because the delivery expectations were still vague.",
    outcome: "Move delivery timing closer to the primary CTA and restate it near the final action."
  },
  {
    title: "Hero message comprehension",
    summary: "Visitors understood the product category, but not the exact audience, until they reached the second section.",
    outcome: "Tighten the hero subhead and make the first CTA audience-specific."
  }
];

const contributionItems = [
  {
    icon: "bolt",
    title: "Matched by expertise, not speed",
    body: "Your value is the quality of your observation, not how fast you can finish a form."
  },
  {
    icon: "schedule",
    title: "Short missions with clear scope",
    body: "Most sessions run for 2-4 minutes and focus on one task, one decision, and one clean recommendation."
  }
];

const workflowSteps = [
  {
    number: "01",
    title: "Define the decision",
    body: "Describe what you are trying to learn. We help you turn that into a time-boxed mission with one clear objective."
  },
  {
    number: "02",
    title: "Match the right testers",
    body: "The system assigns people with relevant context, then screens for clarity and fit before feedback starts coming in."
  },
  {
    number: "03",
    title: "Review the synthesis",
    body: "You receive clustered insight, supporting quotes, and a recommendation that points to the next product move."
  }
];

const credibilityStats = [
  {
    value: "400+",
    label: "missions reviewed",
    detail: "Across product messaging, pricing, onboarding, and conversion flows."
  },
  {
    value: "24h",
    label: "to a decision-ready readout",
    detail: "Most teams receive a clear synthesis well inside a single workday."
  },
  {
    value: "20+",
    label: "signal checks per mission",
    detail: "Guardrails reduce shallow prompts, weak matches, and personal-data requests."
  }
];

const pricingPlans = [
  {
    name: "Starter",
    price: "$149",
    cadence: "per mission",
    description: "For one fast product question that needs a grounded answer.",
    bullets: [
      "1 active mission",
      "3 matched testers",
      "Structured synthesis",
      "Shareable summary"
    ],
    role: "founder" as const,
    mode: "signup" as const,
    authedHref: "/dashboard/founder",
    cta: "Start with Starter"
  },
  {
    name: "Growth",
    price: "$399",
    cadence: "per mission bundle",
    description: "For teams validating multiple product moments in the same sprint.",
    bullets: [
      "Up to 3 active missions",
      "Priority matching",
      "Deeper synthesis notes",
      "Mission history"
    ],
    role: "founder" as const,
    mode: "signup" as const,
    authedHref: "/dashboard/founder",
    cta: "Choose Growth",
    featured: true
  },
  {
    name: "Tester Community",
    price: "$0",
    cadence: "to join",
    description: "For specialists who want to contribute high-signal feedback and build reputation.",
    bullets: [
      "Profile review",
      "Mission matching by fit",
      "Reputation scoring",
      "Role-based dashboard"
    ],
    role: "tester" as const,
    mode: "signup" as const,
    authedHref: "/dashboard/tester",
    cta: "Apply as a tester"
  }
];

export default function LandingPage() {
  return (
    <div className="transition-colors duration-300">
      <header className="sticky top-0 z-50 w-full border-b border-secondary/20 bg-neutral-bg/90 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary bg-primary text-white shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined font-bold">analytics</span>
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-text-main">
              Solutionizing
            </h2>
          </div>

          <nav className="hidden items-center gap-8 md:flex">
            <a className="text-sm font-bold text-text-main transition-colors hover:text-primary" href="#product">Product</a>
            <a className="text-sm font-bold text-text-main transition-colors hover:text-primary" href="#methodology">Methodology</a>
            <a className="text-sm font-bold text-text-main transition-colors hover:text-primary" href="#testers">Testers</a>
            <a className="text-sm font-bold text-text-main transition-colors hover:text-primary" href="#pricing">Pricing</a>
          </nav>

          <div className="flex items-center gap-4">
            <AuthActionLink authedHref="/dashboard/founder" role="founder" mode="signin" className="hidden px-4 py-2 text-sm font-extrabold text-text-main transition-colors hover:text-primary lg:block">
              Sign In
            </AuthActionLink>
            <AuthActionLink authedHref="/dashboard/founder" role="founder" mode="signin" className="rounded-xl border border-primary bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-cta-orange transition-all hover:bg-primary-hover">
              Start your mission
            </AuthActionLink>
          </div>
        </div>
      </header>

      <main>
        <section className="overflow-hidden bg-neutral-bg py-24 lg:py-32">
          <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-2 lg:gap-16">
            <div className="flex flex-col gap-10 lg:gap-12">
              <div className="flex flex-col gap-8 lg:gap-9">
                <div className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.3em] text-primary">Most founders ship blind.</div>
                <h1 className="text-5xl font-extrabold leading-[0.92] tracking-tighter text-text-main sm:text-6xl lg:text-[5.7rem]">
                  You do not need more feedback.{" "}
                  <span className="text-primary">You need signal.</span>
                </h1>
                <p className="max-w-xl text-lg font-medium leading-relaxed text-text-main/60 lg:text-xl">
                  Solutionizing helps founders validate one product decision at a time,
                  using matched testers and a synthesis layer that turns loose feedback
                  into a next move.
                </p>
                <div className="text-[11px] font-black uppercase tracking-[0.25em] text-text-main/40">
                  For founders shipping product and testers contributing expertise
                </div>
              </div>

              <div className="flex flex-wrap items-end gap-6 lg:gap-8">
                <div className="flex flex-col gap-3">
                  <span className="pl-1 text-[11px] font-black uppercase tracking-widest text-text-main/60">For founders -&gt;</span>
                  <AuthActionLink authedHref="/dashboard/founder" role="founder" mode="signup" className="rounded-2xl border-b-4 border-orange-800 bg-primary px-10 py-5 text-xl font-black text-white shadow-cta-orange transition-all hover:bg-primary-hover active:translate-y-1 active:border-b-0 lg:px-12 lg:py-6 lg:text-2xl">
                    Launch your mission
                  </AuthActionLink>
                </div>

                <div className="flex flex-col gap-3">
                  <span className="pl-1 text-[11px] font-black uppercase tracking-widest text-text-main/60">For testers -&gt;</span>
                  <AuthActionLink authedHref="/dashboard/tester" role="tester" mode="signup" publicHref="/tester" className="rounded-2xl border-2 border-secondary/40 px-9 py-4 text-lg font-black text-secondary transition-all hover:bg-secondary/5 lg:px-10 lg:py-5 lg:text-xl">
                    Become a tester
                  </AuthActionLink>
                </div>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute -inset-10 rounded-full bg-primary/10 opacity-40 blur-[100px]" />
              <div className="relative z-10 aspect-[4/3] overflow-hidden rounded-[2.5rem] border border-secondary/20 bg-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)]">
                <div className="flex items-center justify-between border-b border-secondary/20 bg-neutral-bg/80 px-6 py-4 lg:px-8 lg:py-5">
                  <div className="flex gap-2.5">
                    <div className="h-3.5 w-3.5 rounded-full bg-red-500/60" />
                    <div className="h-3.5 w-3.5 rounded-full bg-orange-500/60" />
                    <div className="h-3.5 w-3.5 rounded-full bg-secondary/40" />
                  </div>
                  <div className="text-[11px] font-black uppercase tracking-[0.25em] text-text-main/60">Mission Dashboard - v2.4</div>
                </div>

                <div className="flex flex-col gap-8 p-6 lg:p-8">
                  <div className="rounded-2xl border border-secondary/20 bg-neutral-bg p-6 lg:p-7">
                    <div className="mb-5 flex items-start justify-between gap-4">
                      <h3 className="text-lg font-black text-text-main">Checkout clarity validation</h3>
                      <span className="rounded-md bg-secondary px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white">Active</span>
                    </div>

                    <div className="mb-3 h-3 w-full rounded-full border border-secondary/5 bg-white shadow-inner">
                      <div className="h-full w-3/4 rounded-full bg-primary shadow-[0_0_15px_rgba(217,119,6,0.3)]" />
                    </div>
                    <p className="text-[11px] font-black uppercase text-text-main/60">18 of 24 responses collected</p>
                  </div>

                  <div className="grid grid-cols-2 gap-5 lg:gap-6">
                    <div className="rounded-2xl border border-secondary/20 bg-white p-5 shadow-xl shadow-black/5 lg:p-6">
                      <p className="mb-2 text-[11px] font-black uppercase text-secondary">Signal strength</p>
                      <p className="text-4xl font-black text-text-main">84%</p>
                    </div>

                    <div className="z-20 rounded-2xl border-[3px] border-primary bg-white p-6 shadow-[0_25px_50px_-12px_rgba(217,119,6,0.25)] lg:translate-y-2 lg:scale-[1.03]">
                      <p className="mb-2 text-[11px] font-black uppercase text-primary">Critical insight</p>
                      <p className="text-3xl font-black tracking-tight text-text-main">Copy is underspecified</p>
                    </div>
                  </div>

                  <div className="mockup-layer rounded-2xl border border-white/10 bg-text-main p-7 text-white shadow-2xl lg:translate-x-4">
                    <div className="mb-3 flex items-center gap-3">
                      <span className="material-symbols-outlined text-2xl font-bold text-primary">chat_bubble</span>
                      <h4 className="text-[11px] font-black uppercase tracking-widest text-primary">Key friction point</h4>
                    </div>
                    <p className="mb-3 text-lg font-bold leading-relaxed text-white">&quot;I understood the action, but not what would happen next.&quot;</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Verified signal</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-secondary/15 bg-white py-10">
          <div className="mx-auto grid max-w-7xl gap-6 px-6 md:grid-cols-3">
            {credibilityStats.map((item) => (
              <div key={item.label} className="rounded-[2rem] border border-secondary/15 bg-neutral-bg px-6 py-6">
                <div className="text-4xl font-black tracking-tight text-text-main">{item.value}</div>
                <div className="mt-2 text-sm font-black uppercase tracking-[0.18em] text-secondary">{item.label}</div>
                <p className="mt-3 text-base leading-relaxed text-text-main/65">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="product" className="bg-neutral-bg py-24 lg:py-28">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mx-auto mb-14 max-w-3xl text-center lg:mb-16">
              <h2 className="text-4xl font-black tracking-tight text-text-main lg:text-5xl">Built for actual product decisions.</h2>
              <p className="mt-5 text-lg leading-relaxed text-text-main/65 lg:text-xl">
                The product is not a generic feedback inbox. It is a workflow for
                defining one question, matching the right people, and turning the
                outcome into a decision.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {productPillars.map((pillar) => (
                <article key={pillar.title} className="rounded-[2.5rem] border border-secondary/15 bg-white p-8 shadow-card-soft">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <span className="material-symbols-outlined text-3xl">{pillar.icon}</span>
                  </div>
                  <h3 className="text-2xl font-black tracking-tight text-text-main">{pillar.title}</h3>
                  <p className="mt-4 text-base leading-relaxed text-text-main/65 lg:text-lg">{pillar.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="methodology" className="border-y border-secondary/15 bg-surface-white py-24 lg:py-28">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mx-auto mb-16 max-w-3xl text-center lg:mb-20">
              <h2 className="mb-6 text-4xl font-black tracking-tight text-text-main lg:text-5xl">Most feedback systems create noise.</h2>
              <p className="text-lg font-medium leading-relaxed text-text-main/60 lg:text-xl">
                Traditional feedback loops are slow, biased, and bloated with raw input.
                We reduce that noise before it reaches your team.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {noiseCards.map((card) => (
                <div key={card.title} className="group rounded-[2.5rem] border border-secondary/20 bg-neutral-card p-9 shadow-sm transition-all hover:border-primary/40 lg:p-10">
                  <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl border border-secondary/10 bg-white text-secondary shadow-md transition-all group-hover:bg-primary/10 group-hover:text-primary group-hover:shadow-primary/10 lg:mb-10 lg:h-20 lg:w-20">
                    <span className="material-symbols-outlined text-5xl font-bold">{card.icon}</span>
                  </div>
                  <h3 className="mb-4 text-2xl font-black text-text-main">{card.title}</h3>
                  <p className="text-base font-medium leading-relaxed text-text-main/70 lg:text-lg">{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#f7f4ee] py-24 lg:py-28">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-3xl">
                <div className="heading-eyebrow">Examples from recent missions</div>
                <h2 className="mt-3 text-4xl font-black tracking-tight text-text-main lg:text-5xl">Proof looks like clearer decisions, not more transcripts.</h2>
              </div>
              <p className="max-w-xl text-base leading-relaxed text-text-main/60 lg:text-lg">
                Here is the kind of output teams use after a mission closes: specific
                friction, a clear interpretation, and a recommendation you can ship.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {exampleSignals.map((item) => (
                <article key={item.title} className="rounded-[2rem] border border-secondary/15 bg-white p-6 shadow-card-soft">
                  <div className="text-sm font-black uppercase tracking-[0.18em] text-secondary">{item.title}</div>
                  <p className="mt-4 text-base leading-relaxed text-text-main/70">{item.summary}</p>
                  <div className="mt-5 rounded-2xl bg-neutral-bg px-4 py-4">
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-text-main/45">Recommended next move</div>
                    <p className="mt-2 text-base font-semibold leading-relaxed text-text-main">{item.outcome}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="testers" className="bg-neutral-bg py-24 lg:py-28">
          <div className="mx-auto max-w-7xl px-6">
            <div className="rounded-[3rem] border border-secondary/15 bg-surface-white p-8 shadow-[0_50px_100px_-30px_rgba(0,0,0,0.08)] sm:p-10 lg:p-16">
              <div className="flex flex-col items-center gap-14 lg:flex-row lg:gap-16">
                <div className="lg:w-1/2">
                  <div className="mb-6 inline-flex items-center gap-2 rounded-lg border border-secondary/10 bg-neutral-bg px-4 py-2 text-sm font-black uppercase tracking-[0.3em] text-text-main">Tester contribution model</div>
                  <h2 className="mb-8 text-4xl font-black leading-[1.05] tracking-tight text-text-main lg:text-5xl">
                    Expert insights,
                    <br />
                    <span className="text-secondary">not anonymous gig work.</span>
                  </h2>
                  <p className="mb-10 text-lg font-medium leading-relaxed text-text-main/65 lg:text-xl">
                    The best feedback comes from people who understand the context.
                    We design the tester experience around clarity, fit, and thoughtful explanation.
                  </p>

                  <div className="grid gap-8">
                    {contributionItems.map((item) => (
                      <div key={item.title} className="flex items-start gap-6">
                        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border border-secondary/20 bg-secondary/10 text-secondary shadow-sm">
                          <span className="material-symbols-outlined text-3xl font-bold">{item.icon}</span>
                        </div>
                        <div>
                          <h4 className="mb-2 text-xl font-black text-text-main lg:text-2xl">{item.title}</h4>
                          <p className="text-base font-medium text-text-main/60 lg:text-lg">{item.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <AuthActionLink authedHref="/dashboard/tester" role="tester" mode="signup" publicHref="/tester" className="mt-10 inline-flex rounded-2xl border border-secondary bg-secondary px-10 py-5 text-xl font-black text-white shadow-xl shadow-secondary/20 transition-all hover:bg-teal-900">
                    Apply as a tester
                  </AuthActionLink>
                </div>

                <div className="relative lg:w-1/2">
                  <div className="relative aspect-square overflow-hidden rounded-[3rem] border border-white/10 bg-text-main shadow-[0_60px_120px_-20px_rgba(0,0,0,0.5)]">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-secondary/50 via-transparent to-transparent" />
                    <div className="flex h-full flex-col items-center justify-center p-10 text-center sm:p-12 lg:p-14">
                      <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full border-2 border-secondary/50 bg-secondary/30 text-secondary shadow-[0_0_40px_rgba(95,125,129,0.3)] lg:h-28 lg:w-28">
                        <span className="material-symbols-outlined text-6xl">psychology_alt</span>
                      </div>
                      <h4 className="mb-4 text-3xl font-black tracking-tight text-white">Signal certification</h4>
                      <p className="max-w-xs text-sm font-bold uppercase leading-relaxed tracking-[0.2em] text-white/55">
                        Structured review protects mission quality, tester fit, and the privacy of both sides.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="workflow" className="bg-surface-white py-24 lg:py-28">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="mb-16 text-center text-4xl font-black tracking-tight text-text-main lg:mb-20 lg:text-5xl">The 2-minute workflow</h2>

            <div className="overflow-hidden rounded-[3rem] border border-secondary/20 shadow-xl lg:grid lg:grid-cols-3">
              {workflowSteps.map((step, index) => (
                <div key={step.number} className={`group relative bg-neutral-card/40 p-10 transition-all duration-300 hover:bg-secondary lg:p-12 ${index < workflowSteps.length - 1 ? "border-b border-secondary/20 lg:border-b-0 lg:border-r" : ""}`}>
                  <span className="mb-10 block text-6xl font-black leading-none text-secondary transition-colors group-hover:text-white/20 lg:mb-12 lg:text-7xl">{step.number}</span>
                  <h3 className="mb-5 text-2xl font-black text-text-main group-hover:text-white lg:text-3xl">{step.title}</h3>
                  <p className="text-lg font-medium leading-relaxed text-text-main/70 transition-colors group-hover:text-white/90 lg:text-xl">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="bg-neutral-bg py-24 lg:py-28">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mx-auto mb-14 max-w-3xl text-center lg:mb-16">
              <div className="heading-eyebrow">Pricing</div>
              <h2 className="mt-3 text-4xl font-black tracking-tight text-text-main lg:text-5xl">Start with one mission. Scale when the process works.</h2>
              <p className="mt-5 text-lg leading-relaxed text-text-main/65 lg:text-xl">
                The pricing mirrors the product: focused, lightweight, and designed to
                help you answer one product question without spinning up a full research program.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {pricingPlans.map((plan) => (
                <article key={plan.name} className={`rounded-[2.5rem] border p-8 shadow-card-soft ${plan.featured ? "border-primary bg-white shadow-[0_25px_60px_-20px_rgba(217,119,6,0.25)]" : "border-secondary/15 bg-white"}`}>
                  <div className="text-sm font-black uppercase tracking-[0.18em] text-secondary">{plan.name}</div>
                  <div className="mt-5 flex items-end gap-2">
                    <div className="text-5xl font-black tracking-tight text-text-main">{plan.price}</div>
                    <div className="pb-1 text-sm font-semibold uppercase tracking-[0.18em] text-text-main/45">{plan.cadence}</div>
                  </div>
                  <p className="mt-4 text-base leading-relaxed text-text-main/65">{plan.description}</p>
                  <ul className="mt-6 space-y-3 text-base text-text-main/70">
                    {plan.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-3">
                        <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8">
                    <AuthActionLink authedHref={plan.authedHref} role={plan.role} mode={plan.mode} publicHref={plan.publicHref} className={`inline-flex w-full items-center justify-center rounded-2xl px-6 py-4 text-lg font-black transition-all ${plan.featured ? "bg-primary text-white shadow-cta-orange hover:bg-primary-hover" : "border border-secondary/20 bg-neutral-bg text-text-main hover:bg-white"}`}>
                      {plan.cta}
                    </AuthActionLink>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#f7f4ee] py-28 text-center lg:py-32">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="mb-10 text-5xl font-black leading-[0.92] tracking-tighter text-text-main sm:text-6xl lg:text-[6rem]">
              Ready to make the next product decision
              <br />
              with less guessing?
            </h2>
            <p className="mx-auto mb-12 max-w-3xl text-lg font-medium leading-relaxed text-text-main/50 lg:mb-14 lg:text-xl">
              Join founders running focused missions and specialists contributing the kind of feedback teams can actually ship from.
            </p>

            <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
              <AuthActionLink authedHref="/dashboard/founder" role="founder" mode="signup" className="w-full rounded-2xl border-b-4 border-orange-800 bg-primary px-12 py-6 text-xl font-black text-white shadow-[0_20px_50px_-10px_rgba(217,119,6,0.4)] transition-all hover:bg-primary-hover active:translate-y-1 active:border-b-0 sm:w-auto">
                Launch your mission
              </AuthActionLink>
              <Link href="/contact" className="w-full rounded-2xl border-[3px] border-text-main bg-transparent px-12 py-6 text-xl font-black text-text-main shadow-xl transition-all hover:bg-text-main hover:text-white sm:w-auto">
                Talk to the team
              </Link>
            </div>

            <div className="mt-12 flex flex-col items-center gap-4 lg:mt-14">
              <p className="text-[13px] font-black uppercase tracking-[0.3em] text-text-main">No credit card required to explore the flow.</p>
              <p className="text-xs font-bold uppercase tracking-widest text-text-main/40">Most missions close with a decision-ready summary in under 24 hours.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-secondary/20 bg-white py-14 lg:py-16">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-6 md:flex-row md:gap-10">
          <div className="flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white shadow-lg">
              <span className="material-symbols-outlined font-bold">analytics</span>
            </div>
            <h2 className="text-2xl font-black tracking-tighter text-text-main">Solutionizing</h2>
          </div>

          <div className="flex flex-wrap justify-center gap-8 text-sm font-black uppercase tracking-[0.2em] text-text-main/70 md:gap-10">
            <Link className="transition-colors hover:text-primary" href="/terms">Terms</Link>
            <Link className="transition-colors hover:text-primary" href="/privacy">Privacy</Link>
            <a className="transition-colors hover:text-primary" href="#methodology">Methodology</a>
            <a className="transition-colors hover:text-primary" href="#testers">Testers</a>
            <Link className="transition-colors hover:text-primary" href="/contact">Contact</Link>
          </div>

          <p className="text-sm font-bold text-text-main/50">&copy; 2024 Solutionizing Research Lab. Built for signal.</p>
        </div>
      </footer>
    </div>
  );
}

