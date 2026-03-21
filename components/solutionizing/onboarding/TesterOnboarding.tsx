"use client"

import posthog from 'posthog-js'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { apiFetch, isApiClientError } from '@/lib/api/client'
import { SpinnerIcon } from '@/components/solutionizing/ui'
import {
  OnboardingShell,
  OnboardingStepIcon,
  onboardingGhostButtonClass,
  onboardingPrimaryButtonClass,
} from '@/components/solutionizing/onboarding/OnboardingShell'
import {
  expertiseTagOptions,
  preferredDeviceOptions,
  type PreferredDevice,
} from '@/components/solutionizing/tester/profileOptions'

type TesterOnboardingStep = 1 | 2 | 3 | 4

interface TesterOnboardingProps {
  initialDisplayName: string
  initialExpertiseTags: string[]
  initialPreferredDevice: PreferredDevice | null
}

const testerHowItWorks = [
  {
    icon: 'person_search',
    title: 'Get matched with missions',
    description: 'We look at your skills and device setup so the right missions reach you first.',
  },
  {
    icon: 'experiment',
    title: 'Test the product',
    description: 'Work through the product flow and capture what feels confusing, strong, or broken.',
  },
  {
    icon: 'forum',
    title: 'Give structured feedback',
    description: 'Submit clear, actionable answers that founders can actually use.',
  },
  {
    icon: 'payments',
    title: 'Earn coins and withdraw',
    description: 'Complete missions, build trust, and cash out the coins you earn.',
  },
] as const

function getRequestErrorMessage(error: unknown) {
  if (isApiClientError(error) && error.code === 'NETWORK_ERROR') {
    return 'Check your internet connection'
  }

  if (isApiClientError(error)) {
    return error.message
  }

  return 'Something went wrong. Please try again.'
}

export function TesterOnboarding({
  initialDisplayName,
  initialExpertiseTags,
  initialPreferredDevice,
}: TesterOnboardingProps) {
  const router = useRouter()
  const { refetch } = useAuth()
  const [step, setStep] = useState<TesterOnboardingStep>(1)
  const [expertiseTags, setExpertiseTags] = useState<string[]>(initialExpertiseTags)
  const [preferredDevice, setPreferredDevice] = useState<PreferredDevice | null>(initialPreferredDevice)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)

  async function handleNext() {
    setErrorMessage('')

    if (step === 1 || step === 2) {
      setStep((currentStep) => (currentStep + 1) as TesterOnboardingStep)
      return
    }

    if (!preferredDevice) {
      setErrorMessage('Choose the device setup you use most often to continue.')
      return
    }

    setIsSavingProfile(true)

    try {
      await apiFetch('/api/v1/tester/profile', {
        method: 'PATCH',
        body: {
          expertiseTags,
          preferredDevice,
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
      await apiFetch('/api/v1/tester/profile', {
        method: 'PATCH',
        body: {
          onboardingCompleted: true,
        },
      })
      await refetch()
      posthog.capture('onboarding_completed', {
        role: 'TESTER',
      })
      router.replace('/dashboard')
    } catch (error) {
      setErrorMessage(getRequestErrorMessage(error))
    } finally {
      setIsCompleting(false)
    }
  }

  function handleExpertiseToggle(tag: string) {
    setErrorMessage('')
    setExpertiseTags((currentTags) => {
      if (currentTags.includes(tag)) {
        return currentTags.filter((item) => item !== tag)
      }

      if (currentTags.length >= 10) {
        return currentTags
      }

      return [...currentTags, tag]
    })
  }

  const footer = (
    <div className="mt-10 flex flex-col-reverse gap-3 border-t border-[#efe8e1] pt-6 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
      <button
        type="button"
        onClick={() => {
          setErrorMessage('')
          setStep((currentStep) => Math.max(1, currentStep - 1) as TesterOnboardingStep)
        }}
        disabled={step === 1 || isSavingProfile || isCompleting}
        className={onboardingGhostButtonClass}
      >
        Back
      </button>

      {step === 4 ? (
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
    <OnboardingShell step={step} totalSteps={4}>
      {step === 1 ? (
        <div className="space-y-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#fff4ef] px-4 py-2 text-[0.72rem] font-black uppercase tracking-[0.2em] text-[#d97757] dark:bg-[#d97757]/10 dark:text-[#f2b29d]">
            <span className="material-symbols-outlined text-base">verified_user</span>
            Tester setup
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-black tracking-tight text-[#1a1625] dark:text-white sm:text-5xl">
              Welcome to Solutionizing{initialDisplayName.trim() ? `, ${initialDisplayName.trim()}` : ''}
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-8 text-[#6b687a] dark:text-gray-400">
              Test real products, give real feedback, and earn coins you can withdraw as cash.
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
              The platform is built to get you into the right missions quickly and reward strong feedback.
            </p>
          </div>

          <div className="mt-8 space-y-5">
            {testerHowItWorks.map((item, index) => (
              <div
                key={item.title}
                className="flex gap-4 rounded-[1.75rem] border border-[#efe8e1] bg-[#fffdfa] p-5 dark:border-gray-800 dark:bg-gray-950/60"
              >
                <div className="flex flex-col items-center gap-3">
                  <OnboardingStepIcon icon={item.icon} />
                  {index < testerHowItWorks.length - 1 ? (
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
            <h1 className="text-4xl font-black tracking-tight text-[#1a1625] dark:text-white">Set up your tester profile</h1>
            <p className="mt-3 text-lg leading-8 text-[#6b687a] dark:text-gray-400">
              Pick the spaces where your feedback is strongest and tell us the devices you use most.
            </p>
          </div>

          <div className="mt-8 grid gap-8">
            <section className="space-y-4">
              <div>
                <div className="text-[0.72rem] font-black uppercase tracking-[0.22em] text-[#9b98a8] dark:text-gray-400">
                  Expertise Tags
                </div>
                <p className="mt-2 text-sm text-[#6b687a] dark:text-gray-400">
                  Highlight the kinds of products and spaces where your feedback is strongest.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {expertiseTagOptions.map((tag) => {
                  const active = expertiseTags.includes(tag)

                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleExpertiseToggle(tag)}
                      aria-pressed={active}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm font-bold transition-all ${
                        active
                          ? 'border-[#d77a57] bg-[#fff4ef] text-[#a85034] dark:bg-[#d77a57]/10'
                          : 'border-[#efe8e1] bg-[#fffdfa] text-[#6b687a] hover:border-[#dfcfc2] hover:text-[#1a1625] dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-white'
                      }`}
                    >
                      {tag}
                    </button>
                  )
                })}
              </div>

              <div className="text-sm text-[#8c8897] dark:text-gray-400">{expertiseTags.length}/10 tags selected.</div>
            </section>

            <section className="space-y-4">
              <div>
                <div className="text-[0.72rem] font-black uppercase tracking-[0.22em] text-[#9b98a8] dark:text-gray-400">
                  Device Profile
                </div>
                <p className="mt-2 text-sm text-[#6b687a] dark:text-gray-400">
                  Choose the setup you use most often so new missions can be matched to the right context.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {preferredDeviceOptions.map((option) => {
                  const active = preferredDevice === option.value

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setErrorMessage('')
                        setPreferredDevice(option.value)
                      }}
                      aria-pressed={active}
                      className={`rounded-2xl border px-4 py-4 text-left transition-all ${
                        active
                          ? 'border-[#d77a57] bg-[#fff4ef] shadow-[0_20px_40px_-34px_rgba(215,122,87,0.7)] dark:bg-[#d77a57]/10'
                          : 'border-[#efe8e1] bg-[#fffdfa] hover:border-[#dfcfc2] hover:bg-white dark:border-gray-700 dark:bg-gray-900/60 dark:hover:border-gray-600 dark:hover:bg-gray-800'
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined !mb-4 !text-[1.65rem] ${
                          active ? 'text-[#d77a57]' : 'text-[#8b8797]'
                        }`}
                      >
                        {option.glyph}
                      </span>
                      <div className="text-sm font-black text-[#1a1625] dark:text-white">{option.label}</div>
                      <div className="mt-2 text-sm leading-6 text-[#6b687a] dark:text-gray-400">{option.description}</div>
                    </button>
                  )
                })}
              </div>
            </section>
          </div>

          {errorMessage ? <p className="mt-6 text-sm text-[#c4673f]">{errorMessage}</p> : null}
          {footer}
        </div>
      ) : null}

      {step === 4 ? (
        <div className="space-y-8 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#fff4ef] text-[#d97757] dark:bg-[#d97757]/10 dark:text-[#f2b29d]">
            <span className="material-symbols-outlined !text-[2.6rem]">check_circle</span>
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-black tracking-tight text-[#1a1625] dark:text-white">You&apos;re all set!</h1>
            <p className="mx-auto max-w-2xl text-lg leading-8 text-[#6b687a] dark:text-gray-400">
              We&apos;ll match you with missions that fit your skills. Keep your availability on to get notified.
            </p>
          </div>
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
