"use client"

import Link from 'next/link'
import { Star } from 'lucide-react'
import { ReactNode, useEffect, useState } from 'react'

export const primaryButtonClass =
  'rounded-[2rem] bg-gradient-to-r from-[#F97C5A] to-[#E45D43] text-white font-black hover:shadow-[0_8px_24px_rgba(249,124,90,0.35)] hover:scale-[1.02] transition-all disabled:pointer-events-none disabled:opacity-70'

export const outlineButtonClass =
  'rounded-[2rem] border-2 border-[#F97C5A] text-[#F97C5A] font-bold hover:bg-[#F97C5A] hover:text-white transition-all disabled:pointer-events-none disabled:opacity-70'

export const mutedButtonClass =
  'rounded-[2rem] border border-border-subtle bg-surface-elevated text-text-muted font-semibold hover:bg-surface hover:text-text-main transition-all disabled:pointer-events-none disabled:opacity-70'

export const textFieldClass =
  'w-full rounded-2xl border border-border-subtle bg-surface-elevated px-4 py-3 text-text-main placeholder:text-text-muted transition-all focus:outline-none focus:ring-2 focus:ring-primary/60'

export function SpinnerIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

export function BrandMark({ className = 'w-8 h-8 text-white' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  )
}

export function EyeIcon({ open }: { open: boolean }) {
  if (!open) {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M3 3l18 18" />
        <path d="M10.58 10.58a2 2 0 102.83 2.83" />
        <path d="M9.88 5.09A9.77 9.77 0 0112 5c4.48 0 8.27 2.94 9.54 7a10.7 10.7 0 01-4.13 5.14" />
        <path d="M6.61 6.61A10.72 10.72 0 002.46 12C3.73 16.06 7.52 19 12 19a9.8 9.8 0 005.39-1.61" />
      </svg>
    )
  }

  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
}

export function formatCoins(value: number) {
  return value.toLocaleString()
}

export function formatRupeesFromCoins(value: number) {
  return `₹${(value / 100).toFixed(0)}`
}

export function clampPercent(value: number) {
  return Math.min(100, Math.max(0, value))
}

export function MissionStatusBadge({ status }: { status: string }) {
  const styleMap: Record<string, string> = {
    DRAFT: 'bg-zinc-700 text-zinc-300',
    PENDING_REVIEW: 'bg-amber-900/50 text-amber-300',
    ACTIVE: 'bg-emerald-900/50 text-emerald-300',
    PAUSED: 'bg-orange-900/50 text-orange-300',
    COMPLETED: 'bg-sky-900/50 text-sky-300',
    REJECTED: 'bg-red-900/50 text-red-300',
    ASSIGNED: 'bg-emerald-900/50 text-emerald-300',
    IN_PROGRESS: 'bg-amber-900/50 text-amber-300',
  }

  return (
    <div className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${styleMap[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status === 'PENDING_REVIEW' ? 'UNDER REVIEW' : status.replaceAll('_', ' ')}
    </div>
  )
}

export function RetestCountChip({ count }: { count: number }) {
  const label = `${count} retest${count === 1 ? '' : 's'}`

  return (
    <div className="inline-flex rounded-full bg-indigo-900/50 px-3 py-1 text-xs font-bold text-indigo-300">
      ↻ {label}
    </div>
  )
}

export function ReputationTierBadge({ tier }: { tier: string }) {
  const styleMap: Record<string, string> = {
    NEWCOMER: 'bg-zinc-700 text-zinc-300',
    RELIABLE: 'bg-blue-900/60 text-blue-300',
    TRUSTED: 'bg-purple-900/60 text-purple-300',
    ELITE: 'bg-amber-900/60 text-amber-300',
  }

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${styleMap[tier] ?? 'bg-gray-100 text-gray-700'}`}>
      {tier}
    </span>
  )
}

export function PageLoadingBar({ isLoading }: { isLoading: boolean }) {
  const [isVisible, setIsVisible] = useState(isLoading)
  const [isFadingOut, setIsFadingOut] = useState(false)
  const [progress, setProgress] = useState(0)
  const [transitionDuration, setTransitionDuration] = useState(0)

  useEffect(() => {
    let animationFrame = 0
    let fadeTimeout: number | undefined

    if (isLoading) {
      setIsVisible(true)
      setIsFadingOut(false)
      setTransitionDuration(0)
      setProgress(0)

      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = window.requestAnimationFrame(() => {
          setTransitionDuration(2000)
          setProgress(85)
        })
      })
    } else if (isVisible) {
      setTransitionDuration(0)
      setProgress(100)
      setIsFadingOut(true)

      fadeTimeout = window.setTimeout(() => {
        setIsVisible(false)
        setIsFadingOut(false)
        setProgress(0)
      }, 300)
    }

    return () => {
      window.cancelAnimationFrame(animationFrame)

      if (fadeTimeout) {
        window.clearTimeout(fadeTimeout)
      }
    }
  }, [isLoading, isVisible])

  if (!isVisible) {
    return null
  }

  return (
    <div className={`pointer-events-none fixed inset-x-0 top-0 z-50 transition-opacity duration-300 ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}>
      <div className="relative h-1 w-full overflow-visible">
        <div
          className="relative h-full overflow-visible bg-[#F97C5A]"
          style={{
            width: `${progress}%`,
            transitionDuration: `${transitionDuration}ms`,
            transitionProperty: 'width',
            transitionTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
          }}
        >
          <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[calc(100%+0.375rem)] text-[11px] font-bold text-[#F97C5A]">
            {Math.round(progress)}%
          </span>
        </div>
      </div>
    </div>
  )
}

type DashboardCardSkeletonVariant = 'stat' | 'card' | 'full'

export function DashboardCardSkeleton({
  count,
  variant = 'full',
  onClick,
}: {
  count: number
  variant?: DashboardCardSkeletonVariant
  onClick?: () => void
}) {
  return (
    <div className={`space-y-4 ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-card border border-border-subtle bg-surface p-6">
          {variant === 'stat' ? (
            <div>
              <div className="mb-3 h-4 w-24 animate-pulse rounded bg-surface-elevated" />
              <div className="h-10 w-28 animate-pulse rounded bg-surface-elevated" />
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-start justify-between">
                <div className="w-1/2">
                  <div className="mb-2 h-5 animate-pulse rounded bg-surface-elevated" />
                  <div className="h-4 w-3/4 animate-pulse rounded bg-surface-elevated" />
                </div>
                <div className="h-6 w-20 animate-pulse rounded-full bg-surface-elevated" />
              </div>
              {variant === 'full' ? (
                <div className="mb-4 h-3 animate-pulse rounded-full bg-surface-elevated" />
              ) : null}
              <div className="flex gap-3">
                <div className="h-11 flex-1 animate-pulse rounded-[2rem] bg-surface-elevated" />
                <div className="h-4 w-16 animate-pulse rounded bg-surface-elevated" />
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  )
}

export function ErrorStatePanel({
  title,
  body,
  onRetry,
  backHref,
}: {
  title: string
  body: string
  onRetry?: () => void
  backHref?: string
}) {
  return (
    <div className="min-h-[400px] rounded-panel bg-surface p-12 text-center flex flex-col items-center justify-center">
      <div className="mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-red-900/30">
        <svg className="w-16 h-16 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 className="mb-3 text-2xl font-black text-white">{title}</h2>
      <p className="mb-8 max-w-md text-text-muted">{body}</p>
      {onRetry ? (
        <button className={`mb-2 px-8 py-3.5 ${primaryButtonClass}`} onClick={onRetry}>
          TRY AGAIN
        </button>
      ) : null}
      {backHref ? (
        <Link href={backHref} className="text-sm font-semibold text-text-muted hover:text-text-main">
          Back to dashboard
        </Link>
      ) : null}
    </div>
  )
}

export function EmptyStatePanel({
  title = 'No missions yet',
  description = "You haven't created any missions yet. Start by creating your first mission to get feedback from real testers.",
  onPrimaryAction,
  buttonLabel,
  icon,
}: {
  title?: string
  description?: string
  onPrimaryAction?: () => void
  buttonLabel?: string
  icon?: ReactNode
}) {
  return (
    <div className="min-h-[400px] rounded-panel bg-surface p-12 text-center flex flex-col items-center justify-center">
      <div className="mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-surface-elevated">
        {icon ?? (
          <svg className="w-16 h-16 text-text-muted" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        )}
      </div>
      <h2 className="mb-3 text-2xl font-black text-white">{title}</h2>
      <p className="mb-8 max-w-md text-text-muted">{description}</p>
      {onPrimaryAction && buttonLabel ? (
        <button className={`mb-4 px-8 py-3.5 ${primaryButtonClass}`} onClick={onPrimaryAction}>
          {buttonLabel}
        </button>
      ) : null}
    </div>
  )
}

export function NotFoundPanel({
  title = 'Mission not found',
  body = "The mission you're looking for doesn't exist or you don't have permission to view it.",
  backHref,
}: {
  title?: string
  body?: string
  backHref: string
}) {
  return (
    <div className="min-h-[500px] rounded-panel bg-surface p-12 text-center flex flex-col items-center justify-center">
      <div className="mb-8">
        <div className="mb-4 text-9xl font-black text-primary">404</div>
        <h2 className="mb-3 text-3xl font-black text-white">{title}</h2>
        <p className="mx-auto max-w-md text-lg text-text-muted">{body}</p>
      </div>
      <Link href={backHref} className={`px-8 py-3.5 ${primaryButtonClass}`}>
        BACK TO DASHBOARD
      </Link>
    </div>
  )
}

export function ModalShell({
  children,
  onClose,
}: {
  children: ReactNode
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 w-full">{children}</div>
    </div>
  )
}

export function ConfirmationDialog({
  title,
  body,
  confirmLabel,
  confirmStyle,
  onConfirm,
  onCancel,
  isLoading,
  errorMessage,
  cancelLabel = 'CANCEL',
  children,
}: {
  title: string
  body: string
  confirmLabel: string
  confirmStyle: 'danger' | 'primary'
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
  errorMessage?: string
  cancelLabel?: string
  children?: ReactNode
}) {
  const confirmClass =
    confirmStyle === 'danger'
      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white'
      : 'bg-gradient-to-r from-[#F97C5A] to-[#E45D43] text-white'

  return (
    <ModalShell onClose={onCancel}>
      <div className="mx-auto max-w-lg rounded-card border border-border-subtle bg-surface-elevated p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-900/30">
            <svg className="w-8 h-8 text-amber-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="mb-2 text-2xl font-black text-white">{title}</h2>
          <p className="text-text-muted">{body}</p>
        </div>
        {children ? <div className="mb-4">{children}</div> : null}
        {errorMessage ? <p className="mb-4 text-sm text-red-400">{errorMessage}</p> : null}
        <div className="flex items-center gap-3">
          <button className="flex-1 rounded-[2rem] border border-border-subtle bg-surface py-3.5 font-black text-text-main transition-all hover:bg-surface-elevated" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={`flex flex-1 items-center justify-center gap-2 rounded-[2rem] py-3.5 font-black transition-all hover:shadow-lg hover:scale-[1.02] disabled:pointer-events-none disabled:opacity-70 ${confirmClass}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? <SpinnerIcon /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </ModalShell>
  )
}
 
export function StarRow({
  value,
  onChange,
  readonly = false,
  size = 16,
}: {
  value: number
  onChange?: (nextValue: number) => void
  readonly?: boolean
  size?: number
}) {
  const [hoveredValue, setHoveredValue] = useState(0)
  const displayedValue = hoveredValue || value
  const roundedValue = Math.round(displayedValue)
  const isInteractive = !readonly && typeof onChange === 'function'

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, index) => {
        const nextValue = index + 1
        const filled = index < roundedValue
        const star = (
          <Star
            size={size}
            className={`${filled ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'} transition-all`}
          />
        )

        if (!isInteractive) {
          return <div key={nextValue}>{star}</div>
        }

        return (
          <button
            key={nextValue}
            type="button"
            onMouseEnter={() => setHoveredValue(nextValue)}
            onMouseLeave={() => setHoveredValue(0)}
            onFocus={() => setHoveredValue(nextValue)}
            onBlur={() => setHoveredValue(0)}
            onClick={() => onChange(nextValue)}
            aria-label={`Rate ${nextValue} star${nextValue === 1 ? '' : 's'}`}
            className="rounded-full p-0.5 transition-transform hover:scale-110"
          >
            {star}
          </button>
        )
      })}
    </div>
  )
}

export function GlyphChip({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`flex h-8 w-8 items-center justify-center rounded-xl text-lg font-bold ${className}`}>
      {children}
    </div>
  )
}

export function StatCard({
  label,
  value,
  glyph,
  colorClass,
  glyphColorClass,
}: {
  label: string
  value: string | number
  glyph: ReactNode
  colorClass: string
  glyphColorClass: string
}) {
  return (
    <div className={`rounded-card border border-border-subtle bg-surface p-6 transition-all hover:border-primary/40 ${colorClass}`}>
      <div className="mb-4 flex items-center gap-3">
        <GlyphChip className={glyphColorClass}>{glyph}</GlyphChip>
        <div className="text-sm font-bold text-text-muted">{label}</div>
      </div>
      <div className="text-4xl font-black text-white">{value}</div>
    </div>
  )
}

export function SidebarNavItem({
  glyph,
  label,
  href,
  onClick,
  active = false,
  disabled = false,
}: {
  glyph: ReactNode
  label: string
  href?: string
  onClick?: () => void
  active?: boolean
  disabled?: boolean
}) {
  const className = active
    ? 'flex items-center gap-3 rounded-2xl bg-primary/10 px-4 py-3 text-sm font-bold text-primary'
    : 'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-text-muted transition-colors hover:bg-surface-elevated hover:text-text-main'

  const content = (
    <>
      <GlyphChip className={active ? 'bg-primary/20 text-primary' : 'bg-surface-elevated text-text-muted'}>
        {glyph}
      </GlyphChip>
      {label}
    </>
  )

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    )
  }

  return (
    <button
      type="button"
      className={`${className} w-full text-left ${disabled ? 'cursor-default text-text-muted/40 hover:bg-transparent hover:text-text-muted/40' : ''}`}
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled ? 'true' : undefined}
    >
      {content}
    </button>
  )
}

export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children?: ReactNode
}) {
  return (
    <header className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
      <div>
        <h1 className="mb-1 text-4xl font-black text-white">{title}</h1>
        {subtitle ? <p className="text-lg text-text-muted">{subtitle}</p> : null}
      </div>
      {children ? <div className="flex items-center gap-3">{children}</div> : null}
    </header>
  )
}

const skeletonPulseClass = 'animate-pulse bg-surface-elevated'

export function CoinBalanceSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-[1.7rem] border border-border-subtle bg-surface px-4 py-3">
      <div className={`h-10 w-10 rounded-[1rem] ${skeletonPulseClass}`} />
      <div>
        <div className={`h-2.5 w-24 rounded-full ${skeletonPulseClass}`} />
        <div className={`mt-2 h-7 w-40 rounded-full ${skeletonPulseClass}`} />
      </div>
    </div>
  )
}

export function WizardStepSkeleton({ step = 1 }: { step?: number }) {
  if (step === 1) {
    return (
      <div className="space-y-8">
        <div>
          <div className={`mb-3 h-3 w-40 rounded-full ${skeletonPulseClass}`} />
          <div className={`h-12 rounded-2xl ${skeletonPulseClass}`} />
          <div className="mt-2 flex items-center justify-between">
            <div className={`h-4 w-28 rounded-full ${skeletonPulseClass}`} />
            <div className={`h-4 w-12 rounded-full ${skeletonPulseClass}`} />
          </div>
        </div>

        <div>
          <div className={`mb-3 h-3 w-44 rounded-full ${skeletonPulseClass}`} />
          <div className={`h-32 rounded-2xl ${skeletonPulseClass}`} />
          <div className="mt-2 flex items-center justify-between">
            <div className={`h-4 w-36 rounded-full ${skeletonPulseClass}`} />
            <div className={`h-4 w-14 rounded-full ${skeletonPulseClass}`} />
          </div>
        </div>

        <div>
          <div className={`mb-3 h-3 w-24 rounded-full ${skeletonPulseClass}`} />
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="rounded-card border-2 border-[#e5e4e0] bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
              >
                <div className={`mb-2 h-6 w-20 rounded-full ${skeletonPulseClass}`} />
                <div className={`h-4 w-32 rounded-full ${skeletonPulseClass}`} />
                <div className={`mt-3 h-4 w-24 rounded-full ${skeletonPulseClass}`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (step === 2) {
    return (
      <div className="space-y-8">
        <div className="rounded-card border border-[#e5e4e0] bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className={`mb-3 h-3 w-32 rounded-full ${skeletonPulseClass}`} />
          <div className={`h-2 rounded-full ${skeletonPulseClass}`} />
          <div className="mt-4 flex flex-col items-center">
            <div className={`h-8 w-36 rounded-full ${skeletonPulseClass}`} />
            <div className={`mt-2 h-4 w-32 rounded-full ${skeletonPulseClass}`} />
          </div>
        </div>

        <div className="rounded-card border border-[#e5e4e0] bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className={`mb-3 h-3 w-36 rounded-full ${skeletonPulseClass}`} />
          <div className={`h-2 rounded-full ${skeletonPulseClass}`} />
          <div className="mt-4 flex justify-center">
            <div className={`h-8 w-32 rounded-full ${skeletonPulseClass}`} />
          </div>
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-[#1a1625] to-[#2d2840] p-6">
          <div className={`mb-4 h-3 w-32 rounded-full ${skeletonPulseClass}`} />
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className={`h-4 w-40 rounded-full ${skeletonPulseClass}`} />
              <div className={`h-4 w-20 rounded-full ${skeletonPulseClass}`} />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className={`h-4 w-32 rounded-full ${skeletonPulseClass}`} />
              <div className={`h-4 w-20 rounded-full ${skeletonPulseClass}`} />
            </div>
            <div className="my-3 border-t border-white/20" />
            <div className="flex items-center justify-between gap-4">
              <div className={`h-6 w-20 rounded-full ${skeletonPulseClass}`} />
              <div className="flex flex-col items-end gap-2">
                <div className={`h-6 w-28 rounded-full ${skeletonPulseClass}`} />
                <div className={`h-4 w-16 rounded-full ${skeletonPulseClass}`} />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-card border border-[#e5e4e0] bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className={`h-7 w-20 rounded-full ${skeletonPulseClass}`} />
            ))}
          </div>
          <div className={`h-12 rounded-2xl ${skeletonPulseClass}`} />
          <div className={`mt-3 h-12 rounded-2xl ${skeletonPulseClass}`} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {Array.from({ length: 2 }).map((_, index) => (
        <div
          key={index}
          className="rounded-card border border-[#e5e4e0] bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className={`h-4 w-24 rounded-full ${skeletonPulseClass}`} />
            <div className={`h-5 w-5 rounded-full ${skeletonPulseClass}`} />
          </div>
          <div className={`h-12 rounded-2xl ${skeletonPulseClass}`} />
          <div className={`mt-2 h-4 w-32 rounded-full ${skeletonPulseClass}`} />
          <div className="mt-4 flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, chipIndex) => (
              <div key={chipIndex} className={`h-8 w-24 rounded-full ${skeletonPulseClass}`} />
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className={`h-4 w-20 rounded-full ${skeletonPulseClass}`} />
            <div className="flex items-center gap-2">
              <div className={`h-5 w-5 rounded-full ${skeletonPulseClass}`} />
              <div className={`h-5 w-5 rounded-full ${skeletonPulseClass}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
