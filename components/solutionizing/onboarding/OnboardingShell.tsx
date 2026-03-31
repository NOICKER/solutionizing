"use client"

import { ReactNode } from 'react'
import { BrandMark } from '@/components/solutionizing/ui'

export const onboardingPrimaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-[1.35rem] bg-[#d97757] px-6 py-3 font-black text-white transition-all hover:bg-[#c4673f] hover:shadow-[0_20px_40px_-26px_rgba(217,119,87,0.75)] disabled:pointer-events-none disabled:opacity-70'

export const onboardingGhostButtonClass =
  'inline-flex items-center justify-center rounded-[1.35rem] border border-border-subtle bg-transparent px-5 py-3 font-semibold text-text-muted transition-colors hover:bg-surface-elevated hover:text-text-main disabled:pointer-events-none disabled:opacity-50'

export const onboardingTextLinkClass =
  'text-sm font-semibold text-text-muted transition-colors hover:text-primary'

export function ComingSoonPill() {
  return (
    <span className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[0.65rem] font-black uppercase tracking-[0.18em] text-primary">
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,_rgba(249,124,90,0.16),_transparent_55%)]" />
      <div className="pointer-events-none absolute -left-12 bottom-8 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 top-16 h-60 w-60 rounded-full bg-surface-elevated blur-3xl" />

      <div className="relative w-full max-w-4xl">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex items-center gap-3 rounded-full border border-border-subtle bg-surface px-4 py-2 shadow-card-soft">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F97C5A] to-[#E45D43] text-white">
              <BrandMark className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-[0.65rem] font-black uppercase tracking-[0.22em] text-text-muted">
                Solutionizing
              </div>
              <div className="text-sm font-bold text-text-main">Onboarding</div>
            </div>
          </div>
          <div className="text-sm font-semibold text-text-muted">
            Step {step} of {totalSteps}
          </div>
        </div>

        <div className="mb-6 h-3 overflow-hidden rounded-full bg-surface-elevated">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#F97C5A] to-[#E45D43] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <section className="rounded-panel border border-border-subtle bg-surface p-6 shadow-card sm:p-8 lg:p-10">
          {children}
        </section>
      </div>
    </main>
  )
}

export function OnboardingStepIcon({ icon }: { icon: string }) {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
      <span className="material-symbols-outlined !text-[1.4rem]">{icon}</span>
    </div>
  )
}
