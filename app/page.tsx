import { LandingPageHeader } from "@/components/solutionizing/LandingPageHeader";
import { 
  HeroActionButtons, 
  TesterHeroAction, 
  PricingAction, 
  BottomActionButtons 
} from "@/components/solutionizing/LandingPageClientBlocks";
import dynamic from "next/dynamic";

const MissionDashboardMockup = dynamic(
  () => import("@/components/solutionizing/MissionDashboardMockup").then(m => m.MissionDashboardMockup),
  { ssr: true }
);

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
    title: "Other founders aren't your users.",
    body: "Peer review sounds smart. But a B2B SaaS founder reviewing your D2C checkout isn't your customer. They'll tell you what they'd build, not what your users actually feel."
  },
  {
    icon: "person_search",
    title: "More data doesn't mean more clarity.",
    body: "Survey responses. User interviews. Notion docs full of quotes. And you still don't know what to fix first. The problem isn't volume. It's that no one's telling you what it means."
  },
  {
    icon: "data_exploration",
    title: "Polite feedback is the enemy.",
    body: "Your co-founder, your investors, your friends — they all want you to win. That makes them terrible testers. You need people with no stake in your success who will just tell you the truth."
  }
];

const exampleSignals = [
  {
    title: "CTA Position",
    summary: "Every single tester stopped scrolling at the feature grid. Didn't realise the button wasn't visible on mobile.",
    outcome: "Moved the CTA above the fold"
  },
  {
    title: "Feature Adoption",
    summary: "Every tester skipped the whole section. Nobody even noticed it existed.",
    outcome: "Killed a feature we'd been building for 6 weeks"
  },
  {
    title: "Hero Messaging",
    summary: "Testers said the old one felt like a SaaS tool, not a personal product.",
    outcome: "Changed the hero headline"
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

const testerProfileMock = {
  name: "Aarohi Nair",
  context: "B2B SaaS operator",
  missionCount: "31 missions reviewed",
  reputationScore: "94/100",
  quote:
    "I knew what the product did, but the pricing labels made me wonder if this was built for teams bigger than mine."
};

const workflowSteps = [
  {
    number: "01",
    title: "Post your question.",
    body: "Not 'review my product.' One specific thing you need to know right now. Why aren't people clicking the CTA? Is the pricing page killing trust? One question. That's it."
  },
  {
    number: "02",
    title: "We match real people.",
    body: "Not other founders. Not bots. People who look like your actual users. They complete a structured mission and get paid for their time. No polite vagueness. Just honest observation."
  },
  {
    number: "03",
    title: "Get a clear next move.",
    body: "Not a spreadsheet of raw notes. One recommendation, the evidence behind it, and the exact words people used when they got stuck. You read it in 5 minutes. You act on it today."
  }
];

const credibilityStats = [
  {
    value: "24h",
    label: "average turnaround",
    detail: "Most teams receive a clear synthesis well inside a single workday."
  },
  {
    value: "20+",
    label: "structured checks per mission.",
    detail: "Guardrails reduce shallow prompts, weak matches, and personal-data requests."
  }
];

const pricingPlans = [
  {
    name: "Starter",
    price: "₹149",
    cadence: "per mission",
    description: "3 matched testers, one clear recommendation. Good for a single product question.",
    bullets: [
      "3 matched testers",
      "One clear recommendation",
      "Good for a single question"
    ],
    role: "founder" as const,
    mode: "signup" as const,
    authedHref: "/dashboard/founder",
    cta: "Start with Starter"
  },
  {
    name: "Growth",
    price: "₹349",
    cadence: "per bundle",
    description: "Up to 3 active missions, priority matching. Best for teams iterating fast.",
    bullets: [
      "Up to 3 active missions",
      "Priority matching",
      "Best for teams iterating fast"
    ],
    role: "founder" as const,
    mode: "signup" as const,
    authedHref: "/dashboard/founder",
    cta: "Choose Growth",
    featured: true
  },
  {
    name: "Tester",
    price: "₹0",
    cadence: "to join",
    description: "Get matched to missions, 15-20 min per task, get paid per mission.",
    bullets: [
      "Get matched to missions",
      "15-20 min per task",
      "Get paid per mission"
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
      <LandingPageHeader />

      <main>
        <section className="overflow-hidden bg-neutral-bg py-16 sm:py-24 lg:py-32">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 sm:gap-14 lg:grid-cols-2 lg:gap-16">
            <div className="flex flex-col gap-8 sm:gap-10 lg:gap-12">
              <div className="flex flex-col gap-8 lg:gap-9 text-center lg:text-left">
                <h1 className="text-4xl font-extrabold leading-[0.92] tracking-tighter text-text-main sm:text-6xl lg:text-[5.7rem]">
                  Stop asking people who want you to win.
                </h1>
                <p className="mx-auto lg:mx-0 max-w-xl text-base sm:text-lg font-medium leading-relaxed text-text-main/60 lg:text-xl">
                  Post one product question. We match it to real people who don't know you, don't owe you, and will tell you exactly where they got lost — then we tell you what to do about it.
                </p>
                <div className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.25em] text-text-main/40">
                  Works for any web or mobile product. If someone can open a link, we can test it.
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <HeroActionButtons />
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-text-main/50 text-center lg:text-left">
                  Starting at ₹149 · No subscription needed
                </div>
              </div>
            </div>

            <MissionDashboardMockup />
          </div>
        </section>

        <section className="border-y border-secondary/15 bg-white py-8 sm:py-10">
          <div className="mx-auto grid max-w-7xl gap-4 sm:gap-6 md:grid-cols-3 px-6">
            {credibilityStats.map((item) => (
              <div key={item.label} className="rounded-[1.5rem] sm:rounded-[2rem] border border-secondary/15 bg-neutral-bg px-5 py-5 sm:px-6 sm:py-6">
                <div className="text-3xl sm:text-4xl font-black tracking-tight text-text-main">{item.value}</div>
                <div className="mt-1 sm:mt-2 text-[0.7rem] sm:text-sm font-black uppercase tracking-[0.18em] text-secondary">{item.label}</div>
                <p className="mt-2 sm:mt-3 text-sm sm:text-base leading-relaxed text-text-main/65">{item.detail}</p>
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
                <article key={pillar.title} className="light-surface rounded-[2.5rem] border border-secondary/15 bg-white p-8 text-[#1a1a1a] shadow-card-soft">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <span className="material-symbols-outlined text-3xl">{pillar.icon}</span>
                  </div>
                  <h3 className="text-2xl font-black tracking-tight text-[#1a1a1a]">{pillar.title}</h3>
                  <p className="mt-4 text-base leading-relaxed text-[#222222]/80 lg:text-lg">{pillar.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="methodology" className="border-y border-secondary/15 bg-neutral-card py-24 lg:py-28">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mx-auto mb-16 max-w-3xl text-center lg:mb-20">
              <h2 className="mb-6 text-4xl font-black tracking-tight text-text-main lg:text-5xl">The feedback you have right now is probably useless.</h2>
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

        <section className="bg-neutral-bg py-24 lg:py-28">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-3xl">
                <div className="text-[0.7rem] font-black uppercase tracking-[0.3em] text-primary">Examples from recent missions</div>
                <h2 className="mt-3 text-4xl font-black tracking-tight text-text-main lg:text-5xl">What a real decision looks like.</h2>
              </div>
              <p className="max-w-xl text-base leading-relaxed text-text-main/60 lg:text-lg">
                Not more transcripts. Actual next moves.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {exampleSignals.map((item) => (
                <article key={item.title} className="rounded-[2rem] border border-secondary/15 bg-white p-6 text-[#1a1a1a] shadow-card-soft">
                  <div className="text-sm font-black uppercase tracking-[0.18em] text-[#222222]">{item.title}</div>
                  <p className="mt-4 text-base leading-relaxed text-[#222222]/80">{item.summary}</p>
                  <div className="dark-surface mt-5 rounded-2xl bg-neutral-bg px-4 py-4">
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
            <div className="rounded-[3rem] border border-secondary/15 bg-neutral-card p-8 shadow-[0_50px_100px_-30px_rgba(0,0,0,0.08)] sm:p-10 lg:p-16">
              <div className="mx-auto max-w-3xl text-center">
                <h2 className="mb-6 text-4xl font-black leading-[1.05] tracking-tight text-text-main lg:text-5xl">
                  Get paid to break things.
                </h2>
                <p className="text-lg font-medium leading-relaxed text-text-main/65 lg:text-xl">
                  Real Indian startups need your honest opinion. Not a polished one. Just a real one.
                </p>
                <div className="mt-8 flex flex-col gap-6 text-base text-text-main/70 leading-relaxed max-w-2xl mx-auto">
                  <p>
                    Sign up free. Get matched to a mission. Spend 15-20 minutes using a product and sharing what you actually think. Get paid directly to your account.
                  </p>
                  <p>
                    No design degree. No tech background. No experience needed. You just have to use the product like a normal person and say what you honestly think. That's the whole job.
                  </p>
                </div>
              </div>

              <TesterHeroAction />
            </div>
          </div>
        </section>

        <section id="peer-review" className="border-t border-secondary/15 bg-neutral-card py-24 lg:py-28">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mx-auto max-w-3xl text-center">
              <div className="text-[0.7rem] font-black uppercase tracking-[0.3em] text-primary mb-3">Why not peer review?</div>
              <h2 className="mb-6 text-4xl font-black tracking-tight text-text-main lg:text-5xl">Founder feedback is not user feedback.</h2>
              <div className="flex flex-col gap-6 text-base sm:text-lg font-medium leading-relaxed text-text-main/65 lg:text-xl">
                <p>
                  Peer review platforms are free because you pay with your time. You review someone else's product, they review yours. The problem: they're not your user. They're a founder with their own biases and a strong incentive to be nice so you return the favour.
                </p>
                <p className="font-semibold text-text-main">
                  Solutionizing uses real people who get paid to be honest. Closer to actual user signal. Every time.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="workflow" className="bg-neutral-card py-24 lg:py-28">
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
              <div className="text-[0.7rem] font-black uppercase tracking-[0.3em] text-primary">Pricing</div>
              <h2 className="mt-3 text-4xl font-black tracking-tight text-text-main lg:text-5xl">Simple pricing. No fluff.</h2>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {pricingPlans.map((plan) => (
                <article key={plan.name} className={`light-surface rounded-[2.5rem] border p-8 text-[#1a1a1a] shadow-card-soft ${plan.featured ? "border-primary bg-white shadow-[0_25px_60px_-20px_rgba(217,119,6,0.25)]" : "border-secondary/15 bg-white"}`}>
                  <div className="text-sm font-black uppercase tracking-[0.18em] text-[#222222]">{plan.name}</div>
                  <div className="mt-5 flex items-end gap-2">
                    <div className="text-5xl font-black tracking-tight text-[#1a1a1a]">{plan.price}</div>
                    <div className="pb-1 text-sm font-semibold uppercase tracking-[0.18em] text-[#222222]/55">{plan.cadence}</div>
                  </div>
                  <p className="mt-4 text-base leading-relaxed text-[#222222]/80">{plan.description}</p>
                  <ul className="mt-6 space-y-3 text-base text-[#222222]/80">
                    {plan.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-3">
                        <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8">
                    <PricingAction plan={plan} />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="light-surface bg-[#f7f4ee] py-28 text-center lg:py-32">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="mb-8 sm:mb-10 text-4xl font-black leading-[0.92] tracking-tighter text-text-main sm:text-6xl lg:text-[6rem]">
              You already know something's off.
              <br className="hidden sm:block" />
              Find out what it actually is.
            </h2>

            <BottomActionButtons />

            <div className="mt-12 flex flex-col items-center gap-4 lg:mt-14">
              <p className="text-[13px] font-black uppercase tracking-[0.3em] text-text-main">No credit card required to explore the flow.</p>
              <p className="text-xs font-bold uppercase tracking-widest text-text-main/40">Most missions close with a decision-ready summary in under 24 hours.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="light-surface border-t border-secondary/20 bg-white py-14 lg:py-16">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-10 px-6 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white shadow-lg">
              <span className="material-symbols-outlined font-bold">analytics</span>
            </div>
            <h2 className="text-2xl font-black tracking-tighter text-text-main">Solutionizing</h2>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 text-center text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-text-main/70 md:gap-10">
            <div className="flex flex-wrap justify-center gap-6 sm:gap-8">
              <a className="transition-colors hover:text-primary" href="/terms">Terms</a>
              <a className="transition-colors hover:text-primary" href="/privacy">Privacy</a>
              <a className="transition-colors hover:text-primary" href="/refund">Refund Policy</a>
            </div>
            <div className="flex flex-wrap justify-center gap-6 sm:gap-8">
              <a className="transition-colors hover:text-primary" href="/tester-payment-policy">Tester Policy</a>
              <a className="transition-colors hover:text-primary" href="/contact">Contact</a>
            </div>
          </div>

          <p className="text-center text-xs sm:text-sm font-bold text-text-main/50">Solutionizing · Built for Indian founders · Real testers · Real signal</p>
        </div>
      </footer>
    </div>
  );
}
