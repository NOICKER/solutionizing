"use client"

import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useState } from 'react'
import {
  BrandMark,
  SpinnerIcon,
  primaryButtonClass,
  textFieldClass,
} from '@/components/solutionizing/ui'

const passwordRule = /^(?=.*[A-Z])(?=.*\d).{8,}$/
const redirectDelayMs = 3000

function getPasswordError(password: string) {
  if (!passwordRule.test(password)) {
    return 'Password must be at least 8 characters and include an uppercase letter and a number'
  }

  return ''
}

function getResetLinkError() {
  return 'This reset link is invalid or expired. Request a new password reset email and try again.'
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  )
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [confirmPasswordError, setConfirmPasswordError] = useState('')
  const [formError, setFormError] = useState('')
  const [hasRecoverySession, setHasRecoverySession] = useState(false)
  const [isLoadingSession, setIsLoadingSession] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    let isMounted = true
    let retryTimer = 0

    const applyCurrentSession = async (allowRetry: boolean) => {
      const { data, error } = await supabase.auth.getSession()

      if (!isMounted) {
        return
      }

      if (error) {
        setFormError(error.message)
        setHasRecoverySession(false)
        setIsLoadingSession(false)
        return
      }

      if (data.session) {
        setFormError('')
        setHasRecoverySession(true)
        setIsLoadingSession(false)
        return
      }

      if (allowRetry && window.location.hash.includes('access_token=')) {
        retryTimer = window.setTimeout(() => {
          void applyCurrentSession(false)
        }, 250)
        return
      }

      setFormError(getResetLinkError())
      setHasRecoverySession(false)
      setIsLoadingSession(false)
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) {
        return
      }

      if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') && session) {
        setFormError('')
        setHasRecoverySession(true)
        setIsLoadingSession(false)
      }
    })

    void applyCurrentSession(true)

    return () => {
      isMounted = false
      window.clearTimeout(retryTimer)
      subscription.unsubscribe()
    }
  }, [supabase])

  useEffect(() => {
    if (!isSuccess) {
      return
    }

    const timer = window.setTimeout(() => {
      router.push('/auth/login')
    }, redirectDelayMs)

    return () => {
      window.clearTimeout(timer)
    }
  }, [isSuccess, router])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const nextPasswordError = getPasswordError(password)
    const nextConfirmPasswordError =
      confirmPassword === password ? '' : 'Passwords do not match'

    setPasswordError(nextPasswordError)
    setConfirmPasswordError(nextConfirmPasswordError)
    setFormError('')

    if (nextPasswordError || nextConfirmPasswordError || !hasRecoverySession) {
      if (!hasRecoverySession && !nextPasswordError && !nextConfirmPasswordError) {
        setFormError(getResetLinkError())
      }
      return
    }

    setIsSubmitting(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      })

      if (error) {
        setFormError(error.message)
        return
      }

      setIsSuccess(true)
      setPassword('')
      setConfirmPassword('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-card bg-[var(--bg)] p-12">
        {isSuccess ? (
          <div className="text-center">
            <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-10 w-10 text-green-600"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="mb-4 text-3xl font-[family-name:var(--font-fraunces)] italic font-normal text-[var(--ink)]">Password updated</h1>
            <p className="mb-3 text-lg text-[var(--ink-soft)]">
              Your password has been reset successfully.
            </p>
            <p className="mb-8 text-sm text-[var(--ink-soft)]">
              Redirecting to sign in in 3 seconds...
            </p>
            <Link
              href="/auth/login"
              className={`inline-flex items-center justify-center px-8 py-3.5 text-base ${primaryButtonClass} cursor-none`}
            >
              GO TO SIGN IN
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8 text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--electric)] text-white">
                <BrandMark className="h-9 w-9 text-white" />
              </div>
              <h1 className="mb-2 text-3xl font-[family-name:var(--font-fraunces)] italic font-normal text-[var(--ink)]">Reset your password</h1>
              <p className="text-[var(--ink-soft)]">Choose a new password for your account.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[var(--ink)]">NEW PASSWORD</label>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="********"
                  className={textFieldClass}
                  autoComplete="new-password"
                />
                <p className="mt-2 text-xs text-[var(--ink-soft)]">Min 8 chars, 1 uppercase, 1 number</p>
                {passwordError ? <p className="mt-1 text-sm text-red-600">{passwordError}</p> : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[var(--ink)]">CONFIRM PASSWORD</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="********"
                  className={textFieldClass}
                  autoComplete="new-password"
                />
                {confirmPasswordError ? (
                  <p className="mt-1 text-sm text-red-600">{confirmPasswordError}</p>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isLoadingSession || !hasRecoverySession}
                className={`flex w-full items-center justify-center gap-2 py-3.5 text-base ${primaryButtonClass} cursor-none`}
              >
                {isSubmitting || isLoadingSession ? <SpinnerIcon className="h-5 w-5" /> : null}
                {isLoadingSession
                  ? 'VALIDATING RESET LINK...'
                  : isSubmitting
                    ? 'UPDATING PASSWORD...'
                    : 'UPDATE PASSWORD ->'}
              </button>

              {formError ? <p className="mt-2 text-sm text-red-600">{formError}</p> : null}
            </form>

            <div className="mt-8 border-t border-[var(--border)] pt-6 text-center">
              <p className="mb-3 text-xs text-[var(--ink-soft)] flex items-center justify-center gap-2">
                <span aria-hidden="true">Locked</span>
                Secure, encrypted password update
              </p>
              <Link href="/auth/login" className="text-sm font-semibold text-[var(--ink-soft)] hover:text-[var(--ink)] cursor-none">
                {'<-'} Back to sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
