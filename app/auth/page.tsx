"use client"

import { Suspense, FormEvent, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { ApiClientError, apiFetch, isApiClientError } from '@/lib/api/client'
import {
  BrandMark,
  EyeIcon,
  SpinnerIcon,
  primaryButtonClass,
  textFieldClass,
} from '@/components/solutionizing/ui'

type AuthMode = 'signin' | 'signup' | 'forgot'

interface LoginResponse {
  role: 'FOUNDER' | 'TESTER' | 'ADMIN' | null
  redirectTo?: string
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function sanitizeNextPath(value: string | null) {
  if (!value || !value.startsWith('/')) {
    return null
  }

  return value
}

function getFallbackPath(role: LoginResponse['role']) {
  if (role === null) {
    return '/select-role'
  }

  return '/dashboard'
}

function isNetworkError(error: unknown) {
  return isApiClientError(error) && error.code === 'NETWORK_ERROR'
}

function AuthForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated, isLoading, refetch } = useAuth()

  const queryMode = searchParams.get('mode')
  const initialMode: AuthMode =
    queryMode === 'signup' ? 'signup' : queryMode === 'forgot' ? 'forgot' : 'signin'

  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [formError, setFormError] = useState('')
  const [forgotSuccess, setForgotSuccess] = useState(false)
  const [signupSuccess, setSignupSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const nextPath = sanitizeNextPath(searchParams.get('next'))

  useEffect(() => {
    setMode(initialMode)
    setFormError('')
    setEmailError('')
    setPasswordError('')
    setForgotSuccess(false)
    setSignupSuccess(false)
  }, [initialMode])

  useEffect(() => {
    if (isLoading || !isAuthenticated) {
      return
    }

    router.replace(getFallbackPath(user?.role ?? null))
  }, [isAuthenticated, isLoading, router, user?.role])

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email])

  const submitLabel =
    mode === 'signup'
      ? 'CREATE ACCOUNT →'
      : mode === 'forgot'
        ? 'SEND RESET LINK →'
        : 'SIGN IN →'

  const submittingLabel =
    mode === 'signup'
      ? 'CREATING ACCOUNT...'
      : mode === 'forgot'
        ? 'SENDING RESET LINK...'
        : 'SIGNING IN...'

  async function handleSignUp(event: FormEvent) {
    event.preventDefault()
    const nextEmailError = emailPattern.test(normalizedEmail)
      ? ''
      : 'Please enter a valid email address'
    const nextPasswordError =
      password.length >= 8 && /[A-Z]/.test(password) && /\d/.test(password)
        ? ''
        : 'Password must be at least 8 characters and include an uppercase letter and a number'

    setEmailError(nextEmailError)
    setPasswordError(nextPasswordError)
    setFormError('')

    if (nextEmailError || nextPasswordError) {
      return
    }

    setIsSubmitting(true)

    try {
      await apiFetch('/api/v1/auth/register', {
        method: 'POST',
        body: {
          email: normalizedEmail,
          password,
        },
        skipSessionHandling: true,
      })

      setSignupSuccess(true)
    } catch (error) {
      if (isApiClientError(error) && error.status === 409) {
        setEmailError('An account with this email already exists.')
      } else if (isNetworkError(error)) {
        setFormError('Check your internet connection')
      } else {
        setFormError('Something went wrong. Try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSignIn(event: FormEvent) {
    event.preventDefault()
    setEmailError('')
    setPasswordError('')
    setFormError('')
    setIsSubmitting(true)

    try {
      const response = await apiFetch<LoginResponse>('/api/v1/auth/login', {
        method: 'POST',
        body: {
          email: normalizedEmail,
          password,
          rememberMe,
        },
        skipSessionHandling: true,
      })

      await refetch()

      const redirectTarget = nextPath ?? response.redirectTo ?? getFallbackPath(response.role)
      router.push(redirectTarget)
    } catch (error) {
      if (isApiClientError(error)) {
        if (error.status === 401) {
          setFormError('Incorrect email or password.')
        } else if (error.status === 403 && error.code === 'EMAIL_NOT_VERIFIED') {
          setFormError('Please verify your email before signing in. Check your inbox.')
        } else if (error.status === 403 && error.code === 'ACCOUNT_SUSPENDED') {
          setFormError('Your account has been suspended. Contact support for help.')
        } else if (error.code === 'NETWORK_ERROR') {
          setFormError('Check your internet connection')
        } else {
          setFormError('Something went wrong. Try again.')
        }
      } else {
        setFormError('Something went wrong. Try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleForgotPassword(event: FormEvent) {
    event.preventDefault()
    const nextEmailError = emailPattern.test(normalizedEmail)
      ? ''
      : 'Please enter a valid email address'

    setEmailError(nextEmailError)
    setFormError('')

    if (nextEmailError) {
      return
    }

    setIsSubmitting(true)

    try {
      await apiFetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        body: {
          email: normalizedEmail,
        },
        skipSessionHandling: true,
      })

      setForgotSuccess(true)
    } catch (error) {
      if (isNetworkError(error)) {
        setFormError('Check your internet connection')
      } else {
        setFormError('Something went wrong. Try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleSubmit(event: FormEvent) {
    if (mode === 'signup') {
      return void handleSignUp(event)
    }

    if (mode === 'forgot') {
      return void handleForgotPassword(event)
    }

    return void handleSignIn(event)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#faf9f7] p-8">
        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((card) => (
            <div key={card} className="rounded-3xl border border-[#e5e4e0] bg-white p-6">
              <div className="mb-4 h-12 w-12 animate-pulse rounded-2xl bg-[#e5e4e0]" />
              <div className="mb-3 h-6 animate-pulse rounded bg-[#e5e4e0]" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-[#e5e4e0]" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#faf9f7] flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl bg-[#faf9f7] p-12">
        {signupSuccess ? (
          <div className="text-center">
            <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="mb-4 text-3xl font-black text-[#1a1625]">Check your inbox</h2>
            <p className="mb-8 text-lg text-[#6b687a]">
              Check your inbox — we sent you a verification link.
            </p>
            <button
              type="button"
              onClick={() => {
                setMode('signin')
                setSignupSuccess(false)
                setPassword('')
              }}
              className="text-sm font-semibold text-[#6b687a] hover:text-[#1a1625]"
            >
              ← Back to sign in
            </button>
          </div>
        ) : (
          <>
            <div className="mb-8 text-center">
              <div
                className={`mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl ${
                  mode === 'forgot'
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-gradient-to-br from-[#d77a57] to-[#c4673f] text-white'
                }`}
              >
                {mode === 'forgot' ? (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                ) : (
                  <BrandMark className="w-9 h-9 text-white" />
                )}
              </div>
              <h1 className="mb-2 text-3xl font-black text-[#1a1625]">
                {mode === 'signup'
                  ? 'SOLUTIONIZING'
                  : mode === 'forgot'
                    ? 'Reset your password'
                    : 'SOLUTIONIZING'}
              </h1>
              <p className="text-[#6b687a]">
                {mode === 'signup'
                  ? 'Create your account'
                  : mode === 'forgot'
                    ? "Enter your email and we'll send you a reset link"
                    : 'Sign in to your account'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#1a1625]">
                  EMAIL ADDRESS
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="user@example.com"
                  className={textFieldClass}
                />
                {emailError ? (
                  <p className="mt-1 text-sm text-red-600">
                    {emailError}{' '}
                    {mode === 'signup' && emailError.includes('exists') ? (
                      <button
                        type="button"
                        onClick={() => {
                          setMode('signin')
                          setEmailError('')
                          setFormError('')
                        }}
                        className="text-[#d77a57] underline"
                      >
                        Sign in instead?
                      </button>
                    ) : null}
                  </p>
                ) : null}
              </div>

              {mode !== 'forgot' ? (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-semibold text-[#1a1625]">PASSWORD</label>
                    {mode === 'signin' ? (
                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot')
                          setFormError('')
                        }}
                        className="text-sm font-semibold text-[#d77a57] hover:underline"
                      >
                        Forgot password?
                      </button>
                    ) : null}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="••••••••"
                      className={textFieldClass}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9b98a8] hover:text-[#1a1625]"
                    >
                      <EyeIcon open={showPassword} />
                    </button>
                  </div>
                  {mode === 'signup' ? (
                    <p className="mt-2 text-xs text-[#9b98a8]">Min 8 chars, 1 uppercase, 1 number</p>
                  ) : null}
                  {passwordError ? <p className="mt-1 text-sm text-red-600">{passwordError}</p> : null}
                </div>
              ) : null}

              {mode === 'signin' ? (
                <div className="flex items-center justify-between text-sm">
                  <label className="flex cursor-pointer items-center gap-2 text-[#6b687a]">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(event) => setRememberMe(event.target.checked)}
                      className="h-4 w-4 rounded border-[#e5e4e0] text-[#d77a57] focus:ring-[#d77a57]"
                    />
                    Remember me
                  </label>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex w-full items-center justify-center gap-2 py-3.5 text-base ${primaryButtonClass}`}
              >
                {isSubmitting ? <SpinnerIcon className="w-5 h-5" /> : null}
                {isSubmitting ? submittingLabel : submitLabel}
              </button>

              {mode === 'signin' && formError ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  {formError}
                </div>
              ) : null}

              {mode !== 'signin' && formError ? (
                <p className="text-sm text-red-600 mt-2">{formError}</p>
              ) : null}

              {mode !== 'forgot' ? (
                <>
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[#e5e4e0]" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="bg-[#faf9f7] px-4 text-[#9b98a8]">Social login coming soon</span>
                    </div>
                  </div>

                  <p className="text-center text-sm text-[#6b687a]">
                    {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode(mode === 'signup' ? 'signin' : 'signup')
                        setFormError('')
                        setEmailError('')
                        setPasswordError('')
                      }}
                      className="font-semibold text-[#d77a57] hover:underline"
                    >
                      {mode === 'signup' ? 'Sign in' : 'Sign up'}
                    </button>
                  </p>
                </>
              ) : null}

              {mode === 'forgot' && forgotSuccess ? (
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <p className="text-sm text-blue-900">
                    <strong>Security notice:</strong> If that email exists, a reset link is on its way.
                  </p>
                </div>
              ) : null}
            </form>

            {mode === 'forgot' ? (
              <div className="mt-8 border-t border-[#e5e4e0] pt-6 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin')
                    setForgotSuccess(false)
                    setFormError('')
                    setEmailError('')
                  }}
                  className="text-sm font-semibold text-[#6b687a] hover:text-[#1a1625]"
                >
                  ← Back to sign in
                </button>
              </div>
            ) : (
              <div className="mt-8 border-t border-[#e5e4e0] pt-6 text-center">
                <p className="text-xs text-[#9b98a8] flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  Secure authentication via /api/v1/auth/{mode === 'signup' ? 'register' : 'login'}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}

function AuthPageLoading() {
  return (
    <div className="min-h-screen bg-[#faf9f7] p-8">
      <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((card) => (
          <div key={card} className="rounded-3xl border border-[#e5e4e0] bg-white p-6">
            <div className="mb-4 h-12 w-12 animate-pulse rounded-2xl bg-[#e5e4e0]" />
            <div className="mb-3 h-6 animate-pulse rounded bg-[#e5e4e0]" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-[#e5e4e0]" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={<AuthPageLoading />}>
      <AuthForm />
    </Suspense>
  )
}
