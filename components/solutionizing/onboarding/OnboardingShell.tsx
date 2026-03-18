"use client"

import { ReactNode } from 'react'
import { BrandMark } from '@/components/solutionizing/ui'

export const onboardingPrimaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-[1.35rem] bg-[#d97757] px-6 py-3 font-black text-white transition-all hover:bg-[#c4673f] hover:shadow-[0_20px_40px_-26px_rgba(217,119,87,0.75)] disabled:pointer-events-none disabled:opacity-70'

export const onboardingGhostButtonClass =
  'inline-flex items-center justify-center rounded-[1.35rem] border border-[#ece6df] bg-transparent px-5 py-3 font-semibold text-[#6b687a] transition-colors hover:bg-[#f6f1ec] hover:text-[#1a1625] disabled:pointer-events-none disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'

export const onboardingTextLinkClass =
  'text-sm font-semibold text-[#6b687a] transition-colors hover:text-[#d97757] dark:text-gray-400 dark:hover:text-[#f2b29d]'

export function ComingSoonPill() {
  return (
    <span className="inline-flex rounded-full border border-[#ead8cf] bg-[#fff4ef] px-3 py-1 text-[0.65rem] font-black uppercase tracking-[0.18em] text-[#d97757] dark:border-[#d97757]/30 dark:bg-[#d97757]/10 dark:text-[#f2b29d]">
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#faf9f7] px-4 py-8 dark:bg-gray-950">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,_rgba(217,119,87,0.16),_transparent_55%)]" />
      <div className="pointer-events-none absolute -left-12 bottom-8 h-48 w-48 rounded-full bg-[#f4dfd7] blur-3xl dark:bg-[#d97757]/10" />
      <div className="pointer-events-none absolute -right-10 top-16 h-60 w-60 rounded-full bg-[#f2ebe5] blur-3xl dark:bg-gray-900" />

      <div className="relative w-full max-w-4xl">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex items-center gap-3 rounded-full border border-[#ece6df] bg-white/85 px-4 py-2 shadow-[0_18px_40px_-32px_rgba(26,22,37,0.28)] dark:border-gray-700 dark:bg-gray-900/80">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#d97757] text-white">
              <BrandMark className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-[0.65rem] font-black uppercase tracking-[0.22em] text-[#9b98a8] dark:text-gray-400">
                Solutionizing
              </div>
              <div className="text-sm font-bold text-[#1a1625] dark:text-white">Onboarding</div>
            </div>
          </div>
          <div className="text-sm font-semibold text-[#6b687a] dark:text-gray-400">
            Step {step} of {totalSteps}
          </div>
        </div>

        <div className="mb-6 h-3 overflow-hidden rounded-full bg-[#efe4dc] dark:bg-gray-800">
          <div
            className="h-full rounded-full bg-[#d97757] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <section className="rounded-[2rem] border border-[#ece6df] bg-white/95 p-6 shadow-[0_30px_90px_-56px_rgba(26,22,37,0.45)] dark:border-gray-700 dark:bg-gray-900/95 sm:p-8 lg:p-10">
          {children}
        </section>
      </div>
    </main>
  )
}

export function OnboardingStepIcon({ icon }: { icon: string }) {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff4ef] text-[#d97757] dark:bg-[#d97757]/10 dark:text-[#f2b29d]">
      <span className="material-symbols-outlined !text-[1.4rem]">{icon}</span>
    </div>
  )
}
