// Keywords that indicate PII collection attempts
const PII_KEYWORDS = [
  'social security', 'ssn', 'credit card', 'card number',
  'bank account', 'routing number', 'passport', 'date of birth',
  'mother maiden', 'pin number', 'cvv', 'security code',
  'home address', 'phone number', 'national id',
]
// Basic profanity list (expand as needed)
const PROFANITY = ['[profanity_list]'] // populate from a library
export interface ContentCheckResult {
  safe: boolean
  reason?: string
}
export function checkContent(text: string): ContentCheckResult {
  const lower = text.toLowerCase()
  for (const keyword of PII_KEYWORDS) {
    if (lower.includes(keyword)) {
      return { safe: false, reason: `Text contains a disallowed keyword: '${keyword}'` }
    }
  }
  for (const word of PROFANITY) {
    if (lower.includes(word)) {
      return { safe: false, reason: 'Text contains prohibited language' }
    }
  }
  return { safe: true }
}
// Check all text fields of a mission submission
export function checkMissionContent(
  title: string, goal: string, questions: { text: string }[]
): ContentCheckResult {
  const checks = [
    checkContent(title),
    checkContent(goal),
    ...questions.map(q => checkContent(q.text)),
  ]
  const failed = checks.find(c => !c.safe)
  return failed ?? { safe: true }
}
