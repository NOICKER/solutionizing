"use client"

import Link from 'next/link'
import { useEffect, useState } from 'react'
import posthog from 'posthog-js'

const cookieConsentStorageKey = 'cookieConsent'

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const existingConsent = window.localStorage.getItem(cookieConsentStorageKey)
    setIsVisible(!existingConsent)
  }, [])

  function handleConsent(choice: 'accepted' | 'declined') {
    window.localStorage.setItem(cookieConsentStorageKey, choice)

    if (choice === 'accepted') {
      posthog.opt_in_capturing()
    } else {
      posthog.opt_out_capturing()
    }

    setIsVisible(false)
  }

  if (!isVisible) {
    return null
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] border-t border-[#e5e4e0] bg-white/95 px-4 py-4 shadow-[0_-18px_50px_-30px_rgba(26,22,37,0.35)] backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-sm text-[#4f4a59]">
          We use cookies and analytics to improve your experience. By continuing you agree to our{' '}
          <Link href="/privacy" className="font-semibold text-[#d77a57] hover:text-[#b95f3d]">
            Privacy Policy
          </Link>
          .
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => handleConsent('declined')}
            className="rounded-full border border-[#d9d5cf] px-5 py-2.5 text-sm font-semibold text-[#4f4a59] transition hover:border-[#c8c1b8] hover:bg-[#f8f6f3]"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => handleConsent('accepted')}
            className="rounded-full bg-[#1a1625] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2b2438]"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
