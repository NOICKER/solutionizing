import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const workspaceRoot = path.resolve(__dirname, '..')

async function readSource(relativePath) {
  return readFile(path.join(workspaceRoot, relativePath), 'utf8')
}

const [uiSource, missionsTabSource, dashboardTabSource, apiTypesSource] = await Promise.all([
  readSource('components/solutionizing/ui.tsx'),
  readSource('components/solutionizing/founder/FounderMissionsTab.tsx'),
  readSource('components/solutionizing/founder/FounderDashboardTab.tsx'),
  readSource('types/api.ts'),
])

assert.match(apiTypesSource, /healthScore: number \| null/)

assert.match(uiSource, /MissionHealthScoreBadge/)
assert.match(uiSource, /score == null/)
assert.match(uiSource, /score >= 80/)
assert.match(uiSource, /score >= 50/)
assert.match(uiSource, /Strong Signal/)
assert.match(uiSource, /Mixed Signal/)
assert.match(uiSource, /Weak Signal/)
assert.match(uiSource, /bg-emerald-900\/50 text-emerald-300/)
assert.match(uiSource, /bg-amber-900\/50 text-amber-300/)
assert.match(uiSource, /bg-red-900\/50 text-red-300/)

for (const source of [missionsTabSource, dashboardTabSource]) {
  assert.match(source, /MissionHealthScoreBadge/)
  assert.match(source, /<MissionStatusBadge status=\{mission\.status\} \/>\s*<MissionHealthScoreBadge score=\{mission\.healthScore\} \/>/)
}

console.log('Founder mission health badge source checks passed.')
