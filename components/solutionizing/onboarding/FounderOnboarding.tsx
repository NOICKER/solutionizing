"use client"

import { Building2, CheckCircle2, Coins, FlaskConical, Lightbulb, Rocket, SquarePen, User } from 'lucide-react'
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
    <div className="mt-10 flex flex-col-reverse gap-3 border-t border-border-subtle pt-6 sm:flex-row sm:items-center sm:justify-between">
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
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-[0.72rem] font-black uppercase tracking-[0.2em] text-primary">
            <Rocket className="h-4 w-4" />
            Founder setup
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-black tracking-tight text-text-main sm:text-5xl">
              Welcome to Solutionizing{displayName.trim() ? `, ${displayName.trim()}` : ''}
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-8 text-text-muted">
              The fastest way to get real feedback on your product from real testers.
            </p>
          </div>
          {errorMessage ? <p className="mt-6 text-sm text-red-500">{errorMessage}</p> : null}
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
            <h1 className="text-4xl font-black tracking-tight text-text-main">Here&apos;s how it works</h1>
            <p className="mt-3 text-lg leading-8 text-text-muted">
              Launching your first mission only takes a few moves, and we keep the workflow structured from the start.
            </p>
          </div>

          <div className="mt-8 space-y-5">
            {founderHowItWorks.map((item, index) => (
              <div
                key={item.title}
                className="flex gap-4 rounded-card border border-border-subtle bg-surface-elevated p-5"
              >
                <div className="flex flex-col items-center gap-3">
                  <OnboardingStepIcon icon={item.icon} />
                  {index < founderHowItWorks.length - 1 ? (
                    <div className="h-full w-px bg-border-subtle" />
                  ) : null}
                </div>
                <div className="pt-1">
                  <div className="text-[0.7rem] font-black uppercase tracking-[0.2em] text-text-muted">
                    Step {index + 1}
                  </div>
                  <h2 className="mt-2 text-xl font-black text-text-main">{item.title}</h2>
                  <p className="mt-2 text-sm leading-7 text-text-muted">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          {errorMessage ? <p className="mt-6 text-sm text-red-500">{errorMessage}</p> : null}
          {footer}
        </div>
      ) : null}

      {step === 3 ? (
        <div>
          <div className="max-w-2xl">
            <h1 className="text-4xl font-black tracking-tight text-text-main">Tell us about yourself</h1>
            <p className="mt-3 text-lg leading-8 text-text-muted">
              These details show up across your founder workspace and mission setup flow.
            </p>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <label className="block space-y-3">
              <span className="text-[0.72rem] font-black uppercase tracking-[0.22em] text-text-muted">
                Display Name
              </span>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                  <User className="h-6 w-6" />
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
              <span className="text-[0.72rem] font-black uppercase tracking-[0.22em] text-text-muted">
                Company Name
              </span>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                  <Building2 className="h-6 w-6" />
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

          {errorMessage ? <p className="mt-6 text-sm text-red-500">{errorMessage}</p> : null}
          {footer}
        </div>
      ) : null}

      {step === 4 ? (
        <div>
          <div className="max-w-2xl">
            <h1 className="text-4xl font-black tracking-tight text-text-main">Fund your first mission</h1>
            <p className="mt-3 text-lg leading-8 text-text-muted">
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
                      ? 'border-primary bg-primary/10 shadow-[0_22px_42px_-34px_rgba(217,119,87,0.6)]'
                      : 'border-border-subtle bg-surface-elevated'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[0.72rem] font-black uppercase tracking-[0.22em] text-text-muted">
                        {pack.name}
                      </div>
                      <div className="mt-4 text-3xl font-black text-text-main">{pack.coins}</div>
                    </div>
                    <ComingSoonPill />
                  </div>

                  <p className="mt-4 text-sm leading-7 text-text-muted">
                    This pack will be available once wallet funding goes live.
                  </p>

                  <button
                    type="button"
                    onClick={() => setSelectedPack(pack.id)}
                    className={`mt-6 w-full rounded-[1.25rem] px-4 py-3 text-sm font-black transition-colors ${
                      isSelected
                        ? 'bg-primary text-white hover:bg-primary-hover'
                        : 'border border-border-subtle bg-surface text-text-main hover:border-primary hover:text-primary'
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

          {errorMessage ? <p className="mt-6 text-sm text-red-500">{errorMessage}</p> : null}
          {footer}
        </div>
      ) : null}

      {step === 5 ? (
        <div className="space-y-8 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-black tracking-tight text-text-main">You&apos;re all set!</h1>
            <p className="mx-auto max-w-2xl text-lg leading-8 text-text-muted">
              Your profile is ready. Create your first mission and start collecting feedback.
            </p>
          </div>
          {selectedPack ? (
            <div className="mx-auto inline-flex rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
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
