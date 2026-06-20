"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RequireAuth } from '@/components/RequireAuth'
import {
  BrandMark,
  SpinnerIcon,
} from '@/components/solutionizing/ui'
import { useAuth } from '@/context/AuthContext'
import { apiFetch, isApiClientError } from '@/lib/api/client'
import { createBrowserClient } from '@supabase/ssr'

function SelectRoleContent() {
  const router = useRouter()
  const { user, refetch, applyRoleSelection } = useAuth()
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  )
  const [founderName, setFounderName] = useState('')
  const [testerName, setTesterName] = useState('')
  const [founderNameError, setFounderNameError] = useState('')
  const [testerNameError, setTesterNameError] = useState('')
  const [globalError, setGlobalError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [submittingRole, setSubmittingRole] = useState<'FOUNDER' | 'TESTER' | null>(null)
  const [activeRole, setActiveRole] = useState<'FOUNDER' | 'TESTER'>('FOUNDER')

  const founderIsActive = activeRole === 'FOUNDER'
  const testerIsActive = activeRole === 'TESTER'

  useEffect(() => {
    if (user?.role === 'FOUNDER') {
      router.replace('/onboarding')
      return
    }

    if (user?.role === 'TESTER') {
      router.replace('/onboarding')
    }
  }, [router, user?.role])

  function getPostSelectionPath() {
    return '/onboarding'
  }

  async function handleSelectRole(role: 'FOUNDER' | 'TESTER') {
    const displayName = role === 'FOUNDER' ? founderName.trim() : testerName.trim()

    setFounderNameError('')
    setTesterNameError('')
    setGlobalError('')

    if (displayName.length < 2) {
      const message = 'Display name must be at least 2 characters'

      if (role === 'FOUNDER') {
        setFounderNameError(message)
      } else {
        setTesterNameError(message)
      }

      return
    }

    setSubmittingRole(role)
    setIsLoading(true)

    try {
      await apiFetch('/api/v1/auth/select-role', {
        method: 'POST',
        body: {
          role,
          displayName,
        },
      })

      await supabase.auth.refreshSession()

      applyRoleSelection(role, displayName)
      void refetch()
      router.replace(getPostSelectionPath())
    } catch (error) {
      if (isApiClientError(error) && error.status === 409) {
        const resolvedRole =
          user?.role === 'FOUNDER' || user?.role === 'TESTER' ? user.role : role

        if (resolvedRole === role) {
          applyRoleSelection(role, displayName)
        }

        await supabase.auth.refreshSession()

        void refetch()
        router.replace(getPostSelectionPath())
        return
      }

      setGlobalError('Something went wrong. Please try again.')
      setIsLoading(false)
      setSubmittingRole(null)
    }
  }

  return (
    <main className="flex min-h-screen w-full relative">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between p-10 bg-[var(--dark)] min-h-screen fixed left-0 top-0 bottom-0">
        <div>
          <div className="flex items-center gap-3 text-[var(--cream)]">
            <BrandMark className="w-8 h-8" />
            <span className="font-[family-name:var(--font-fraunces)] italic text-2xl font-normal">Solutionizing</span>
          </div>
        </div>
        <div className="max-w-md">
          <p className="mb-5 text-[0.68rem] font-[family-name:var(--font-dm-mono)] uppercase tracking-[0.18em] text-[var(--cream)] opacity-40">
            CHOOSE YOUR ROLE
          </p>
          <h2 className="text-[var(--cream)] text-4xl font-[family-name:var(--font-fraunces)] italic font-normal leading-snug">
            How do you want to show up?
          </h2>
        </div>
        <div>
          <p className="text-[0.65rem] font-[family-name:var(--font-dm-mono)] uppercase tracking-[0.14em] text-[var(--cream)] opacity-25">
            Founders build. Testers validate.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="w-full ml-0 lg:ml-[45%] min-h-screen bg-[var(--bg)] flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-lg">
          {/* Mobile-only heading */}
          <div className="mb-8 text-center lg:hidden">
            <div className="mb-3 flex items-center justify-center gap-3">
              <BrandMark className="w-8 h-8 text-[var(--electric)]" />
              <span className="font-[family-name:var(--font-fraunces)] italic text-2xl font-normal text-[var(--ink)]">Solutionizing</span>
            </div>
            <h1 className="font-[family-name:var(--font-fraunces)] italic font-normal text-[var(--ink)] text-3xl mb-2">
              How do you want to show up?
            </h1>
            <p className="text-[var(--ink-soft)]">Choose your role to get started</p>
          </div>

          {/* Desktop heading */}
          <div className="hidden lg:block mb-8">
            <h1 className="font-[family-name:var(--font-fraunces)] italic font-normal text-[var(--ink)] text-3xl mb-2">
              Pick your path.
            </h1>
            <p className="text-[var(--ink-soft)]">Select the role that fits you best.</p>
          </div>

          {/* Role cards */}
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg">
            {/* Founder card */}
            <div
              onClick={() => setActiveRole('FOUNDER')}
              className={`rounded-[16px] border-2 p-6 flex-1 cursor-none transition-all ${founderIsActive
                  ? 'border-[var(--electric)] bg-[rgba(255,107,26,0.04)]'
                  : 'border-[var(--border)] bg-[var(--cream)] hover:border-[var(--electric)] hover:shadow-[0_8px_24px_rgba(28,16,8,0.08)]'
                }`}
            >
              <div className="mb-6 flex flex-col items-center text-center">
                <div
                  className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl transition-all ${founderIsActive
                      ? 'bg-[var(--electric-dim)] text-[var(--electric)]'
                      : 'bg-[var(--bg-light)] text-[var(--ink-soft)]'
                    }`}
                >
                  <svg
                    className="h-8 w-8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="mb-2 font-[family-name:var(--font-fraunces)] italic font-normal text-[var(--ink)] text-xl">I&apos;m a Founder</h2>
                <p className="text-sm text-[var(--ink-soft)]">
                  I have a product and need real feedback from real people
                </p>
              </div>

              <div className="mb-4">
                <label className="mb-2 block text-[0.68rem] font-[family-name:var(--font-dm-mono)] uppercase tracking-[0.1em] text-[var(--ink-soft)] cursor-none">
                  DISPLAY NAME
                </label>
                <input
                  type="text"
                  value={founderName}
                  onChange={(event) => setFounderName(event.target.value)}
                  onFocus={() => setActiveRole('FOUNDER')}
                  placeholder="Your first name"
                  className="w-full rounded-[8px] border border-[var(--border-strong)] bg-[var(--bg)] px-4 py-3 text-[var(--ink)] placeholder:text-[var(--ink-soft)] focus:border-[var(--electric)] focus:outline-none focus:ring-1 focus:ring-[var(--electric-dim)] cursor-none"
                />
                {founderNameError ? (
                  <p className="mt-1 text-sm text-[#c0392b]">{founderNameError}</p>
                ) : null}
              </div>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => {
                  setActiveRole('FOUNDER')
                  void handleSelectRole('FOUNDER')
                }}
                className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-base font-bold transition-all cursor-none disabled:opacity-50 ${founderIsActive
                    ? 'bg-[var(--electric)] text-[var(--cream)] hover:opacity-90'
                    : 'border-2 border-[var(--border-strong)] bg-transparent text-[var(--ink-soft)] hover:border-[var(--electric)] hover:text-[var(--electric)]'
                  }`}
              >
                {submittingRole === 'FOUNDER' && isLoading ? (
                  <SpinnerIcon className="h-5 w-5" />
                ) : null}
                CONTINUE AS FOUNDER {'->'}
              </button>
            </div>

            {/* Tester card */}
            <div
              onClick={() => setActiveRole('TESTER')}
              className={`rounded-[16px] border-2 p-6 flex-1 cursor-none transition-all ${testerIsActive
                  ? 'border-[var(--electric)] bg-[rgba(255,107,26,0.04)]'
                  : 'border-[var(--border)] bg-[var(--cream)] hover:border-[var(--electric)] hover:shadow-[0_8px_24px_rgba(28,16,8,0.08)]'
                }`}
            >
              <div className="mb-6 flex flex-col items-center text-center">
                <div
                  className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl transition-all ${testerIsActive
                      ? 'bg-[var(--electric-dim)] text-[var(--electric)]'
                      : 'bg-[var(--bg-light)] text-[var(--ink-soft)]'
                    }`}
                >
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h2 className="mb-2 font-['Fraunces'] italic font-normal text-[var(--ink)] text-xl">I&apos;m a Tester</h2>
                <p className="text-sm text-[var(--ink-soft)]">
                  I want to earn by giving honest feedback on real products
                </p>
              </div>

              <div className="mb-4">
                <label className="mb-2 block text-[0.68rem] font-[family-name:var(--font-dm-mono)] uppercase tracking-[0.1em] text-[var(--ink-soft)] cursor-none">
                  DISPLAY NAME
                </label>
                <input
                  type="text"
                  value={testerName}
                  onChange={(event) => setTesterName(event.target.value)}
                  onFocus={() => setActiveRole('TESTER')}
                  placeholder="Your first name"
                  className="w-full rounded-[8px] border border-[var(--border-strong)] bg-[var(--bg)] px-4 py-3 text-[var(--ink)] placeholder:text-[var(--ink-soft)] focus:border-[var(--electric)] focus:outline-none focus:ring-1 focus:ring-[var(--electric-dim)] cursor-none"
                />
                {testerNameError ? (
                  <p className="mt-1 text-sm text-[#c0392b]">{testerNameError}</p>
                ) : null}
              </div>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => {
                  setActiveRole('TESTER')
                  void handleSelectRole('TESTER')
                }}
                className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-base font-bold transition-all cursor-none disabled:opacity-50 ${testerIsActive
                    ? 'bg-[var(--electric)] text-[var(--cream)] hover:opacity-90'
                    : 'border-2 border-[var(--border-strong)] bg-transparent text-[var(--ink-soft)] hover:border-[var(--electric)] hover:text-[var(--electric)]'
                  }`}
              >
                {submittingRole === 'TESTER' && isLoading ? (
                  <SpinnerIcon className="h-5 w-5" />
                ) : null}
                CONTINUE AS TESTER {'->'}
              </button>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-[var(--ink-soft)]">
            Pick your path — you can always reach us if anything changes.
          </p>
          {globalError ? (
            <p className="mt-4 text-center text-sm text-[#c0392b]">{globalError}</p>
          ) : null}
        </div>
      </div>
    </main>
  )
}

export default function SelectRolePage() {
  return (
    <RequireAuth>
      <SelectRoleContent />
    </RequireAuth>
  )
}
