"use client"

import {
  FLAG_REASON_OPTIONS,
  type FlagReasonValue,
} from '@/lib/flags'
import {
  outlineButtonClass,
  primaryButtonClass,
  SpinnerIcon,
  textFieldClass,
} from '@/components/solutionizing/ui'

interface FlagSignalModalProps {
  title: string
  subtitle: string
  targetLabel: string
  reason: FlagReasonValue | ''
  details: string
  errorMessage: string
  isSubmitting: boolean
  onReasonChange: (value: FlagReasonValue | '') => void
  onDetailsChange: (value: string) => void
  onClose: () => void
  onSubmit: () => void
}

export function FlagSignalModal({
  title,
  subtitle,
  targetLabel,
  reason,
  details,
  errorMessage,
  isSubmitting,
  onReasonChange,
  onDetailsChange,
  onClose,
  onSubmit,
}: FlagSignalModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(6,8,16,0.72)] p-4 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Close flag modal"
        className="absolute inset-0"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-xl rounded-panel border border-border-subtle bg-surface p-8 shadow-2xl">
        <div className="mb-6">
          <div className="mb-2 inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[0.72rem] font-black uppercase tracking-[0.18em] text-primary">
            Quick flag
          </div>
          <h2 className="text-2xl font-black text-white">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-text-muted">{subtitle}</p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
            Target: {targetLabel}
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
              Flag reason
            </label>
            <select
              value={reason}
              onChange={(event) => onReasonChange(event.target.value as FlagReasonValue | '')}
              className={textFieldClass}
            >
              <option value="">Select a quick signal</option>
              {FLAG_REASON_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {reason ? (
              <p className="mt-2 text-sm text-text-muted">
                {FLAG_REASON_OPTIONS.find((option) => option.value === reason)?.description}
              </p>
            ) : null}
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
              Extra context
            </label>
            <textarea
              value={details}
              onChange={(event) => onDetailsChange(event.target.value)}
              rows={4}
              maxLength={300}
              placeholder="Optional note. Keep it short and specific."
              className={`${textFieldClass} resize-none`}
            />
            <div className="mt-2 text-right text-xs text-text-muted">
              {details.length} / 300
            </div>
          </div>
        </div>

        {errorMessage ? <p className="mt-4 text-sm text-red-400">{errorMessage}</p> : null}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            className={`px-5 py-3 text-sm ${outlineButtonClass}`}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            className={`inline-flex items-center justify-center gap-2 px-5 py-3 text-sm ${primaryButtonClass}`}
            onClick={onSubmit}
          >
            {isSubmitting ? <SpinnerIcon /> : null}
            Submit flag
          </button>
        </div>
      </div>
    </div>
  )
}
