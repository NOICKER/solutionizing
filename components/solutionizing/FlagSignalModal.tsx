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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(26,22,37,0.55)] p-4">
      <button
        type="button"
        aria-label="Close flag modal"
        className="absolute inset-0"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-xl rounded-panel border border-[#ece6df] bg-white p-8 shadow-2xl dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-6">
          <div className="mb-2 inline-flex rounded-full bg-[#d77a57]/10 px-3 py-1 text-[0.72rem] font-black uppercase tracking-[0.18em] text-[#d77a57] dark:bg-[#d77a57]/20 dark:text-[#f0a98c]">
            Quick flag
          </div>
          <h2 className="text-2xl font-black text-[#1a1625] dark:text-white">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-[#6b687a] dark:text-gray-400">{subtitle}</p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#9b98a8] dark:text-gray-500">
            Target: {targetLabel}
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#9b98a8] dark:text-gray-400">
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
              <p className="mt-2 text-sm text-[#6b687a] dark:text-gray-400">
                {FLAG_REASON_OPTIONS.find((option) => option.value === reason)?.description}
              </p>
            ) : null}
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#9b98a8] dark:text-gray-400">
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
            <div className="mt-2 text-right text-xs text-[#9b98a8] dark:text-gray-500">
              {details.length} / 300
            </div>
          </div>
        </div>

        {errorMessage ? <p className="mt-4 text-sm text-red-600 dark:text-red-400">{errorMessage}</p> : null}

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
