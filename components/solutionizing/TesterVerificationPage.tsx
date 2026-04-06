"use client"

import { CheckCircle2, Circle, CircleDot, Monitor, ShieldCheck, Smartphone, TabletSmartphone } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from '@/components/ui/sonner'
import { apiFetch, isApiClientError } from '@/lib/api/client'
import { preferredDeviceOptions, type PreferredDevice } from '@/components/solutionizing/tester/profileOptions'
import { testerBodyFont, testerDisplayFont } from '@/components/tester/testerTheme'
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
    <div className={`min-h-screen bg-[#faf9f7] ${testerBodyFont.className} p-8`}>
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 flex items-center justify-center">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#d77a57] to-[#c4673f]">
              <BrandMark className="h-7 w-7 text-white" />
            </div>
            <div>
              <div className="mb-1 text-xs text-[#9b98a8]">SOLUTIONIZING</div>
              <div className={`${testerDisplayFont.className} text-2xl font-black text-[#1a1625]`}>
                Tester Verification
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-panel border border-[#e5e4e0] bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            {successMessage ? <ShieldCheck className="h-10 w-10" /> : <ShieldCheck className="h-10 w-10" />}
          </div>

          <h1 className={`${testerDisplayFont.className} mb-4 text-3xl font-black text-[#1a1625]`}>
            {successMessage ? 'Device Verified' : 'Verify Your Device'}
          </h1>
          <p className="mx-auto mb-8 max-w-md text-lg text-[#6b687a]">
            {successMessage
              ? successMessage
              : 'Device verification ensures founders receive accurate technical feedback from confirmed environments.'}
          </p>

          {successMessage ? (
            <div className="mx-auto max-w-lg rounded-2xl border border-green-200 bg-green-50 p-6 text-left">
              <p className="text-sm font-semibold text-green-800">
                Your preferred device has been saved and your tester profile is ready for the dashboard.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="mx-auto max-w-lg rounded-2xl bg-[#f8f9fc] p-6 text-left">
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-[#9b98a8]">
                  Verification Steps
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                    <span className="font-medium text-[#1a1625]">Account created & verified</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CircleDot className="h-6 w-6 text-[#d77a57]" />
                    <span className="font-medium text-[#1a1625]">Choose the device you use for testing</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Circle className="h-6 w-6 text-[#d77a57]" />
                    <span className="font-medium text-[#1a1625]">Confirm your environment details</span>
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
                      className={`rounded-2xl border px-5 py-5 text-left transition-all ${
                        active
                          ? 'border-[#d77a57] bg-[#fff4ef] shadow-[0_20px_40px_-34px_rgba(215,122,87,0.7)]'
                          : 'border-[#e5e4e0] bg-white hover:border-[#dfcfc2] hover:bg-[#fffdfa]'
                      }`}
                    >
                      {(() => {
                        const iconClass = `h-6 w-6 mb-4 transition-colors ${active ? 'text-[#d77a57]' : 'text-[#8b8797]'}`
                        if (option.glyphName === 'Monitor') return <Monitor className={iconClass} />
                        if (option.glyphName === 'Smartphone') return <Smartphone className={iconClass} />
                        return <TabletSmartphone className={iconClass} />
                      })()}
                      <div className="text-sm font-black text-[#1a1625]">{option.label}</div>
                      <div className="mt-2 text-sm leading-6 text-[#6b687a]">{option.description}</div>
                    </button>
                  )
                })}
              </div>

              {error ? (
                <div className="mx-auto max-w-lg rounded-2xl border border-[#f1d3c7] bg-[#fff7f3] px-4 py-3 text-left text-sm text-[#c4673f]">
                  {error}
                </div>
              ) : null}

              <div className="flex flex-col items-center gap-4">
                <button
                  type="button"
                  onClick={() => void handleVerify()}
                  disabled={isSubmitting}
                  className="rounded-full bg-blue-600 px-8 py-3.5 text-sm font-black text-white shadow-lg transition-transform hover:scale-105 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? 'Verifying Device...' : 'Confirm Device'}
                </button>
                <p className="max-w-sm text-center text-xs text-[#9b98a8]">
                  We save your preferred test device and basic browser information to improve mission matching.
                </p>
              </div>
            </div>
          )}

          <div className="mt-8">
            <Link
              href="/dashboard/tester"
              className="inline-flex rounded-full border-2 border-[#e5e4e0] bg-white px-8 py-3 text-sm font-bold text-[#1a1625] transition-all hover:bg-[#f3f3f5]"
            >
              BACK TO DASHBOARD
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
