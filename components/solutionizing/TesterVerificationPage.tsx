"use client"

import { CheckCircle2, Circle, CircleDot, Monitor, ShieldCheck, Smartphone, TabletSmartphone } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from '@/components/ui/sonner'
import { apiFetch, isApiClientError } from '@/lib/api/client'
import { preferredDeviceOptions, type PreferredDevice } from '@/components/solutionizing/tester/profileOptions'
import { testerBodyFont } from '@/components/tester/testerTheme'
import { BrandMark } from '@/components/solutionizing/ui'

interface VerifyTesterResponse {
  message: string
}

function getVerificationErrorMessage(error: unknown) {
  if (isApiClientError(error) && error.code === 'NETWORK_ERROR') {
    return 'Check your internet connection and try again.'
  }

  if (isApiClientError(error)) {
    return error.message
  }

  return 'Unable to verify your device right now. Please try again.'
}

export function TesterVerificationPage() {
  const [selectedDevice, setSelectedDevice] = useState<PreferredDevice>('desktop')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  async function handleVerify() {
    if (isSubmitting) {
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const response = await apiFetch<VerifyTesterResponse>('/api/v1/tester/profile/verify', {
        method: 'POST',
        body: {
          deviceType: selectedDevice,
          browserInfo: navigator.userAgent,
        },
      })

      setSuccessMessage(response.message)
      toast.success(response.message)
    } catch (requestError) {
      setError(getVerificationErrorMessage(requestError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={`min-h-screen bg-[var(--bg)] ${testerBodyFont.className} p-8`}>
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 flex items-center justify-center">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--electric-dim)] text-[var(--electric)]">
              <BrandMark className="h-7 w-7 text-[var(--electric)]" />
            </div>
            <div>
              <div className="mb-1 font-[family-name:var(--font-dm-mono)] text-[0.68rem] uppercase tracking-[0.1em] text-[var(--ink-soft)]">SOLUTIONIZING</div>
              <div className="font-[family-name:var(--font-fraunces)] italic font-normal text-[var(--ink)] text-2xl">
                Tester Verification
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[16px] border border-[var(--border)] bg-[var(--cream)] p-6 sm:p-8 w-full max-w-md mx-auto text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--electric-dim)] text-[var(--electric)]">
            <ShieldCheck className="h-10 w-10" />
          </div>

          <h1 className="font-[family-name:var(--font-fraunces)] italic font-normal text-[var(--ink)] text-2xl mb-4">
            {successMessage ? 'Device Verified' : 'Verify Your Device'}
          </h1>
          <p className="mx-auto mb-8 max-w-md text-lg text-[var(--ink-soft)]">
            {successMessage
              ? successMessage
              : 'Device verification ensures founders receive accurate technical feedback from confirmed environments.'}
          </p>

          {successMessage ? (
            <div className="mx-auto max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--bg-light)] p-6 text-left">
              <p className="text-sm font-semibold text-[var(--electric)]">
                Your preferred device has been saved and your tester profile is ready for the dashboard.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="mx-auto max-w-lg rounded-[16px] bg-[var(--bg-light)] p-6 text-left">
                <h3 className="mb-4 font-[family-name:var(--font-dm-mono)] text-[0.68rem] uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                  Verification Steps
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-[var(--electric)]" />
                    <span className="font-medium text-[var(--ink)]">Account created & verified</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CircleDot className="h-6 w-6 text-[var(--electric)]" />
                    <span className="font-medium text-[var(--ink)]">Choose the device you use for testing</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Circle className="h-6 w-6 text-[var(--electric)]" />
                    <span className="font-medium text-[var(--ink)]">Confirm your environment details</span>
                  </li>
                </ul>
              </div>

              <div className="mx-auto grid max-w-3xl gap-3 md:grid-cols-3">
                {preferredDeviceOptions.map((option) => {
                  const active = selectedDevice === option.value

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSelectedDevice(option.value)}
                      aria-pressed={active}
                      className={`rounded-2xl border px-5 py-5 text-left transition-all cursor-none ${
                        active
                          ? 'border-[var(--electric)] bg-[var(--bg-light)] shadow-sm'
                          : 'border-[var(--border)] bg-[var(--cream)] hover:border-[var(--electric)] hover:bg-[var(--bg-light)]'
                      }`}
                    >
                      {(() => {
                        const iconClass = `h-6 w-6 mb-4 transition-colors ${active ? 'text-[var(--electric)]' : 'text-[var(--ink-soft)]'}`
                        if (option.glyphName === 'Monitor') return <Monitor className={iconClass} />
                        if (option.glyphName === 'Smartphone') return <Smartphone className={iconClass} />
                        return <TabletSmartphone className={iconClass} />
                      })()}
                      <div className="text-sm font-bold text-[var(--ink)]">{option.label}</div>
                      <div className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{option.description}</div>
                    </button>
                  )
                })}
              </div>

              {error && (
                <div className="mx-auto max-w-lg rounded-2xl border border-[var(--border)] bg-[rgba(192,57,43,0.1)] px-4 py-3 text-left text-sm text-[#c0392b]">
                  {error}
                </div>
              )}

              <div className="flex flex-col items-center gap-4">
                <button
                  type="button"
                  onClick={() => void handleVerify()}
                  disabled={isSubmitting}
                  className="bg-[var(--electric)] text-[var(--cream)] rounded-xl px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90 cursor-none w-full disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? 'Verifying Device...' : 'Confirm Device'}
                </button>
                <p className="max-w-sm text-center text-xs text-[var(--ink-soft)]">
                  We save your preferred test device and basic browser information to improve mission matching.
                </p>
              </div>
            </div>
          )}

          <div className="mt-8">
            <Link
              href="/dashboard/tester"
              className="inline-flex justify-center border border-[var(--border-strong)] text-[var(--ink-soft)] rounded-xl px-6 py-3 text-sm font-semibold bg-transparent hover:border-[var(--electric)] hover:text-[var(--electric)] cursor-none w-full sm:w-auto"
            >
              BACK TO DASHBOARD
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
