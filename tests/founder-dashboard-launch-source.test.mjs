import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const workspaceRoot = path.resolve(__dirname, '..')

const dashboardTabSource = await readFile(
  path.join(workspaceRoot, 'components/solutionizing/founder/FounderDashboardTab.tsx'),
  'utf8'
)
const dashboardPageSource = await readFile(
  path.join(workspaceRoot, 'components/solutionizing/FounderDashboardPage.tsx'),
  'utf8'
)

assert.match(dashboardTabSource, /onLaunchMission:\s*\(mission:\s*ApiMission\)\s*=>\s*void/)
assert.match(dashboardTabSource, /isLaunching:\s*boolean/)
assert.match(dashboardTabSource, /mission\.status === 'APPROVED'/)
assert.match(dashboardTabSource, /Launch Mission/)
assert.match(dashboardTabSource, /VIEW\s*\{'->'\}/)
assert.match(dashboardTabSource, /onLaunchMission\(mission\)/)
assert.match(dashboardTabSource, /disabled=\{isLaunching\}/)
assert.match(dashboardTabSource, /SpinnerIcon/)
assert.match(dashboardTabSource, /getDashboardMissionHref\(mission\)/)

assert.match(dashboardPageSource, /onLaunchMission=\{\(mission\) => void handleMissionAction\(mission, 'launch'\)\}/)
assert.match(dashboardPageSource, /actionLoading=\{actionLoading\}/)

console.log('Founder dashboard launch source checks passed.')
