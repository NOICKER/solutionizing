"use client"

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
    <div className="mb-6 flex items-start justify-between gap-4 rounded-[1.75rem] border border-[#f0d4ca] bg-[#fff4ef] px-5 py-4 shadow-[0_18px_40px_-34px_rgba(217,119,87,0.45)] dark:border-[#d97757]/30 dark:bg-[#d97757]/10">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#d97757] text-white">
          <span className="material-symbols-outlined !text-xl">celebration</span>
        </div>
        <div>
          <div className="text-[0.7rem] font-black uppercase tracking-[0.22em] text-[#d97757] dark:text-[#f2b29d]">
            Welcome
          </div>
          <p className="mt-1 text-sm font-semibold text-[#1a1625] dark:text-white">
            Welcome to Solutionizing! 🎉 You&apos;re all set to get started.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss welcome banner"
        className="rounded-full p-2 text-[#8f857d] transition-colors hover:bg-white/70 hover:text-[#1a1625] dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
      >
        <span className="material-symbols-outlined !text-lg">close</span>
      </button>
    </div>
  )
}
