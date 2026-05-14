import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const workspaceRoot = path.resolve(__dirname, '..')

async function readSource(relativePath) {
  return readFile(path.join(workspaceRoot, relativePath), 'utf8')
}

const [insightsSource, lifecycleSource] = await Promise.all([
  readSource('components/solutionizing/MissionInsightsPage.tsx'),
  readSource('components/solutionizing/MissionLifecycleTracker.tsx'),
])

assert.match(insightsSource, /bg-background/)
assert.match(insightsSource, /border-border-subtle/)
assert.match(insightsSource, /bg-surface/)
assert.match(insightsSource, /bg-surface-elevated/)
assert.match(insightsSource, /text-text-muted/)
assert.match(insightsSource, /shadow-\[0_24px_80px_-56px_rgba\(0,0,0,0\.9\)\]/)
assert.match(insightsSource, /from-primary to-primary-hover/)
assert.match(insightsSource, /Mission report/)
assert.doesNotMatch(insightsSource, /Decorative background blobs/)
assert.doesNotMatch(insightsSource, /bg-gradient-to-br from-\[#faf9f7\]/)
assert.doesNotMatch(insightsSource, /border border-white\/60 bg-white\/70/)

assert.match(lifecycleSource, /border-border-subtle bg-surface/)
assert.match(lifecycleSource, /bg-surface-elevated/)
assert.match(lifecycleSource, /text-white/)
assert.match(lifecycleSource, /text-text-muted/)
assert.doesNotMatch(lifecycleSource, /bg-white\/85/)
assert.doesNotMatch(lifecycleSource, /border-\[#ece6df\]/)

console.log('Mission insights obsidian theme source checks passed.')
