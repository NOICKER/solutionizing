"use client"

import { type ReactNode } from 'react'
import { BrandMark } from '@/components/solutionizing/ui'

export const onboardingPrimaryButtonClass =
  'inline-flex items-center justify-center bg-[var(--electric)] text-[var(--cream)] rounded-xl px-6 py-3 font-semibold transition-opacity hover:opacity-90 cursor-none disabled:opacity-70'

export const onboardingGhostButtonClass =
  'inline-flex items-center justify-center border border-[var(--border-strong)] bg-transparent text-[var(--ink-soft)] rounded-xl px-5 py-3 hover:border-[var(--electric)] hover:text-[var(--electric)] transition-colors cursor-none disabled:opacity-50'

export const onboardingTextLinkClass =
  'text-[var(--ink-soft)] transition-colors hover:text-[var(--electric)] cursor-none'

export function ComingSoonPill() {
  return (
    <span className="inline-flex rounded-full border border-[var(--electric-mid)] bg-[var(--electric-dim)] px-3 py-1 text-[0.65rem] font-[family-name:var(--font-dm-mono)] uppercase tracking-[0.18em] text-[var(--electric)]">
      Coming Soon
    </span>
  )
}

export function OnboardingShell({
  step,
  totalSteps,
  children,
}: {
  step: number
  totalSteps: number
  children: ReactNode
}) {
  const progress = Math.max((step / totalSteps) * 100, 8)

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[var(--bg)] px-4 py-8">
      <div className="relative w-full max-w-4xl">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex items-center gap-3 rounded-full border border-[var(--border)] bg-[var(--cream)] px-4 py-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--electric)] text-[var(--cream)]">
              <BrandMark className="h-5 w-5 text-[var(--cream)]" />
            </div>
            <div>
              <div className="text-[0.65rem] font-[family-name:var(--font-dm-mono)] uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                Solutionizing
              </div>
              <div className="text-sm font-semibold text-[var(--ink)]">Onboarding</div>
            </div>
          </div>
          <div className="text-sm font-[family-name:var(--font-dm-mono)] text-[var(--ink-soft)]">
            Step {step} of {totalSteps}
          </div>
        </div>

        <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-[var(--border)]">
          <div
            className="h-full rounded-full bg-[var(--electric)] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <section className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--bg-light)] p-6 sm:p-8 lg:p-10">
          {children}
        </section>
      </div>
    </main>
  )
}

export function OnboardingStepIcon({ icon }: { icon: ReactNode }) {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--electric-dim)] text-[var(--electric)]">
      {icon}
    </div>
  )
}
