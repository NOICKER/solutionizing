"use client";

import { AuthActionLink } from "@/components/AuthActionLink";
import Link from "next/link";
import { type ComponentProps } from "react";

export function HeroActionButtons() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-center lg:justify-start gap-6 lg:gap-8">
      <div className="flex flex-col gap-3">
        <span className="pl-1 text-[11px] font-bold uppercase tracking-widest text-[var(--ink-soft)]">For founders -&gt;</span>
        <AuthActionLink authedHref="/dashboard/founder" role="founder" mode="signup" className="w-full sm:w-auto text-center rounded-[2rem] bg-primary px-8 sm:px-10 py-4 sm:py-5 text-[16px] sm:text-[18px] font-bold text-white shadow-[0_0_20px_rgba(249,124,90,0.3)] transition-all hover:shadow-[0_0_30px_rgba(249,124,90,0.6)] hover:bg-primary-hover active:scale-[0.98] lg:px-12 lg:py-6 lg:text-[20px]">
          Get your first mission done
        </AuthActionLink>
      </div>

      <div className="flex flex-col gap-3">
        <span className="pl-1 text-[11px] font-bold uppercase tracking-widest text-[var(--ink-soft)]">For testers -&gt;</span>
        <AuthActionLink authedHref="/dashboard/tester" role="tester" mode="signup" publicHref="/tester" className="w-full sm:w-auto text-center rounded-[2rem] border border-[var(--ink)] bg-[var(--bg-light)] px-8 sm:px-9 py-4 sm:py-5 text-[16px] sm:text-[18px] font-bold text-white transition-all hover:border-[var(--ink-soft)]/50 lg:px-10 lg:py-6 lg:text-[20px]">
          Become a tester
        </AuthActionLink>
      </div>
    </div>
  );
}

export function TesterHeroAction() {
  return (
    <div className="mt-12 flex justify-center lg:mt-16">
      <AuthActionLink authedHref="/dashboard/tester" role="tester" mode="signup" publicHref="/tester" className="w-full sm:w-auto text-center rounded-[2rem] bg-primary px-8 sm:px-10 py-4 sm:py-5 text-[16px] sm:text-[18px] font-bold text-white shadow-[0_0_20px_rgba(249,124,90,0.3)] transition-all hover:shadow-[0_0_30px_rgba(249,124,90,0.6)] hover:bg-primary-hover active:scale-[0.98] lg:px-12 lg:py-6 lg:text-[20px]">
        Join as a tester — it&apos;s free
      </AuthActionLink>
    </div>
  );
}

export function PricingAction({ plan }: { plan: any }) {
  return (
    <AuthActionLink authedHref={plan.authedHref} role={plan.role} mode={plan.mode} className={`inline-flex w-full items-center justify-center rounded-[2rem] px-6 py-4 text-[16px] font-bold transition-all ${plan.featured ? "bg-primary text-white shadow-[0_0_20px_rgba(249,124,90,0.3)] hover:shadow-[0_0_30px_rgba(249,124,90,0.6)] hover:bg-primary-hover active:scale-[0.98]" : "border border-[var(--ink)] bg-[var(--bg-light)] text-white hover:border-[var(--ink-soft)]/50"}`}>
      {plan.cta}
    </AuthActionLink>
  );
}

export function BottomActionButtons() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
      <AuthActionLink authedHref="/dashboard/founder" role="founder" mode="signup" className="w-full rounded-[2rem] bg-primary px-10 py-5 text-[18px] font-bold text-white shadow-[0_0_20px_rgba(249,124,90,0.3)] transition-all hover:shadow-[0_0_30px_rgba(249,124,90,0.6)] hover:bg-primary-hover active:scale-[0.98] sm:w-auto lg:px-12 lg:py-6 lg:text-[20px]">
        Post your first mission for ₹149
      </AuthActionLink>
      <Link href="/contact" className="w-full rounded-[2rem] border border-[var(--ink)] bg-[var(--bg-light)] px-10 py-5 text-[18px] font-bold text-white transition-all hover:border-[var(--ink-soft)]/50 sm:w-auto lg:px-12 lg:py-6 lg:text-[20px] cursor-none">
        Talk to the team
      </Link>
    </div>
  );
}
