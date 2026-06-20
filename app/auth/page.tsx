"use client"

import { Suspense, FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@/context/AuthContext'
import { apiFetch, isApiClientError } from '@/lib/api/client'
import {
  BrandMark,
  EyeIcon,
  SpinnerIcon,
} from '@/components/solutionizing/ui'



type AuthMode = 'signin' | 'signup' | 'forgot'

interface LoginResponse {
  role: 'FOUNDER' | 'TESTER' | 'ADMIN' | null
  redirectTo?: string
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SUPPORT_EMAIL = 'hello@solutionizing.com'

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

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

function AuthForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated, isLoading, refetch } = useAuth()

  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  )

  const queryMode = searchParams.get('mode')
  const initialMode: AuthMode =
    queryMode === 'signup' ? 'signup' : queryMode === 'forgot' ? 'forgot' : 'signin'

  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [pendingMode, setPendingMode] = useState<AuthMode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [formError, setFormError] = useState('')
  const [formErrorCode, setFormErrorCode] = useState<string | null>(null)
  const [forgotSuccess, setForgotSuccess] = useState(false)
  const [signupSuccess, setSignupSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isModeContentVisible, setIsModeContentVisible] = useState(true)

  const rotatingHeadlines = useMemo(() => [
    'Real users. Real friction. Real insights.',
    'Ship faster. Break less. Test smarter.',
    'Your next launch, de-risked.',
  ], [])
  const [headlineIndex, setHeadlineIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setHeadlineIndex((i) => (i + 1) % rotatingHeadlines.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [rotatingHeadlines])

  const nextPath = sanitizeNextPath(searchParams.get('next'))

  useEffect(() => {
    setPendingMode(initialMode)
  }, [initialMode])

  useEffect(() => {
    if (pendingMode === mode) {
      return
    }

    setIsModeContentVisible(false)

    const timer = window.setTimeout(() => {
      setMode(pendingMode)
      setFormError('')
      setFormErrorCode(null)
      setEmailError('')
      setPasswordError('')
      setForgotSuccess(false)
      setSignupSuccess(false)
      setIsModeContentVisible(true)
    }, 150)

    return () => {
      window.clearTimeout(timer)
    }
  }, [mode, pendingMode])

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
    setFormErrorCode(null)

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
    setFormErrorCode(null)
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
          setFormError('Your account has been suspended.')
          setFormErrorCode('ACCOUNT_SUSPENDED')
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
    setFormErrorCode(null)

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

  const handleGoogleSignIn = useCallback(async () => {
    setIsGoogleLoading(true)
    setFormError('')
    setFormErrorCode(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://solutionizing.vercel.app/auth/callback',
        },
      })

      if (error) {
        setFormError(error.message)
        setIsGoogleLoading(false)
      }
      // If successful, browser redirects to Google — no need to reset loading
    } catch {
      setFormError('Something went wrong. Try again.')
      setIsGoogleLoading(false)
    }
  }, [supabase])

  function requestModeChange(nextMode: AuthMode) {
    if (nextMode === pendingMode) {
      return
    }

    setPendingMode(nextMode)

    if (nextMode === mode) {
      setIsModeContentVisible(true)
    }
  }

  if (isLoading) {
    return <AuthLoadingScreen />
  }

  return (
    <main className="min-h-screen flex">
      {/* Left dark panel — hidden on mobile */}
      <div className="hidden lg:flex fixed left-0 top-0 h-screen w-[45%] bg-[var(--dark)] flex-col items-start justify-between p-12 z-10">
        <BrandMark className="w-8 h-8 text-[var(--cream)]" />
        <div>
          <p className="mb-5 text-[0.68rem] font-[family-name:var(--font-dm-mono)] uppercase tracking-[0.18em] text-[var(--cream)] opacity-40">Solutionizing</p>
          <h2 style={{ transition: 'opacity 0.4s ease' }} className="font-[family-name:var(--font-fraunces)] italic font-normal text-[var(--cream)] text-4xl leading-snug max-w-xs">
            {rotatingHeadlines[headlineIndex]}
          </h2>
        </div>
        <p className="text-[0.65rem] font-[family-name:var(--font-dm-mono)] uppercase tracking-[0.14em] text-[var(--cream)] opacity-25">Real feedback. Better products.</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 lg:ml-[45%] min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center p-6 sm:p-10">
        <a href="/" className="mb-3 self-start inline-flex items-center gap-1.5 text-sm text-[var(--ink-soft)] hover:text-[var(--ink)] font-[family-name:var(--font-dm-mono)] cursor-none transition-colors">
          ← back to home
        </a>
        <div className="w-full max-w-md rounded-[16px] border border-[var(--border)] bg-[var(--cream)] p-8 sm:p-10">
          {signupSuccess ? (
            <div className="text-center">
              <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-[rgba(74,197,128,0.12)]">
                <svg className="w-10 h-10 text-[#1e7a47]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="mb-4 font-[family-name:var(--font-fraunces)] italic font-normal text-[var(--ink)] text-3xl">Check your inbox</h2>
              <p className="mb-8 text-lg text-[var(--ink-soft)]">
                Check your inbox — we sent you a verification link.
              </p>
              <button
                type="button"
                onClick={() => {
                  setMode('signin')
                  setPendingMode('signin')
                  setSignupSuccess(false)
                  setPassword('')
                }}
                className="text-sm font-semibold text-[var(--ink-soft)] hover:text-[var(--ink)] cursor-none"
              >
                ← Back to sign in
              </button>
            </div>
          ) : (
            <div
              className={`transition-opacity duration-200 ${isModeContentVisible ? 'opacity-100' : 'opacity-0'
                }`}
            >
              <div className="mb-8 text-center">
                <div
                  className={`mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl ${mode === 'forgot'
                    ? 'bg-[rgba(251,191,36,0.12)] text-[#92400e]'
                    : 'bg-[var(--electric)] text-[var(--cream)]'
                    }`}
                >
                  {mode === 'forgot' ? (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  ) : (
                    <BrandMark className="w-9 h-9 text-[var(--cream)]" />
                  )}
                </div>
                <h1 className="mb-2 font-[family-name:var(--font-fraunces)] italic font-normal text-[var(--ink)] text-3xl">
                  {mode === 'signup'
                    ? 'Create account'
                    : mode === 'forgot'
                      ? 'Reset your password'
                      : 'Sign in'}
                </h1>
                <p className="text-[var(--ink-soft)]">
                  {mode === 'signup'
                    ? 'Create your account'
                    : mode === 'forgot'
                      ? "Enter your email and we'll send you a reset link"
                      : 'Sign in to your account'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-[0.68rem] font-[family-name:var(--font-dm-mono)] uppercase tracking-[0.1em] text-[var(--ink-soft)] cursor-none">
                    EMAIL ADDRESS
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="user@example.com"
                    className="w-full rounded-[8px] border border-[var(--border-strong)] bg-[var(--bg)] px-4 py-3 text-[var(--ink)] placeholder:text-[var(--ink-soft)] focus:border-[var(--electric)] focus:outline-none focus:ring-1 focus:ring-[var(--electric-dim)] cursor-none"
                  />
                  {emailError ? (
                    <p className="mt-1 text-sm text-[#c0392b]">
                      {emailError}{' '}
                      {mode === 'signup' && emailError.includes('exists') ? (
                        <button
                          type="button"
                          onClick={() => {
                            requestModeChange('signin')
                          }}
                          className="text-[var(--electric)] hover:opacity-80 underline cursor-none"
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
                      <label className="text-[0.68rem] font-[family-name:var(--font-dm-mono)] uppercase tracking-[0.1em] text-[var(--ink-soft)] cursor-none">PASSWORD</label>
                      {mode === 'signin' ? (
                        <button
                          type="button"
                          onClick={() => {
                            requestModeChange('forgot')
                          }}
                          className="text-sm font-[family-name:var(--font-dm-mono)] uppercase tracking-[0.08em] text-[var(--electric)] hover:opacity-80 cursor-none"
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
                        className="w-full rounded-[8px] border border-[var(--border-strong)] bg-[var(--bg)] px-4 py-3 text-[var(--ink)] placeholder:text-[var(--ink-soft)] focus:border-[var(--electric)] focus:outline-none focus:ring-1 focus:ring-[var(--electric-dim)] cursor-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-soft)] hover:text-[var(--ink)] cursor-none"
                      >
                        <EyeIcon open={showPassword} />
                      </button>
                    </div>
                    {mode === 'signup' ? (
                      <p className="mt-2 text-xs text-[var(--ink-soft)]">Min 8 chars, 1 uppercase, 1 number</p>
                    ) : null}
                    {passwordError ? <p className="mt-1 text-sm text-[#c0392b]">{passwordError}</p> : null}
                  </div>
                ) : null}

                {mode === 'signin' ? (
                  <div className="flex items-center justify-between text-sm">
                    <label className="flex cursor-none items-center gap-2 text-[var(--ink-soft)]">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(event) => setRememberMe(event.target.checked)}
                        className="h-4 w-4 rounded border-[var(--border-strong)] bg-[var(--bg)] text-[var(--electric)] focus:ring-[var(--electric-dim)] cursor-none"
                      />
                      Remember me
                    </label>
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 py-3.5 text-base rounded-[8px] font-bold bg-[var(--electric)] text-[var(--cream)] hover:opacity-90 cursor-none disabled:opacity-50 transition-opacity"
                >
                  {isSubmitting ? <SpinnerIcon className="w-5 h-5" /> : null}
                  {isSubmitting ? submittingLabel : submitLabel}
                </button>

                {mode === 'signin' && formError ? (
                  <div className="rounded-[8px] border border-[rgba(192,57,43,0.18)] bg-[rgba(192,57,43,0.04)] px-4 py-3 text-sm text-[#c0392b]">
                    <p>{formError}</p>
                    {formErrorCode === 'ACCOUNT_SUSPENDED' ? (
                      <p className="mt-2">
                        If you believe this is a mistake, contact support at{' '}
                        <a
                          href={`mailto:${SUPPORT_EMAIL}`}
                          className="font-semibold text-[var(--electric)] hover:opacity-80 cursor-none"
                        >
                          {SUPPORT_EMAIL}
                        </a>
                        .
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {mode !== 'signin' && formError ? (
                  <p className="text-sm text-[#c0392b] mt-2">{formError}</p>
                ) : null}

                {mode !== 'forgot' ? (
                  <>
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-[var(--border)]" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="bg-[var(--cream)] px-4 text-[var(--ink-soft)]">OR</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={isGoogleLoading}
                      className="flex w-full items-center justify-center gap-3 rounded-xl border border-[var(--border-strong)] bg-[var(--bg)] px-4 py-3 text-sm font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--bg-light)] cursor-none disabled:opacity-60"
                    >
                      {isGoogleLoading ? (
                        <SpinnerIcon className="h-5 w-5" />
                      ) : (
                        <GoogleIcon className="h-5 w-5" />
                      )}
                      Continue with Google
                    </button>

                    <p className="text-center text-sm text-[var(--ink-soft)] mt-4">
                      {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
                      <button
                        type="button"
                        onClick={() => {
                          requestModeChange(mode === 'signup' ? 'signin' : 'signup')
                        }}
                        className="font-semibold text-[var(--electric)] hover:opacity-80 hover:underline cursor-none"
                      >
                        {mode === 'signup' ? 'Sign in' : 'Sign up'}
                      </button>
                    </p>
                  </>
                ) : null}

                {mode === 'forgot' && forgotSuccess ? (
                  <div className="rounded-[8px] border border-[rgba(56,189,248,0.18)] bg-[rgba(56,189,248,0.06)] p-4">
                    <p className="text-sm text-[#0369a1]">
                      <strong>Security notice:</strong> If that email exists, a reset link is on its way.
                    </p>
                  </div>
                ) : null}
              </form>

              {mode === 'forgot' ? (
                <div className="mt-8 border-t border-[var(--border)] pt-6 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      requestModeChange('signin')
                    }}
                    className="text-sm font-semibold text-[var(--ink-soft)] hover:text-[var(--ink)] cursor-none"
                  >
                    ← Back to sign in
                  </button>
                </div>
              ) : (
                <div className="mt-8 border-t border-[var(--border)] pt-6 text-center">
                  <p className="text-xs text-[var(--ink-soft)] flex items-center justify-center gap-2">
                    <span aria-hidden="true">🔒</span>
                    Secure, encrypted authentication
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

function AuthLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--electric)] border-t-transparent" />
    </div>
  )
}

function AuthPageLoading() {
  return <AuthLoadingScreen />
}

export default function AuthPage() {
  return (
    <Suspense fallback={<AuthPageLoading />}>
      <AuthForm />
    </Suspense>
  )
}
