import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const workspaceRoot = path.resolve(__dirname, '..')
const dashboardSource = await readFile(
  path.join(workspaceRoot, 'components/solutionizing/founder/FounderDashboardTab.tsx'),
  'utf8'
)

assert.match(dashboardSource, /type MissionPulseFilter = 'current' \| 'completed'/)
assert.match(dashboardSource, /const \[missionPulseFilter, setMissionPulseFilter\] = useState<MissionPulseFilter>\('current'\)/)
assert.match(dashboardSource, /const currentMissions = useMemo/)
assert.match(dashboardSource, /mission\.status !== 'COMPLETED'/)
assert.match(dashboardSource, /const completedMissions = useMemo/)
assert.match(dashboardSource, /mission\.status === 'COMPLETED'/)
assert.match(dashboardSource, /const visiblePulseMissions = missionPulseFilter === 'completed'\s*\?\s*completedMissions\s*:\s*currentMissions/)
assert.match(dashboardSource, /aria-label="Choose mission pulse list"/)
assert.match(dashboardSource, /Current Missions/)
assert.match(dashboardSource, /Completed Missions/)
assert.match(dashboardSource, /No running missions right now/)
assert.match(dashboardSource, /Start a fresh mission from here/)
assert.match(dashboardSource, /Completed missions stay here for review/)

console.log('Founder dashboard mission pulse source checks passed.')
