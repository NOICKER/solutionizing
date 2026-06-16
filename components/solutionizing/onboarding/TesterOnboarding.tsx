"use client"

import { CheckCircle2, Coins, FlaskConical, MessageSquare, Monitor, ShieldCheck, Smartphone, TabletSmartphone, UserSearch } from 'lucide-react'
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
import {
  hasPayoutFieldErrors,
  serializePayoutDetails,
  validatePayoutDetails,
  type BankTransferPayoutDetails,
  type PayoutField,
  type PayoutFieldErrors,
} from '@/lib/payout-details'

type TesterOnboardingStep = 1 | 2 | 3 | 4 | 5

interface TesterOnboardingProps {
  initialDisplayName: string
  initialExpertiseTags: string[]
  initialPreferredDevice: PreferredDevice | null
}

const testerHowItWorks = [
  {
    icon: <UserSearch className="h-5 w-5" />,
    title: 'Get matched with missions',
    description: 'We look at your skills and device setup so the right missions reach you first.',
  },
  {
    icon: <FlaskConical className="h-5 w-5" />,
    title: 'Test the product',
    description: 'Work through the product flow and capture what feels confusing, strong, or broken.',
  },
  {
    icon: <MessageSquare className="h-5 w-5" />,
    title: 'Give structured feedback',
    description: 'Submit clear, actionable answers that founders can actually use.',
  },
  {
    icon: <Coins className="h-5 w-5" />,
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

const inputClass =
  'w-full rounded-[8px] border border-[var(--border-strong)] bg-[var(--bg)] px-4 py-3 text-[var(--ink)] placeholder:text-[var(--ink-soft)] focus:border-[var(--electric)] focus:outline-none focus:ring-1 focus:ring-[var(--electric-dim)] cursor-none'

function BankingDetailsStepSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="max-w-2xl space-y-3">
        <div className="h-5 w-32 rounded-full bg-[var(--cream)]" />
        <div className="h-10 w-full max-w-xl rounded-3xl bg-[var(--cream)]" />
        <div className="h-5 w-full max-w-2xl rounded-full bg-[var(--cream)]" />
      </div>

      <div className="rounded-[16px] border border-[var(--border)] bg-[var(--bg-light)] p-6">
        <div className="space-y-4">
          <div className="h-4 w-40 rounded-full bg-[var(--border)]" />
          <div className="h-14 rounded-[12px] bg-[var(--border)]" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-3">
              <div className="h-4 w-32 rounded-full bg-[var(--border)]" />
              <div className="h-14 rounded-[12px] bg-[var(--border)]" />
            </div>
            <div className="space-y-3">
              <div className="h-4 w-24 rounded-full bg-[var(--border)]" />
              <div className="h-14 rounded-[12px] bg-[var(--border)]" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[16px] border border-[var(--border)] bg-[var(--bg-light)] p-5">
        <div className="h-4 w-full max-w-xl rounded-full bg-[var(--border)]" />
        <div className="mt-3 h-4 w-full max-w-lg rounded-full bg-[var(--border)]" />
      </div>
    </div>
  )
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
  const [accountHolderName, setAccountHolderName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [ifscCode, setIfscCode] = useState('')
  const [bankFieldErrors, setBankFieldErrors] = useState<PayoutFieldErrors>({})
  const [errorMessage, setErrorMessage] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingBankDetails, setIsSavingBankDetails] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)

  async function handleNext() {
    setErrorMessage('')
    setBankFieldErrors({})

    if (step === 1 || step === 2) {
      setStep((currentStep) => (currentStep + 1) as TesterOnboardingStep)
      return
    }

    if (step === 3) {
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

      return
    }

    const bankDetailsDraft: BankTransferPayoutDetails = {
      method: 'BANK_TRANSFER',
      accountHolderName,
      accountNumber,
      ifscCode,
    }
    const nextBankFieldErrors = validatePayoutDetails(bankDetailsDraft)

    if (hasPayoutFieldErrors(nextBankFieldErrors)) {
      setBankFieldErrors(nextBankFieldErrors)
      const firstError = Object.values(nextBankFieldErrors).find(Boolean)
      setErrorMessage(firstError ?? 'Enter your banking details to continue.')
      return
    }

    setIsSavingBankDetails(true)

    try {
      await apiFetch('/api/v1/tester/profile', {
        method: 'PATCH',
        body: {
          payoutDetails: serializePayoutDetails(bankDetailsDraft),
        },
      })
      await refetch()
      setStep(5)
    } catch (error) {
      setErrorMessage(getRequestErrorMessage(error))
    } finally {
      setIsSavingBankDetails(false)
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

  function handleBankFieldChange(field: PayoutField, value: string) {
    setErrorMessage('')
    setBankFieldErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
    }))

    if (field === 'accountHolderName') {
      setAccountHolderName(value)
      return
    }

    if (field === 'accountNumber') {
      setAccountNumber(value.replace(/\D/g, ''))
      return
    }

    setIfscCode(value.toUpperCase())
  }

  function getVisibleBankFieldError(field: PayoutField) {
    return bankFieldErrors[field]
  }

  const footer = (
    <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[var(--border)] pt-6 sm:mt-10 sm:flex-row sm:items-center sm:justify-between">
      <button
        type="button"
        onClick={() => {
          setErrorMessage('')
          setBankFieldErrors({})
          setStep((currentStep) => Math.max(1, currentStep - 1) as TesterOnboardingStep)
        }}
        disabled={step === 1 || isSavingProfile || isSavingBankDetails || isCompleting}
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {step === 4 && (
            <button
              type="button"
              onClick={() => {
                setErrorMessage('')
                setBankFieldErrors({})
                setStep(5)
              }}
              disabled={isSavingBankDetails}
              className="px-4 py-3 font-[family-name:var(--font-dm-mono)] text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)] cursor-none"
            >
              Continue without bank details
            </button>
          )}
          <button
            type="button"
            onClick={() => void handleNext()}
            disabled={isSavingProfile || isSavingBankDetails}
            className={onboardingPrimaryButtonClass}
          >
            {isSavingProfile || isSavingBankDetails ? <SpinnerIcon className="h-5 w-5" /> : null}
            {step === 1
              ? 'Get Started'
              : step === 3
                ? 'Save Profile'
                : step === 4
                  ? 'Save Banking Details'
                  : 'Next'}
          </button>
        </div>
      )}
    </div>
  )

  return (
    <OnboardingShell step={step} totalSteps={5}>
      {step === 1 ? (
        <div className="space-y-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--electric-dim)] px-4 py-2 text-[0.72rem] font-[family-name:var(--font-dm-mono)] uppercase tracking-[0.1em] text-[var(--electric)]">
            <ShieldCheck className="h-4 w-4" />
            Tester setup
          </div>
          <div className="space-y-4">
            <h1 className="font-[family-name:var(--font-fraunces)] italic font-normal text-[var(--ink)] text-3xl sm:text-5xl">
              Welcome to Solutionizing{initialDisplayName.trim() ? `, ${initialDisplayName.trim()}` : ''}
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-8 text-[var(--ink-soft)]">
              Test real products, give real feedback, and earn coins you can withdraw as cash.
            </p>
          </div>
          {errorMessage ? <p className="text-sm text-[#c0392b]">{errorMessage}</p> : null}
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
              The platform is built to get you into the right missions quickly and reward strong feedback.
            </p>
          </div>

          <div className="mt-8 space-y-5">
            {testerHowItWorks.map((item, index) => (
              <div
                key={item.title}
                className="flex gap-4 rounded-[12px] border border-[var(--border)] bg-[var(--cream)] p-4 sm:p-5"
              >
                <div className="flex flex-col items-center gap-3">
                  <OnboardingStepIcon icon={item.icon} />
                  {index < testerHowItWorks.length - 1 ? (
                    <div className="h-full w-px bg-[var(--border)]" />
                  ) : null}
                </div>
                <div className="pt-1">
                  <div className="text-[0.68rem] font-[family-name:var(--font-dm-mono)] uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                    Step {index + 1}
                  </div>
                  <h2 className="mt-2 font-[family-name:var(--font-fraunces)] italic font-normal text-[var(--ink)] text-xl">{item.title}</h2>
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
            <h1 className="font-[family-name:var(--font-fraunces)] italic font-normal text-[var(--ink)] text-2xl sm:text-4xl">Set up your tester profile</h1>
            <p className="mt-3 text-lg leading-8 text-[var(--ink-soft)]">
              Pick the spaces where your feedback is strongest and tell us the devices you use most.
            </p>
          </div>

          <div className="mt-8 grid gap-8">
            <section className="space-y-4">
              <div>
                <div className="text-[0.68rem] font-[family-name:var(--font-dm-mono)] uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                  Expertise Tags
                </div>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">
                  Highlight the kinds of products and spaces where your feedback is strongest.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xl:grid-cols-3">
                {expertiseTagOptions.map((tag) => {
                  const active = expertiseTags.includes(tag)

                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleExpertiseToggle(tag)}
                      aria-pressed={active}
                      className={`rounded-full border px-4 py-3 text-left text-sm font-bold transition-all cursor-none ${
                        active
                          ? 'border-[var(--electric)] bg-[var(--electric-dim)] text-[var(--electric)]'
                          : 'border-[var(--border)] bg-[var(--cream)] text-[var(--ink-soft)] hover:border-[var(--electric)] hover:text-[var(--ink)]'
                      }`}
                    >
                      {tag}
                    </button>
                  )
                })}
              </div>

              <div className="text-sm text-[var(--ink-soft)]">{expertiseTags.length}/10 tags selected.</div>
            </section>

            <section className="space-y-4">
              <div>
                <div className="text-[0.68rem] font-[family-name:var(--font-dm-mono)] uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                  Device Profile
                </div>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">
                  Choose the setup you use most often so new missions can be matched to the right context.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:grid-cols-3">
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
                      className={`rounded-[12px] border px-4 py-4 text-left transition-all cursor-none ${
                        active
                          ? 'border-[var(--electric)] bg-[var(--electric-dim)]'
                          : 'border-[var(--border)] bg-[var(--cream)] hover:border-[var(--electric)]'
                      }`}
                    >
                      {(() => {
                        const iconClass = `h-7 w-7 transition-colors ${active ? 'text-[var(--electric)]' : 'text-[var(--ink-soft)]'}`
                        if (option.glyphName === 'Monitor') return <Monitor className={iconClass} />
                        if (option.glyphName === 'Smartphone') return <Smartphone className={iconClass} />
                        return <TabletSmartphone className={iconClass} />
                      })()}
                      <div>
                        <div className="text-sm font-semibold text-[var(--ink)]">{option.label}</div>
                        <div className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{option.description}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>
          </div>

          {errorMessage ? <p className="mt-6 text-sm text-[#c0392b]">{errorMessage}</p> : null}
          {footer}
        </div>
      ) : null}

      {step === 4 ? (
        isSavingBankDetails ? (
          <BankingDetailsStepSkeleton />
        ) : (
          <div>
            <div className="max-w-2xl">
              <h1 className="font-[family-name:var(--font-fraunces)] italic font-normal text-[var(--ink)] text-2xl sm:text-4xl">Add your banking details</h1>
              <p className="mt-3 text-lg leading-8 text-[var(--ink-soft)]">
                These details are used only for tester withdrawals so payouts can be processed without chasing you later.
              </p>
            </div>

            <div className="mt-8 grid gap-6">
              <section className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--cream)] p-6">
                <div className="space-y-5">
                  <div>
                    <div className="text-[0.68rem] font-[family-name:var(--font-dm-mono)] uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                      Bank transfer details
                    </div>
                    <p className="mt-2 text-sm text-[var(--ink-soft)]">
                      Enter the bank account where you want your withdrawals sent.
                    </p>
                  </div>

                  <div className="grid gap-4">
                    <div>
                      <label className="mb-2 block text-[0.68rem] font-[family-name:var(--font-dm-mono)] uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                        Account Holder Name
                      </label>
                      <input
                        type="text"
                        value={accountHolderName}
                        onChange={(event) => handleBankFieldChange('accountHolderName', event.target.value)}
                        placeholder="Aarav Sharma"
                        autoComplete="name"
                        className={inputClass}
                      />
                      {getVisibleBankFieldError('accountHolderName') ? (
                        <p className="mt-2 text-sm text-[#c0392b]">{getVisibleBankFieldError('accountHolderName')}</p>
                      ) : null}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="mb-2 block text-[0.68rem] font-[family-name:var(--font-dm-mono)] uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                          Account Number
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={accountNumber}
                          onChange={(event) => handleBankFieldChange('accountNumber', event.target.value)}
                          placeholder="123456789012"
                          autoComplete="off"
                          className={inputClass}
                        />
                        {getVisibleBankFieldError('accountNumber') ? (
                          <p className="mt-2 text-sm text-[#c0392b]">{getVisibleBankFieldError('accountNumber')}</p>
                        ) : null}
                      </div>

                      <div>
                        <label className="mb-2 block text-[0.68rem] font-[family-name:var(--font-dm-mono)] uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                          IFSC Code
                        </label>
                        <input
                          type="text"
                          value={ifscCode}
                          onChange={(event) => handleBankFieldChange('ifscCode', event.target.value)}
                          placeholder="HDFC0123456"
                          autoComplete="off"
                          className={inputClass}
                        />
                        {getVisibleBankFieldError('ifscCode') ? (
                          <p className="mt-2 text-sm text-[#c0392b]">{getVisibleBankFieldError('ifscCode')}</p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--cream)] p-5">
                <div className="flex items-start gap-4">
                  <ShieldCheck className="h-6 w-6 text-[var(--electric)]" />
                  <div className="pt-1">
                    <div className="text-sm font-semibold text-[var(--ink)]">Security reassurance</div>
                    <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">
                      Your banking details are encrypted at rest and used only when a withdrawal is processed. They are not shown to founders and are never included in mission data.
                    </p>
                  </div>
                </div>
              </section>
            </div>

            {errorMessage ? <p className="mt-6 text-sm text-[#c0392b]">{errorMessage}</p> : null}
            {footer}
          </div>
        )
      ) : null}

      {step === 5 ? (
        <div className="space-y-8 text-center mt-10">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[rgba(74,197,128,0.12)] text-[#1e7a47]">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <div>
            <h1 className="font-[family-name:var(--font-fraunces)] italic font-normal text-[var(--ink)] text-3xl sm:text-4xl">You&apos;re all set!</h1>
            <p className="mx-auto max-w-2xl text-lg leading-8 text-[var(--ink-soft)]">
              We&apos;ll match you with missions that fit your skills. Keep your availability on to get notified.
            </p>
          </div>
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
