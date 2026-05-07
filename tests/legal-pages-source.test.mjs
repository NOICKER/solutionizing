import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const workspaceRoot = path.resolve(__dirname, '..')

const privacySource = await readFile(path.join(workspaceRoot, 'app/privacy/page.tsx'), 'utf8')
const termsSource = await readFile(path.join(workspaceRoot, 'app/terms/page.tsx'), 'utf8')

assert.match(privacySource, /LegalPageLayout/)
assert.match(termsSource, /LegalPageLayout/)

assert.match(privacySource, /mission content/)
assert.match(privacySource, /tester responses/)
assert.match(privacySource, /product URLs/)
assert.match(privacySource, /usage analytics via PostHog/i)
assert.match(privacySource, /Gemini API/)
assert.match(privacySource, /aggregated anonymous benchmarks/)
assert.match(
  privacySource,
  /We use anonymised and aggregated mission outcomes to improve our benchmark scoring models\. No individual mission data is shared with other founders\. Raw responses are never sold\./
)
assert.match(privacySource, /delete your account/)
assert.match(privacySource, /Cookies and PostHog Analytics/)
assert.match(privacySource, /hello@solutionizing\.com/)

assert.match(termsSource, /accurate product information/)
assert.match(termsSource, /illegal content/)
assert.match(termsSource, /honest feedback/)
assert.match(termsSource, /plagiarism/)
assert.match(termsSource, /non-refundable except for unfilled missions/)
assert.match(termsSource, /aggregated anonymised data/)
assert.match(termsSource, /No guarantee of specific outcomes/)
assert.match(termsSource, /Account suspension/)

console.log('Legal page source checks passed.')
