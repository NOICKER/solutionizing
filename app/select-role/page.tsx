"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RequireAuth } from '@/components/RequireAuth'
import {
  BrandMark,
  SpinnerIcon,
  primaryButtonClass,
  textFieldClass,
} from '@/components/solutionizing/ui'
import { useAuth } from '@/context/AuthContext'
import { apiFetch, isApiClientError } from '@/lib/api/client'

function SelectRoleContent() {
  const router = useRouter()
  const { user, refetch, applyRoleSelection } = useAuth()
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

  const founderCardClass = founderIsActive
    ? 'border-primary bg-primary/10 shadow-[0_28px_70px_-48px_rgba(217,119,87,0.42)]'
    : 'border-border-subtle bg-surface-elevated'

  const testerCardClass = testerIsActive
    ? 'border-blue-500 bg-blue-500/10 shadow-[0_28px_70px_-48px_rgba(59,130,246,0.36)]'
    : 'border-border-subtle bg-surface-elevated'

  const inactiveButtonClass =
    'rounded-[2rem] border-2 border-border-subtle bg-surface font-black text-text-muted transition-all hover:border-border hover:text-text-main disabled:pointer-events-none disabled:opacity-70'

  const testerButtonClass = testerIsActive
    ? 'rounded-[2rem] bg-blue-600 text-white font-black hover:bg-blue-500 hover:shadow-lg hover:scale-[1.02] transition-all disabled:pointer-events-none disabled:opacity-70'
    : inactiveButtonClass

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
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <div className="w-full max-w-5xl">
        <div className="mb-12 text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-hover">
              <BrandMark />
            </div>
            <h1 className="text-4xl font-black text-text-main">SOLUTIONIZING</h1>
          </div>
          <p className="text-xl text-text-muted">How will you use Solutionizing?</p>
        </div>

        <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
          <div
            onClick={() => setActiveRole('FOUNDER')}
            className={`cursor-pointer rounded-3xl border-2 p-8 transition-all duration-200 ${
              founderCardClass
            }`}
          >
            <div className="mb-6 flex flex-col items-center text-center">
              <div
                className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl transition-all ${
                  founderIsActive
                    ? 'bg-gradient-to-br from-primary to-primary-hover'
                    : 'bg-surface text-text-muted'
                }`}
              >
                <svg
                  className={`h-8 w-8 ${founderIsActive ? 'text-white' : 'text-text-muted'}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="mb-2 text-2xl font-black text-text-main">I&apos;m a Founder</h2>
              <p className="text-sm text-text-muted">
                I have a product and need real feedback from real people
              </p>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-text-muted">
                DISPLAY NAME
              </label>
              <input
                type="text"
                value={founderName}
                onChange={(event) => setFounderName(event.target.value)}
                onFocus={() => setActiveRole('FOUNDER')}
                placeholder="Your first name"
                className={textFieldClass}
              />
              {founderNameError ? (
                <p className="mt-1 text-sm text-red-600">{founderNameError}</p>
              ) : null}
            </div>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => {
                setActiveRole('FOUNDER')
                void handleSelectRole('FOUNDER')
              }}
              className={`flex w-full items-center justify-center gap-2 py-3.5 text-base ${
                founderIsActive ? primaryButtonClass : inactiveButtonClass
              }`}
            >
              {submittingRole === 'FOUNDER' && isLoading ? (
                <SpinnerIcon className="h-5 w-5" />
              ) : null}
              CONTINUE AS FOUNDER {'->'}
            </button>
          </div>

          <div
            onClick={() => setActiveRole('TESTER')}
            className={`cursor-pointer rounded-3xl border-2 p-8 transition-all duration-200 ${
              testerCardClass
            }`}
          >
            <div className="mb-6 flex flex-col items-center text-center">
              <div
                className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl transition-all ${
                  testerIsActive
                    ? 'bg-blue-600/10 text-blue-500'
                    : 'bg-surface text-text-muted'
                }`}
              >
                <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h2 className="mb-2 text-2xl font-black text-text-main">I&apos;m a Tester</h2>
              <p className="text-sm text-text-muted">
                I want to earn by giving honest feedback on real products
              </p>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-text-muted">
                DISPLAY NAME
              </label>
              <input
                type="text"
                value={testerName}
                onChange={(event) => setTesterName(event.target.value)}
                onFocus={() => setActiveRole('TESTER')}
                placeholder="Your first name"
                className={`${textFieldClass} ${
                  testerIsActive
                    ? 'focus:ring-blue-500'
                    : ''
                }`}
              />
              {testerNameError ? (
                <p className="mt-1 text-sm text-red-600">{testerNameError}</p>
              ) : null}
            </div>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => {
                setActiveRole('TESTER')
                void handleSelectRole('TESTER')
              }}
              className={`flex w-full items-center justify-center gap-2 py-3.5 text-base ${testerButtonClass}`}
            >
              {submittingRole === 'TESTER' && isLoading ? (
                <SpinnerIcon className="h-5 w-5" />
              ) : null}
              CONTINUE AS TESTER {'->'}
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-text-muted">
          Pick your path — you can always reach us if anything changes.
        </p>
        {globalError ? (
          <p className="mt-4 text-center text-sm text-red-600">{globalError}</p>
        ) : null}
      </div>
    </div>
  )
}

export default function SelectRolePage() {
  return (
    <RequireAuth>
      <SelectRoleContent />
    </RequireAuth>
  )
}
