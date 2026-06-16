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
    <div className="fixed inset-x-0 bottom-0 z-[100] border-t border-[var(--border)] bg-white/95 px-4 py-4 shadow-[0_-18px_50px_-30px_rgba(26,22,37,0.35)] backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-sm text-[var(--ink)]">
          We use cookies and analytics to improve your experience. By continuing you agree to our{' '}
          <Link href="/privacy" className="font-semibold text-[var(--electric)] hover:text-[var(--electric)] cursor-none">
            Privacy Policy
          </Link>
          .
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => handleConsent('declined')}
            className="rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--border-strong)] hover:bg-[var(--cream)] cursor-none"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => handleConsent('accepted')}
            className="rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--ink)] cursor-none"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
