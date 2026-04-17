"use client";

import { AuthActionLink } from "@/components/AuthActionLink";
import Link from "next/link";
import { type ComponentProps } from "react";

export function HeroActionButtons() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-center lg:justify-start gap-6 lg:gap-8">
      <div className="flex flex-col gap-3">
        <span className="pl-1 text-[11px] font-black uppercase tracking-widest text-text-main/60">For founders -&gt;</span>
        <AuthActionLink authedHref="/dashboard/founder" role="founder" mode="signup" className="w-full sm:w-auto text-center rounded-2xl border-b-4 border-orange-800 bg-primary px-8 sm:px-10 py-4 sm:py-5 text-lg sm:text-xl font-black text-white shadow-cta-orange transition-all hover:bg-primary-hover active:translate-y-1 active:border-b-0 lg:px-12 lg:py-6 lg:text-2xl">
          Launch your mission
        </AuthActionLink>
      </div>

      <div className="flex flex-col gap-3">
        <span className="pl-1 text-[11px] font-black uppercase tracking-widest text-text-main/60">For testers -&gt;</span>
        <AuthActionLink authedHref="/dashboard/tester" role="tester" mode="signup" publicHref="/tester" className="w-full sm:w-auto text-center rounded-2xl border-2 border-secondary/40 px-8 sm:px-9 py-4 text-base sm:text-lg font-black text-secondary transition-all hover:bg-secondary/5 lg:px-10 lg:py-5 lg:text-xl">
          Become a tester
        </AuthActionLink>
      </div>
    </div>
  );
}

export function TesterHeroAction() {
  return (
    <AuthActionLink authedHref="/dashboard/tester" role="tester" mode="signup" publicHref="/tester" className="mt-10 inline-flex rounded-2xl border border-secondary bg-secondary px-10 py-5 text-xl font-black text-white shadow-xl shadow-secondary/20 transition-all hover:bg-teal-900">
      Apply as a tester
    </AuthActionLink>
  );
}

export function PricingAction({ plan }: { plan: any }) {
  return (
    <AuthActionLink authedHref={plan.authedHref} role={plan.role} mode={plan.mode} className={`inline-flex w-full items-center justify-center rounded-2xl px-6 py-4 text-lg font-black transition-all ${plan.featured ? "bg-primary text-white shadow-cta-orange hover:bg-primary-hover" : "border border-secondary/20 bg-neutral-bg text-text-main hover:bg-white"}`}>
      {plan.cta}
    </AuthActionLink>
  );
}

export function BottomActionButtons() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
      <AuthActionLink authedHref="/dashboard/founder" role="founder" mode="signup" className="w-full rounded-2xl border-b-4 border-orange-800 bg-primary px-12 py-6 text-xl font-black text-white shadow-[0_20px_50px_-10px_rgba(217,119,6,0.4)] transition-all hover:bg-primary-hover active:translate-y-1 active:border-b-0 sm:w-auto">
        Launch your mission
      </AuthActionLink>
      <Link href="/contact" className="w-full rounded-2xl border-[3px] border-text-main bg-transparent px-12 py-6 text-xl font-black text-text-main shadow-xl transition-all hover:bg-text-main hover:text-white sm:w-auto">
        Talk to the team
      </Link>
    </div>
  );
}
