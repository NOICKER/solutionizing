"use client"

import Link from 'next/link'
import { Star } from 'lucide-react'
import { ReactNode, useState } from 'react'

export const primaryButtonClass =
  'rounded-[2rem] bg-gradient-to-r from-[#d77a57] to-[#c4673f] text-white font-black hover:shadow-lg hover:scale-[1.02] transition-all disabled:pointer-events-none disabled:opacity-70'

export const outlineButtonClass =
  'rounded-[2rem] border-2 border-[#d77a57] text-[#d77a57] font-bold hover:bg-[#d77a57] hover:text-white transition-all disabled:pointer-events-none disabled:opacity-70 dark:border-[#d77a57]/80 dark:text-[#d77a57] dark:hover:bg-[#d77a57] dark:hover:text-white'

export const mutedButtonClass =
  'rounded-[2rem] border border-[#e5e4e0] bg-white text-[#6b687a] font-semibold hover:bg-[#f3f3f5] transition-all disabled:pointer-events-none disabled:opacity-70 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700'

export const textFieldClass =
  'w-full rounded-2xl border border-[#e5e4e0] bg-white px-4 py-3 text-[#1a1625] placeholder:text-[#9b98a8] transition-all focus:outline-none focus:ring-2 focus:ring-[#d77a57] dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400'

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
    DRAFT: 'bg-gray-100 text-gray-600',
    PENDING_REVIEW: 'bg-amber-100 text-amber-700',
    ACTIVE: 'bg-green-100 text-green-700',
    PAUSED: 'bg-orange-100 text-orange-700',
    COMPLETED: 'bg-blue-100 text-blue-700',
    REJECTED: 'bg-red-100 text-red-700',
    ASSIGNED: 'bg-green-100 text-green-700',
    IN_PROGRESS: 'bg-amber-100 text-amber-700',
  }

  return (
    <div className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${styleMap[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status === 'PENDING_REVIEW' ? 'UNDER REVIEW' : status.replaceAll('_', ' ')}
    </div>
  )
}

export function ReputationTierBadge({ tier }: { tier: string }) {
  const styleMap: Record<string, string> = {
    NEWCOMER: 'bg-gray-100 text-gray-700',
    RELIABLE: 'bg-blue-100 text-blue-700',
    TRUSTED: 'bg-purple-100 text-purple-700',
    ELITE: 'bg-amber-100 text-amber-800',
  }

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${styleMap[tier] ?? 'bg-gray-100 text-gray-700'}`}>
      {tier}
    </span>
  )
}

type DashboardCardSkeletonVariant = 'stat' | 'card' | 'full'

export function DashboardCardSkeleton({
  count,
  variant = 'full',
}: {
  count: number
  variant?: DashboardCardSkeletonVariant
}) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-card border border-[#e5e4e0] bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          {variant === 'stat' ? (
            <div>
              <div className="mb-3 h-4 w-24 animate-pulse rounded bg-[#e5e4e0] dark:bg-gray-700" />
              <div className="h-10 w-28 animate-pulse rounded bg-[#e5e4e0] dark:bg-gray-700" />
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-start justify-between">
                <div className="w-1/2">
                  <div className="mb-2 h-5 animate-pulse rounded bg-[#e5e4e0] dark:bg-gray-700" />
                  <div className="h-4 w-3/4 animate-pulse rounded bg-[#e5e4e0] dark:bg-gray-700" />
                </div>
                <div className="h-6 w-20 animate-pulse rounded-full bg-[#e5e4e0] dark:bg-gray-700" />
              </div>
              {variant === 'full' ? (
                <div className="mb-4 h-3 animate-pulse rounded-full bg-[#f3f3f5] dark:bg-gray-700" />
              ) : null}
              <div className="flex gap-3">
                <div className="h-11 flex-1 animate-pulse rounded-[2rem] bg-[#e5e4e0] dark:bg-gray-700" />
                <div className="h-4 w-16 animate-pulse rounded bg-[#e5e4e0] dark:bg-gray-700" />
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
    <div className="min-h-[400px] rounded-panel bg-[#faf9f7] p-12 text-center dark:bg-gray-900/60 flex flex-col items-center justify-center">
      <div className="mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-red-50">
        <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 className="mb-3 text-2xl font-black text-[#1a1625] dark:text-white">{title}</h2>
      <p className="mb-8 max-w-md text-[#6b687a] dark:text-gray-400">{body}</p>
      {onRetry ? (
        <button className={`mb-2 px-8 py-3.5 ${primaryButtonClass}`} onClick={onRetry}>
          TRY AGAIN
        </button>
      ) : null}
      {backHref ? (
        <Link href={backHref} className="text-sm font-semibold text-[#6b687a] hover:text-[#1a1625] dark:text-gray-400 dark:hover:text-white">
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
    <div className="min-h-[400px] rounded-panel bg-[#faf9f7] p-12 text-center dark:bg-gray-900/60 flex flex-col items-center justify-center">
      <div className="mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-[#f3f3f5] dark:bg-gray-800">
        {icon ?? (
          <svg className="w-16 h-16 text-[#9b98a8] dark:text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        )}
      </div>
      <h2 className="mb-3 text-2xl font-black text-[#1a1625] dark:text-white">{title}</h2>
      <p className="mb-8 max-w-md text-[#6b687a] dark:text-gray-400">{description}</p>
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
    <div className="min-h-[500px] rounded-panel bg-[#faf9f7] p-12 text-center dark:bg-gray-900/60 flex flex-col items-center justify-center">
      <div className="mb-8">
        <div className="mb-4 text-9xl font-black text-[#d77a57]">404</div>
        <h2 className="mb-3 text-3xl font-black text-[#1a1625] dark:text-white">{title}</h2>
        <p className="mx-auto max-w-md text-lg text-[#6b687a] dark:text-gray-400">{body}</p>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(26,22,37,0.55)] p-4 dark:bg-[rgba(2,6,23,0.82)]">
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
      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
      : 'bg-gradient-to-r from-[#d77a57] to-[#c4673f] text-white'

  return (
    <ModalShell onClose={onCancel}>
      <div className="mx-auto max-w-lg rounded-card border border-[#e5e4e0] bg-white p-8 shadow-2xl dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-6 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <svg className="w-8 h-8 text-amber-600 dark:text-amber-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="mb-2 text-2xl font-black text-[#1a1625] dark:text-white">{title}</h2>
          <p className="text-[#6b687a] dark:text-gray-400">{body}</p>
        </div>
        {children ? <div className="mb-4">{children}</div> : null}
        {errorMessage ? <p className="mb-4 text-sm text-red-600 dark:text-red-400">{errorMessage}</p> : null}
        <div className="flex items-center gap-3">
          <button className="flex-1 rounded-[2rem] border-2 border-[#e5e4e0] bg-[#f3f3f5] py-3.5 font-black text-[#1a1625] transition-all hover:bg-[#e5e4e0] dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600" onClick={onCancel}>
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
    <div className={`rounded-card border border-[#e5e4e0] bg-white p-6 transition-all hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 ${colorClass}`}>
      <div className="mb-4 flex items-center gap-3">
        <GlyphChip className={glyphColorClass}>{glyph}</GlyphChip>
        <div className="text-sm font-bold text-[#6b687a] dark:text-gray-400">{label}</div>
      </div>
      <div className="text-4xl font-black text-[#1a1625] dark:text-white">{value}</div>
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
    ? 'flex items-center gap-3 rounded-2xl bg-[#f7ede8] px-4 py-3 text-sm font-bold text-[#d77a57] dark:bg-[#d77a57]/20 dark:text-[#d77a57]'
    : 'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-[#6b687a] transition-colors hover:bg-[#f6f1ec] hover:text-[#1a1625] dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'

  const content = (
    <>
      <GlyphChip className={active ? 'bg-[#f3ddd3] text-[#d77a57] dark:bg-[#d77a57]/30 dark:text-[#d77a57]' : 'bg-[#f6f1ec] text-[#8b8797] dark:bg-gray-800 dark:text-gray-400'}>
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
      className={`${className} w-full text-left ${disabled ? 'cursor-default text-[#a39ead] hover:bg-transparent hover:text-[#a39ead]' : ''}`}
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
        <h1 className="mb-1 text-4xl font-black text-[#1a1625] dark:text-white">{title}</h1>
        {subtitle ? <p className="text-lg text-[#6b687a] dark:text-gray-400">{subtitle}</p> : null}
      </div>
      {children ? <div className="flex items-center gap-3">{children}</div> : null}
    </header>
  )
}
