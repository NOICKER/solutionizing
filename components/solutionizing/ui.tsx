"use client"

import Link from 'next/link'
import { Star } from 'lucide-react'
import { ReactNode, useEffect, useState } from 'react'

export const primaryButtonClass =
  'inline-flex items-center justify-center min-h-[44px] rounded-full bg-[var(--electric)] px-6 py-2.5 text-[var(--cream)] font-bold hover:shadow-[0_8px_24px_var(--electric-dim)] transition-all disabled:pointer-events-none disabled:opacity-70 cursor-none'

export const outlineButtonClass =
  'inline-flex items-center justify-center min-h-[44px] rounded-full border-2 border-[var(--border-strong)] bg-transparent px-6 py-2.5 text-[var(--ink)] font-bold hover:border-[var(--electric)] hover:text-[var(--electric)] transition-all disabled:pointer-events-none disabled:opacity-70 cursor-none'

export const mutedButtonClass =
  'inline-flex items-center justify-center min-h-[44px] rounded-full border border-[var(--border-strong)] bg-[var(--bg-light)] px-6 py-2.5 text-[var(--ink-soft)] font-semibold hover:bg-[var(--bg)] hover:text-[var(--ink)] transition-all disabled:pointer-events-none disabled:opacity-70 cursor-none'

export const textFieldClass =
  'w-full rounded-2xl border border-[var(--border)] bg-[var(--cream)] px-4 py-3 text-base text-[var(--ink)] placeholder:text-[var(--ink-soft)] transition-all focus:outline-none focus:border-[var(--electric)] focus:ring-1 focus:ring-[var(--electric)] cursor-none'

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

export function BrandMark({ className = 'w-8 h-8 text-[var(--ink)]' }: { className?: string }) {
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
    DRAFT: 'bg-[rgba(251,191,36,0.12)] text-[#92400e]',
    PENDING_REVIEW: 'bg-[rgba(251,191,36,0.12)] text-[#92400e]',
    APPROVED: 'bg-[rgba(56,189,248,0.12)] text-[#0369a1]',
    ACTIVE: 'bg-[rgba(74,197,128,0.12)] text-[#1e7a47]',
    PAUSED: 'bg-[rgba(139,92,246,0.1)] text-[#5b21b6]',
    COMPLETED: 'bg-[rgba(56,189,248,0.12)] text-[#0369a1]',
    REJECTED: 'bg-[rgba(192,57,43,0.1)] text-[#c0392b]',
    ASSIGNED: 'bg-[rgba(74,197,128,0.12)] text-[#1e7a47]',
    IN_PROGRESS: 'bg-[rgba(251,191,36,0.12)] text-[#92400e]',
  }

  return (
    <div className={`inline-flex rounded-full px-3 py-1 font-[family-name:var(--font-dm-mono)] uppercase tracking-[0.1em] text-[0.65rem] ${styleMap[status] ?? 'bg-[var(--bg-light)] text-[var(--ink-soft)]'}`}>
      {status === 'PENDING_REVIEW'
        ? 'UNDER REVIEW'
        : status === 'APPROVED'
          ? 'READY TO LAUNCH'
          : status.replaceAll('_', ' ')}
    </div>
  )
}

export function MissionHealthScoreBadge({ score }: { score: number | null | undefined }) {
  if (score == null) {
    return null
  }

  const tone =
    score >= 80
      ? { label: 'Strong Signal', className: 'bg-[rgba(74,197,128,0.12)] text-[#1e7a47]' }
      : score >= 50
        ? { label: 'Mixed Signal', className: 'bg-[rgba(251,191,36,0.12)] text-[#92400e]' }
        : { label: 'Weak Signal', className: 'bg-[rgba(192,57,43,0.1)] text-[#c0392b]' }

  return (
    <div className={`inline-flex rounded-full px-3 py-1 font-[family-name:var(--font-dm-mono)] uppercase tracking-[0.1em] text-[0.65rem] font-bold ${tone.className}`}>
      {tone.label}
    </div>
  )
}

export function RetestCountChip({ count }: { count: number }) {
  const label = `${count} retest${count === 1 ? '' : 's'}`

  return (
    <div className="inline-flex rounded-full bg-[rgba(139,92,246,0.1)] text-[#5b21b6] px-3 py-1 font-[family-name:var(--font-dm-mono)] uppercase tracking-[0.1em] text-[0.65rem] font-bold">
      ↻ {label}
    </div>
  )
}

export function ReputationTierBadge({ tier }: { tier: string }) {
  const styleMap: Record<string, string> = {
    NEWCOMER: 'bg-[rgba(107,92,74,0.1)] text-[var(--ink-soft)]',
    RELIABLE: 'bg-[rgba(56,189,248,0.12)] text-[#0369a1]',
    TRUSTED: 'bg-[rgba(139,92,246,0.1)] text-[#5b21b6]',
    ELITE: 'bg-[rgba(180,120,60,0.1)] text-[#92400e]',
  }

  return (
    <span className={`inline-flex rounded-full px-3 py-1 font-[family-name:var(--font-dm-mono)] uppercase tracking-[0.1em] text-[0.65rem] ${styleMap[tier] ?? 'bg-[var(--bg-light)] text-[var(--ink-soft)]'}`}>
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
          className="relative h-full overflow-visible bg-[var(--electric)]"
          style={{
            width: `${progress}%`,
            transitionDuration: `${transitionDuration}ms`,
            transitionProperty: 'width',
            transitionTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
          }}
        >
          <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[calc(100%+0.375rem)] text-[11px] font-bold text-[var(--electric)]">
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
    <div className={`space-y-4 ${onClick ? 'cursor-none' : ''}`} onClick={onClick}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-card border border-[var(--border)] bg-[var(--bg-light)] p-6">
          {variant === 'stat' ? (
            <div>
              <div className="mb-3 h-4 w-24 animate-pulse rounded bg-[var(--cream)]" />
              <div className="h-10 w-28 animate-pulse rounded bg-[var(--cream)]" />
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-start justify-between">
                <div className="w-1/2">
                  <div className="mb-2 h-5 animate-pulse rounded bg-[var(--cream)]" />
                  <div className="h-4 w-3/4 animate-pulse rounded bg-[var(--cream)]" />
                </div>
                <div className="h-6 w-20 animate-pulse rounded-full bg-[var(--cream)]" />
              </div>
              {variant === 'full' ? (
                <div className="mb-4 h-3 animate-pulse rounded-full bg-[var(--cream)]" />
              ) : null}
              <div className="flex gap-3">
                <div className="h-11 flex-1 animate-pulse rounded-[2rem] bg-[var(--cream)]" />
                <div className="h-4 w-16 animate-pulse rounded bg-[var(--cream)]" />
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
    <div className="min-h-[400px] rounded-panel bg-[var(--bg-light)] p-6 sm:p-12 text-center flex flex-col items-center justify-center">
      <div className="mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-red-900/30">
        <svg className="w-16 h-16 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 className="mb-3 text-2xl font-[family-name:var(--font-fraunces)] italic font-normal text-[var(--ink)]">{title}</h2>
      <p className="mb-8 max-w-md text-[var(--ink-soft)]">{body}</p>
      {onRetry ? (
        <button className={`mb-2 px-8 py-3.5 ${primaryButtonClass} cursor-none`} onClick={onRetry}>
          TRY AGAIN
        </button>
      ) : null}
      {backHref ? (
        <Link href={backHref} className="text-sm font-semibold text-[var(--ink-soft)] hover:text-[var(--ink)] cursor-none">
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
    <div className="min-h-[400px] rounded-panel bg-[var(--bg-light)] p-6 sm:p-12 text-center flex flex-col items-center justify-center">
      <div className="mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-[var(--cream)]">
        {icon ?? (
          <svg className="w-16 h-16 text-[var(--ink-soft)]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        )}
      </div>
      <h2 className="mb-3 text-2xl font-[family-name:var(--font-fraunces)] italic font-normal text-[var(--ink)]">{title}</h2>
      <p className="mb-8 max-w-md text-[var(--ink-soft)]">{description}</p>
      {onPrimaryAction && buttonLabel ? (
        <button className={`mb-4 px-8 py-3.5 ${primaryButtonClass} cursor-none`} onClick={onPrimaryAction}>
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
    <div className="min-h-[500px] rounded-panel bg-[var(--bg-light)] p-6 sm:p-12 text-center flex flex-col items-center justify-center">
      <div className="mb-8">
        <div className="mb-4 text-9xl font-bold text-[var(--electric)]">404</div>
        <h2 className="mb-3 text-3xl font-[family-name:var(--font-fraunces)] italic font-normal text-[var(--ink)]">{title}</h2>
        <p className="mx-auto max-w-md text-lg text-[var(--ink-soft)]">{body}</p>
      </div>
      <Link href={backHref} className={`px-8 py-3.5 ${primaryButtonClass} cursor-none`}>
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
      ? 'bg-red-600 text-[var(--cream)]'
      : 'bg-[var(--electric)] text-[var(--cream)]'

  return (
    <ModalShell onClose={onCancel}>
      <div className="mx-auto w-full max-w-lg rounded-card border border-[var(--border)] bg-[var(--cream)] p-6 sm:p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-900/30">
            <svg className="w-8 h-8 text-amber-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="mb-2 text-2xl font-[family-name:var(--font-fraunces)] italic font-normal text-[var(--ink)]">{title}</h2>
          <p className="text-[var(--ink-soft)]">{body}</p>
        </div>
        {children ? <div className="mb-4">{children}</div> : null}
        {errorMessage ? <p className="mb-4 text-sm text-red-400">{errorMessage}</p> : null}
        <div className="flex items-center gap-3">
          <button className="flex-1 rounded-[2rem] border border-[var(--border)] bg-[var(--bg-light)] py-3.5 font-bold text-[var(--ink)] transition-all hover:bg-[var(--cream)] cursor-none" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={`flex flex-1 items-center justify-center gap-2 rounded-full py-3.5 font-bold transition-all hover:shadow-[0_8px_24px_var(--electric-dim)] disabled:pointer-events-none disabled:opacity-70 cursor-none ${confirmClass}`}
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
            className="rounded-full p-0.5 transition-transform hover:scale-110 cursor-none"
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
    <div className={`rounded-card border border-[var(--border)] bg-[var(--bg-light)] p-6 transition-all hover:border-[var(--electric)]/40 ${colorClass}`}>
      <div className="mb-4 flex items-center gap-3">
        <GlyphChip className={glyphColorClass}>{glyph}</GlyphChip>
        <div className="text-sm font-bold text-[var(--ink-soft)]">{label}</div>
      </div>
      <div className="text-3xl sm:text-4xl font-[family-name:var(--font-fraunces)] italic font-normal text-[var(--ink)]">{value}</div>
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
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  const baseClassName = active
    ? 'relative overflow-hidden flex items-center gap-3 rounded-2xl bg-[var(--electric-dim)] px-4 py-3 text-sm font-bold text-[var(--electric)] transition-all'
    : 'relative overflow-hidden flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-[var(--ink-soft)] transition-all hover:text-[var(--ink)]'

  const content = (
    <>
      {/* Spotlight overlay */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: isHovered && !disabled ? 1 : 0,
          background: `radial-gradient(60px circle at ${mousePos.x}px ${mousePos.y}px, var(--electric-dim), transparent 100%)`
        }}
      />
      <div className="relative z-10 flex items-center gap-3 w-full">
        <GlyphChip className={active ? 'bg-[var(--electric-mid)] text-[var(--electric)]' : 'bg-[var(--bg-light)] text-[var(--ink-soft)] group-hover:bg-[var(--border)] group-hover:text-[var(--ink)] transition-all'}>
          {glyph}
        </GlyphChip>
        {label}
      </div>
    </>
  )

  if (href) {
    return (
      <Link 
        href={href} 
        className={`${baseClassName} group cursor-none`} 
        data-hide-cursor="true"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {content}
      </Link>
    )
  }

  return (
    <button
      type="button"
      className={`${baseClassName} group w-full text-left cursor-none ${disabled ? 'opacity-50' : ''}`}
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled ? 'true' : undefined}
      data-hide-cursor="true"
      onMouseMove={disabled ? undefined : handleMouseMove}
      onMouseEnter={disabled ? undefined : () => setIsHovered(true)}
      onMouseLeave={disabled ? undefined : () => setIsHovered(false)}
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
    <header className="mb-6 sm:mb-10 flex flex-col justify-between gap-4 sm:gap-6 md:flex-row md:items-center">
      <div>
        <h1 className="mb-1 text-3xl sm:text-4xl font-[family-name:var(--font-fraunces)] italic font-normal text-[var(--ink)]">{title}</h1>
        <div className="w-10 h-[3px] rounded-full bg-[var(--electric)] mt-1.5" />
        {subtitle ? <p className="text-base sm:text-lg text-[var(--ink-soft)]">{subtitle}</p> : null}
      </div>
      {children ? <div className="flex flex-wrap items-center gap-3">{children}</div> : null}
    </header>
  )
}

const skeletonPulseClass = 'animate-pulse bg-surface-elevated'

export function CoinBalanceSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-[1.7rem] border border-[var(--border)] bg-[var(--bg-light)] px-4 py-3">
      <div className="h-10 w-10 rounded-[1rem] animate-pulse bg-[var(--cream)]" />
      <div>
        <div className="h-2.5 w-24 rounded-full animate-pulse bg-[var(--cream)]" />
        <div className="mt-2 h-7 w-40 rounded-full animate-pulse bg-[var(--cream)]" />
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
                className="rounded-card border-2 border-[var(--border)] bg-[var(--cream)] p-6"
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
        <div className="rounded-card border border-[var(--border)] bg-[var(--cream)] p-6">
          <div className={`mb-3 h-3 w-32 rounded-full ${skeletonPulseClass}`} />
          <div className={`h-2 rounded-full ${skeletonPulseClass}`} />
          <div className="mt-4 flex flex-col items-center">
            <div className={`h-8 w-36 rounded-full ${skeletonPulseClass}`} />
            <div className={`mt-2 h-4 w-32 rounded-full ${skeletonPulseClass}`} />
          </div>
        </div>

        <div className="rounded-card border border-[var(--border)] bg-[var(--cream)] p-6">
          <div className={`mb-3 h-3 w-36 rounded-full ${skeletonPulseClass}`} />
          <div className={`h-2 rounded-full ${skeletonPulseClass}`} />
          <div className="mt-4 flex justify-center">
            <div className={`h-8 w-32 rounded-full ${skeletonPulseClass}`} />
          </div>
        </div>

        <div className="rounded-3xl bg-[var(--bg-light)] border border-[var(--border)] p-6">
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
            <div className="my-3 border-t border-[rgba(250,247,242,0.2)]" />
            <div className="flex items-center justify-between gap-4">
              <div className={`h-6 w-20 rounded-full ${skeletonPulseClass}`} />
              <div className="flex flex-col items-end gap-2">
                <div className={`h-6 w-28 rounded-full ${skeletonPulseClass}`} />
                <div className={`h-4 w-16 rounded-full ${skeletonPulseClass}`} />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-card border border-[var(--border)] bg-[var(--cream)] p-6">
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
          className="rounded-card border border-[var(--border)] bg-[var(--cream)] p-6"
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
