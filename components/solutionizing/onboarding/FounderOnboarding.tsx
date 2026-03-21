"use client"

import posthog from 'posthog-js'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { apiFetch, isApiClientError } from '@/lib/api/client'
import { SpinnerIcon, textFieldClass } from '@/components/solutionizing/ui'
import {
  ComingSoonPill,
  OnboardingShell,
  OnboardingStepIcon,
  onboardingGhostButtonClass,
  onboardingPrimaryButtonClass,
} from '@/components/solutionizing/onboarding/OnboardingShell'

type FounderOnboardingStep = 1 | 2 | 3 | 4 | 5
type CoinPackId = 'starter' | 'growth' | 'scale'

interface FounderOnboardingProps {
  initialDisplayName: string
  initialCompanyName: string | null
}

const founderHowItWorks = [
  {
    icon: 'toll',
    title: 'Buy coins',
    description: 'Top up your workspace so each mission is funded before it goes live.',
  },
  {
    icon: 'edit_square',
    title: 'Create a mission',
    description: 'Define what you want tested and the exact questions you want answered.',
  },
  {
    icon: 'experiment',
    title: 'Testers test your product',
    description: 'Qualified testers walk through your product and document what they find.',
  },
  {
    icon: 'insights',
    title: 'You get structured feedback and insights',
    description: 'Review the feedback in one place and spot the patterns that matter.',
  },
] as const

const coinPacks = [
  { id: 'starter', name: 'Starter', coins: '14900 coins' },
  { id: 'growth', name: 'Growth', coins: '34900 coins' },
  { id: 'scale', name: 'Scale', coins: '79900 coins' },
] as const satisfies ReadonlyArray<{
  id: CoinPackId
  name: string
  coins: string
}>

function getRequestErrorMessage(error: unknown) {
  if (isApiClientError(error) && error.code === 'NETWORK_ERROR') {
    return 'Check your internet connection'
  }

  if (isApiClientError(error)) {
    return error.message
  }

  return 'Something went wrong. Please try again.'
}

export function FounderOnboarding({
  initialDisplayName,
  initialCompanyName,
}: FounderOnboardingProps) {
  const router = useRouter()
  const { refetch } = useAuth()
  const [step, setStep] = useState<FounderOnboardingStep>(1)
  const [displayName, setDisplayName] = useState(initialDisplayName)
  const [companyName, setCompanyName] = useState(initialCompanyName ?? '')
  const [selectedPack, setSelectedPack] = useState<CoinPackId | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)

  async function handleNext() {
    setErrorMessage('')

    if (step === 1 || step === 2 || step === 4) {
      setStep((currentStep) => (currentStep + 1) as FounderOnboardingStep)
      return
    }

    const trimmedDisplayName = displayName.trim()

    if (trimmedDisplayName.length < 2) {
      setErrorMessage('Display name must be at least 2 characters.')
      return
    }

    setIsSavingProfile(true)

    try {
      await apiFetch('/api/v1/founder/profile', {
        method: 'PATCH',
        body: {
          displayName: trimmedDisplayName,
          companyName: companyName.trim(),
        },
      })
      await refetch()
      setStep(4)
    } catch (error) {
      setErrorMessage(getRequestErrorMessage(error))
    } finally {
      setIsSavingProfile(false)
    }
  }

  async function handleComplete() {
    setErrorMessage('')
    setIsCompleting(true)

    try {
      await apiFetch('/api/v1/founder/profile', {
        method: 'PATCH',
        body: {
          onboardingCompleted: true,
        },
      })
      await refetch()
      posthog.capture('onboarding_completed', {
        role: 'FOUNDER',
      })
      router.replace('/dashboard')
    } catch (error) {
      setErrorMessage(getRequestErrorMessage(error))
    } finally {
      setIsCompleting(false)
    }
  }

  const footer = (
    <div className="mt-10 flex flex-col-reverse gap-3 border-t border-[#efe8e1] pt-6 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
      <button
        type="button"
        onClick={() => {
          setErrorMessage('')
          setStep((currentStep) => Math.max(1, currentStep - 1) as FounderOnboardingStep)
        }}
        disabled={step === 1 || isSavingProfile || isCompleting}
        className={onboardingGhostButtonClass}
      >
        Back
      </button>

      {step === 5 ? (
        <button
          type="button"
          onClick={() => void handleComplete()}
          disabled={isCompleting}
          className={onboardingPrimaryButtonClass}
        >
          {isCompleting ? <SpinnerIcon className="h-5 w-5" /> : null}
          Go to Dashboard
        </button>
      ) : (
        <button
          type="button"
          onClick={() => void handleNext()}
          disabled={isSavingProfile}
          className={onboardingPrimaryButtonClass}
        >
          {isSavingProfile ? <SpinnerIcon className="h-5 w-5" /> : null}
          {step === 1 ? 'Get Started' : 'Next'}
        </button>
      )}
    </div>
  )

  return (
    <OnboardingShell step={step} totalSteps={5}>
      {step === 1 ? (
        <div className="space-y-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#fff4ef] px-4 py-2 text-[0.72rem] font-black uppercase tracking-[0.2em] text-[#d97757] dark:bg-[#d97757]/10 dark:text-[#f2b29d]">
            <span className="material-symbols-outlined text-base">rocket_launch</span>
            Founder setup
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-black tracking-tight text-[#1a1625] dark:text-white sm:text-5xl">
              Welcome to Solutionizing{displayName.trim() ? `, ${displayName.trim()}` : ''}
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-8 text-[#6b687a] dark:text-gray-400">
              The fastest way to get real feedback on your product from real testers.
            </p>
          </div>
          {errorMessage ? <p className="text-sm text-[#c4673f]">{errorMessage}</p> : null}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => void handleNext()}
              disabled={isSavingProfile}
              className={onboardingPrimaryButtonClass}
            >
              {isSavingProfile ? <SpinnerIcon className="h-5 w-5" /> : null}
              Get Started
            </button>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div>
          <div className="max-w-2xl">
            <h1 className="text-4xl font-black tracking-tight text-[#1a1625] dark:text-white">Here&apos;s how it works</h1>
            <p className="mt-3 text-lg leading-8 text-[#6b687a] dark:text-gray-400">
              Launching your first mission only takes a few moves, and we keep the workflow structured from the start.
            </p>
          </div>

          <div className="mt-8 space-y-5">
            {founderHowItWorks.map((item, index) => (
              <div
                key={item.title}
                className="flex gap-4 rounded-card border border-[#efe8e1] bg-[#fffdfa] p-5 dark:border-gray-800 dark:bg-gray-950/60"
              >
                <div className="flex flex-col items-center gap-3">
                  <OnboardingStepIcon icon={item.icon} />
                  {index < founderHowItWorks.length - 1 ? (
                    <div className="h-full w-px bg-[#ead8cf] dark:bg-gray-800" />
                  ) : null}
                </div>
                <div className="pt-1">
                  <div className="text-[0.7rem] font-black uppercase tracking-[0.2em] text-[#9b98a8] dark:text-gray-500">
                    Step {index + 1}
                  </div>
                  <h2 className="mt-2 text-xl font-black text-[#1a1625] dark:text-white">{item.title}</h2>
                  <p className="mt-2 text-sm leading-7 text-[#6b687a] dark:text-gray-400">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          {errorMessage ? <p className="mt-6 text-sm text-[#c4673f]">{errorMessage}</p> : null}
          {footer}
        </div>
      ) : null}

      {step === 3 ? (
        <div>
          <div className="max-w-2xl">
            <h1 className="text-4xl font-black tracking-tight text-[#1a1625] dark:text-white">Tell us about yourself</h1>
            <p className="mt-3 text-lg leading-8 text-[#6b687a] dark:text-gray-400">
              These details show up across your founder workspace and mission setup flow.
            </p>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <label className="block space-y-3">
              <span className="text-[0.72rem] font-black uppercase tracking-[0.22em] text-[#9b98a8] dark:text-gray-400">
                Display Name
              </span>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9b98a8] dark:text-gray-500">
                  <span className="material-symbols-outlined">person</span>
                </span>
                <input
                  type="text"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Your display name"
                  className={`${textFieldClass} pl-14`}
                />
              </div>
            </label>

            <label className="block space-y-3">
              <span className="text-[0.72rem] font-black uppercase tracking-[0.22em] text-[#9b98a8] dark:text-gray-400">
                Company Name
              </span>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9b98a8] dark:text-gray-500">
                  <span className="material-symbols-outlined">apartment</span>
                </span>
                <input
                  type="text"
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                  placeholder="Your company name"
                  className={`${textFieldClass} pl-14`}
                />
              </div>
            </label>
          </div>

          {errorMessage ? <p className="mt-6 text-sm text-[#c4673f]">{errorMessage}</p> : null}
          {footer}
        </div>
      ) : null}

      {step === 4 ? (
        <div>
          <div className="max-w-2xl">
            <h1 className="text-4xl font-black tracking-tight text-[#1a1625] dark:text-white">Fund your first mission</h1>
            <p className="mt-3 text-lg leading-8 text-[#6b687a] dark:text-gray-400">
              Pick a coin pack so you know how funding will work once payments go live.
            </p>
          </div>

          <div className="mt-6 rounded-card border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Coin purchases will be available soon. You can skip this step and buy coins from your dashboard later.
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {coinPacks.map((pack) => {
              const isSelected = selectedPack === pack.id

              return (
                <div
                  key={pack.id}
                  className={`rounded-card border p-6 transition-all ${
                    isSelected
                      ? 'border-[#d97757] bg-[#fff4ef] shadow-[0_22px_42px_-34px_rgba(217,119,87,0.6)] dark:bg-[#d97757]/10'
                      : 'border-[#efe8e1] bg-[#fffdfa] dark:border-gray-800 dark:bg-gray-950/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[0.72rem] font-black uppercase tracking-[0.22em] text-[#9b98a8] dark:text-gray-500">
                        {pack.name}
                      </div>
                      <div className="mt-4 text-3xl font-black text-[#1a1625] dark:text-white">{pack.coins}</div>
                    </div>
                    <ComingSoonPill />
                  </div>

                  <p className="mt-4 text-sm leading-7 text-[#6b687a] dark:text-gray-400">
                    This pack will be available once wallet funding goes live.
                  </p>

                  <button
                    type="button"
                    onClick={() => setSelectedPack(pack.id)}
                    className={`mt-6 w-full rounded-[1.25rem] px-4 py-3 text-sm font-black transition-colors ${
                      isSelected
                        ? 'bg-[#d97757] text-white hover:bg-[#c4673f]'
                        : 'border border-[#ead8cf] bg-white text-[#1a1625] hover:border-[#d97757] hover:text-[#d97757] dark:border-gray-700 dark:bg-gray-900 dark:text-white'
                    }`}
                  >
                    {isSelected ? 'Selected' : 'Select'}
                  </button>
                </div>
              )
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedPack(null)
              setErrorMessage('')
              setStep(5)
            }}
            className={`mt-5 ${onboardingGhostButtonClass}`}
          >
            Skip for now
          </button>

          {errorMessage ? <p className="mt-6 text-sm text-[#c4673f]">{errorMessage}</p> : null}
          {footer}
        </div>
      ) : null}

      {step === 5 ? (
        <div className="space-y-8 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#fff4ef] text-[#d97757] dark:bg-[#d97757]/10 dark:text-[#f2b29d]">
            <span className="material-symbols-outlined !text-[2.6rem]">check_circle</span>
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-black tracking-tight text-[#1a1625] dark:text-white">You&apos;re all set!</h1>
            <p className="mx-auto max-w-2xl text-lg leading-8 text-[#6b687a] dark:text-gray-400">
              Your profile is ready. Create your first mission and start collecting feedback.
            </p>
          </div>
          {selectedPack ? (
            <div className="mx-auto inline-flex rounded-full border border-[#ead8cf] bg-[#fff4ef] px-4 py-2 text-sm font-semibold text-[#d97757] dark:border-[#d97757]/30 dark:bg-[#d97757]/10 dark:text-[#f2b29d]">
              {coinPacks.find((pack) => pack.id === selectedPack)?.name} pack selected for later.
            </div>
          ) : null}
          {errorMessage ? <p className="text-sm text-[#c4673f]">{errorMessage}</p> : null}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => void handleComplete()}
              disabled={isCompleting}
              className={onboardingPrimaryButtonClass}
            >
              {isCompleting ? <SpinnerIcon className="h-5 w-5" /> : null}
              Go to Dashboard
            </button>
          </div>
        </div>
      ) : null}
    </OnboardingShell>
  )
}
