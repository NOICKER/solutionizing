export const FLAG_REASON_VALUES = [
  'CONFUSING',
  'UNCLEAR_NEXT_STEP',
  'FEELS_SUSPICIOUS',
  'HARD_TO_USE',
  'TOO_SLOW_OR_ANNOYING',
  'NOT_COMPELLING',
] as const

export const FLAG_STATUS_VALUES = ['PENDING', 'RESOLVED', 'DISMISSED'] as const

export type FlagReasonValue = (typeof FLAG_REASON_VALUES)[number]
export type FlagStatusValue = (typeof FLAG_STATUS_VALUES)[number]

export const FLAG_REASON_OPTIONS: Array<{
  value: FlagReasonValue
  label: string
  description: string
}> = [
  {
    value: 'CONFUSING',
    label: 'Confusing',
    description: 'The experience or response felt unclear at a glance.',
  },
  {
    value: 'UNCLEAR_NEXT_STEP',
    label: "Didn't understand what to do",
    description: 'The next action or expected response was not obvious.',
  },
  {
    value: 'FEELS_SUSPICIOUS',
    label: 'Feels suspicious',
    description: 'Something about the interaction felt off, risky, or untrustworthy.',
  },
  {
    value: 'HARD_TO_USE',
    label: 'Hard to use',
    description: 'The flow, response, or interaction created unnecessary friction.',
  },
  {
    value: 'TOO_SLOW_OR_ANNOYING',
    label: 'Too slow or annoying',
    description: 'The experience felt tedious, sluggish, or frustrating to continue.',
  },
  {
    value: 'NOT_COMPELLING',
    label: 'Not compelling',
    description: 'The value or usefulness did not come through clearly enough.',
  },
]

export const FLAG_REASON_LABELS = Object.fromEntries(
  FLAG_REASON_OPTIONS.map((option) => [option.value, option.label])
) as Record<FlagReasonValue, string>

export function getFlagReasonLabel(reason: string) {
  return FLAG_REASON_LABELS[reason as FlagReasonValue] ?? reason.replaceAll('_', ' ')
}
