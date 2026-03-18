"use client"

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { ApiClientError, apiFetch, isApiClientError } from '@/lib/api/client'
import {
  BrandMark,
  SpinnerIcon,
  primaryButtonClass,
  textFieldClass,
} from '@/components/solutionizing/ui'

const passwordRule = /^(?=.*[A-Z])(?=.*\d).{8,}$/

function getPasswordError(password: string) {
  if (!passwordRule.test(password)) {
    return 'Password must be at least 8 characters and include an uppercase letter and a number'
  }

  return ''
}

function isNetworkError(error: unknown) {
  return isApiClientError(error) && error.code === 'NETWORK_ERROR'
}

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [confirmPasswordError, setConfirmPasswordError] = useState('')
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const nextPasswordError = getPasswordError(password)
    const nextConfirmPasswordError =
      confirmPassword === password ? '' : 'Passwords do not match'

    setPasswordError(nextPasswordError)
    setConfirmPasswordError(nextConfirmPasswordError)
    setFormError('')

    if (nextPasswordError || nextConfirmPasswordError) {
      return
    }

    setIsSubmitting(true)

    try {
      await apiFetch('/api/v1/auth/reset-password', {
        method: 'POST',
        body: { password },
        skipSessionHandling: true,
      })

      setIsSuccess(true)
      setPassword('')
      setConfirmPassword('')
    } catch (error) {
      if (isNetworkError(error)) {
        setFormError('Check your internet connection')
      } else if (isApiClientError(error) && (error.status === 400 || error.status === 401)) {
        setFormError('This reset link is invalid or expired. Request a new password reset email and try again.')
      } else if (error instanceof ApiClientError) {
        setFormError(error.message)
      } else {
        setFormError('Something went wrong. Try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#faf9f7] flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-card bg-[#faf9f7] p-12">
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
            <h1 className="mb-4 text-3xl font-black text-[#1a1625]">Password updated</h1>
            <p className="mb-8 text-lg text-[#6b687a]">
              Your password has been reset successfully. You can sign in with your new password now.
            </p>
            <Link
              href="/auth"
              className={`inline-flex items-center justify-center px-8 py-3.5 text-base ${primaryButtonClass}`}
            >
              BACK TO SIGN IN
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8 text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#d77a57] to-[#c4673f] text-white">
                <BrandMark className="h-9 w-9 text-white" />
              </div>
              <h1 className="mb-2 text-3xl font-black text-[#1a1625]">Reset your password</h1>
              <p className="text-[#6b687a]">
                Choose a new password for your account.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#1a1625]">NEW PASSWORD</label>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="********"
                  className={textFieldClass}
                  autoComplete="new-password"
                />
                <p className="mt-2 text-xs text-[#9b98a8]">Min 8 chars, 1 uppercase, 1 number</p>
                {passwordError ? <p className="mt-1 text-sm text-red-600">{passwordError}</p> : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#1a1625]">CONFIRM PASSWORD</label>
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
                disabled={isSubmitting}
                className={`flex w-full items-center justify-center gap-2 py-3.5 text-base ${primaryButtonClass}`}
              >
                {isSubmitting ? <SpinnerIcon className="h-5 w-5" /> : null}
                {isSubmitting ? 'UPDATING PASSWORD...' : 'UPDATE PASSWORD ->'}
              </button>

              {formError ? (
                <p className="mt-2 text-sm text-red-600">{formError}</p>
              ) : null}
            </form>

            <div className="mt-8 border-t border-[#e5e4e0] pt-6 text-center">
              <p className="mb-3 text-xs text-[#9b98a8] flex items-center justify-center gap-2">
                <span aria-hidden="true">🔒</span>
                Secure, encrypted password update
              </p>
              <Link href="/auth" className="text-sm font-semibold text-[#6b687a] hover:text-[#1a1625]">
                {'<-'} Back to sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
