"use client"

import { PartyPopper, X } from 'lucide-react'
import { useEffect, useState } from 'react'

const welcomeStorageKey = 'welcomeSeen'

export function WelcomeBanner() {
  const [hasMounted, setHasMounted] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setHasMounted(true)

    try {
      setIsVisible(window.localStorage.getItem(welcomeStorageKey) !== 'true')
    } catch {
      setIsVisible(true)
    }
  }, [])

  function handleDismiss() {
    try {
      window.localStorage.setItem(welcomeStorageKey, 'true')
    } catch {
      // Ignore storage write errors and still hide the banner for this session.
    }

    setIsVisible(false)
  }

  if (!hasMounted || !isVisible) {
    return null
  }

  return (
    <div className="mb-6 flex items-start justify-between gap-4 rounded-[1.75rem] border border-[var(--border)] bg-[var(--bg-light)] px-5 py-4 shadow-[0_18px_40px_-34px_rgba(217,119,87,0.45)]">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--electric)] text-[var(--cream)]">
          <PartyPopper className="h-5 w-5" />
        </div>
        <div>
          <div className="text-[0.7rem] font-[family-name:var(--font-dm-mono)] uppercase tracking-[0.22em] text-[var(--ink-soft)]">
            Welcome
          </div>
          <p className="mt-1 font-['Satoshi'] text-sm font-semibold text-[var(--ink)]">
            Welcome to Solutionizing! 🎉 You&apos;re all set to get started.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss welcome banner"
        className="cursor-none rounded-full p-2 text-[var(--ink-soft)] transition-colors hover:bg-[var(--border)] hover:text-[var(--ink)]"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  )
}
