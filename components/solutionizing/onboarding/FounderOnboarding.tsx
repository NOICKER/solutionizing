"use client"

import { Building2, CheckCircle2, Coins, FlaskConical, Lightbulb, Rocket, SquarePen, User } from 'lucide-react'
import posthog from 'posthog-js'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { apiFetch, isApiClientError } from '@/lib/api/client'
import { SpinnerIcon } from '@/components/solutionizing/ui'
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
    icon: <Coins className="h-5 w-5" />,
    title: 'Buy coins',
    description: 'Top up your workspace so each mission is funded before it goes live.',
  },
  {
    icon: <SquarePen className="h-5 w-5" />,
    title: 'Create a mission',
    description: 'Define what you want tested and the exact questions you want answered.',
  },
  {
    icon: <FlaskConical className="h-5 w-5" />,
    title: 'Testers test your product',
    description: 'Qualified testers walk through your product and document what they find.',
  },
  {
    icon: <Lightbulb className="h-5 w-5" />,
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
    <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[var(--border)] pt-6 sm:mt-10 sm:flex-row sm:items-center sm:justify-between">
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
          disabled={isSavingProfile || isCompleting}
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
          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--electric-dim)] px-4 py-2 text-[0.72rem] font-[family-name:var(--font-dm-mono)] uppercase tracking-[0.1em] text-[var(--electric)]">
            <Rocket className="h-4 w-4" />
            Founder setup
          </div>
          <div className="space-y-4">
            <h1 className="font-[family-name:var(--font-fraunces)] italic font-normal text-[var(--ink)] text-3xl sm:text-5xl">
              Welcome to Solutionizing{displayName.trim() ? `, ${displayName.trim()}` : ''}
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-8 text-[var(--ink-soft)]">
              The fastest way to get real feedback on your product from real testers.
            </p>
          </div>
          {errorMessage ? <p className="mt-6 text-sm text-[#c0392b]">{errorMessage}</p> : null}
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
            <h1 className="font-[family-name:var(--font-fraunces)] italic font-normal text-[var(--ink)] text-2xl sm:text-4xl">Here&apos;s how it works</h1>
            <p className="mt-3 text-lg leading-8 text-[var(--ink-soft)]">
              Launching your first mission only takes a few moves, and we keep the workflow structured from the start.
            </p>
          </div>

          <div className="mt-8 space-y-5">
            {founderHowItWorks.map((item, index) => (
              <div
                key={item.title}
                className="flex gap-4 rounded-[12px] border border-[var(--border)] bg-[var(--cream)] p-4 sm:p-5"
              >
                <div className="flex flex-col items-center gap-3">
                  <OnboardingStepIcon icon={item.icon} />
                  {index < founderHowItWorks.length - 1 ? (
                    <div className="h-full w-px bg-[var(--border)]" />
                  ) : null}
                </div>
                <div className="pt-1">
                  <div className="text-[0.68rem] font-[family-name:var(--font-dm-mono)] uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                    Step {index + 1}
                  </div>
                  <h2 className="mt-2 font-semibold text-[var(--ink)] text-xl">{item.title}</h2>
                  <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          {errorMessage ? <p className="mt-6 text-sm text-[#c0392b]">{errorMessage}</p> : null}
          {footer}
        </div>
      ) : null}

      {step === 3 ? (
        <div>
          <div className="max-w-2xl">
            <h1 className="font-[family-name:var(--font-fraunces)] italic font-normal text-[var(--ink)] text-2xl sm:text-4xl">Tell us about yourself</h1>
            <p className="mt-3 text-lg leading-8 text-[var(--ink-soft)]">
              These details show up across your founder workspace and mission setup flow.
            </p>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <label className="block space-y-3">
              <span className="text-[0.68rem] font-[family-name:var(--font-dm-mono)] uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                Display Name
              </span>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-soft)]">
                  <User className="h-6 w-6" />
                </span>
                <input
                  type="text"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Your display name"
                  className="w-full rounded-[8px] border border-[var(--border-strong)] bg-[var(--bg)] px-4 py-3 pl-14 text-[var(--ink)] placeholder:text-[var(--ink-soft)] focus:border-[var(--electric)] focus:outline-none focus:ring-1 focus:ring-[var(--electric-dim)] cursor-none"
                />
              </div>
            </label>

            <label className="block space-y-3">
              <span className="text-[0.68rem] font-[family-name:var(--font-dm-mono)] uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                Company Name
              </span>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-soft)]">
                  <Building2 className="h-6 w-6" />
                </span>
                <input
                  type="text"
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                  placeholder="Your company name"
                  className="w-full rounded-[8px] border border-[var(--border-strong)] bg-[var(--bg)] px-4 py-3 pl-14 text-[var(--ink)] placeholder:text-[var(--ink-soft)] focus:border-[var(--electric)] focus:outline-none focus:ring-1 focus:ring-[var(--electric-dim)] cursor-none"
                />
              </div>
            </label>
          </div>

          {errorMessage ? <p className="mt-6 text-sm text-[#c0392b]">{errorMessage}</p> : null}
          {footer}
        </div>
      ) : null}

      {step === 4 ? (
        <div>
          <div className="max-w-2xl">
            <h1 className="font-[family-name:var(--font-fraunces)] italic font-normal text-[var(--ink)] text-2xl sm:text-4xl">Fund your first mission</h1>
            <p className="mt-3 text-lg leading-8 text-[var(--ink-soft)]">
              Pick a coin pack so you know how funding will work once payments go live.
            </p>
          </div>

          <div className="mt-6 rounded-[8px] border border-[rgba(251,191,36,0.3)] bg-[rgba(251,191,36,0.12)] px-4 py-3 text-sm text-[#92400e]">
            Coin purchases will be available soon. You can skip this step and buy coins from your dashboard later.
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 lg:grid-cols-3">
            {coinPacks.map((pack) => {
              const isSelected = selectedPack === pack.id

              return (
                <div
                  key={pack.id}
                  className={`rounded-[12px] p-4 sm:p-6 transition-all cursor-none ${
                    isSelected
                      ? 'border-2 border-[var(--electric)] bg-[var(--electric-dim)] shadow-[0_16px_48px_-24px_rgba(255,107,26,0.2)]'
                      : 'border border-[var(--border)] bg-[var(--cream)] hover:border-[var(--electric)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[0.68rem] font-[family-name:var(--font-dm-mono)] uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                        {pack.name}
                      </div>
                      <div className="mt-4 text-3xl font-[family-name:var(--font-fraunces)] font-bold text-[var(--ink)]">{pack.coins}</div>
                    </div>
                    <ComingSoonPill />
                  </div>

                  <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">
                    This pack will be available once wallet funding goes live.
                  </p>

                  <button
                    type="button"
                    onClick={() => setSelectedPack(pack.id)}
                    className={`mt-6 w-full rounded-xl px-4 py-3 text-sm font-bold transition-colors cursor-none ${
                      isSelected
                        ? 'bg-[var(--electric)] text-[var(--cream)] hover:opacity-90'
                        : 'border border-[var(--border-strong)] bg-transparent text-[var(--ink-soft)] hover:border-[var(--electric)] hover:text-[var(--electric)]'
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
            onClick={() => void handleComplete()}
            disabled={isCompleting}
            className={`mt-5 ${onboardingGhostButtonClass} cursor-none`}
          >
            Continue without bank details
          </button>

          {errorMessage ? <p className="mt-6 text-sm text-[#c0392b]">{errorMessage}</p> : null}
          {footer}
        </div>
      ) : null}

      {step === 5 ? (
        <div className="space-y-8 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[var(--electric-dim)] text-[var(--electric)]">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <div className="space-y-4">
            <h1 className="font-[family-name:var(--font-fraunces)] italic font-normal text-[var(--ink)] text-3xl sm:text-4xl">You&apos;re all set!</h1>
            <p className="mx-auto max-w-2xl text-lg leading-8 text-[var(--ink-soft)]">
              Your profile is ready. Create your first mission and start collecting feedback.
            </p>
          </div>
          {selectedPack ? (
            <div className="mx-auto inline-flex rounded-full border border-[var(--electric-mid)] bg-[var(--electric-dim)] px-4 py-2 font-[family-name:var(--font-dm-mono)] uppercase tracking-[0.1em] text-[var(--electric)]">
              {coinPacks.find((pack) => pack.id === selectedPack)?.name} pack selected for later.
            </div>
          ) : null}
          {errorMessage ? <p className="text-sm text-[#c0392b]">{errorMessage}</p> : null}
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
