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

assert.match(dashboardSource, /import \{ format \} from 'date-fns'/)
assert.match(dashboardSource, /function ProductJourneySection/)
assert.match(dashboardSource, /Product Journey/)
assert.match(dashboardSource, /\$\{journeyMissions\.length\} missions run · Started \$\{formatMissionDate\(journeyMissions\[0\]\.createdAt\)\}/)
assert.match(dashboardSource, /getMissionStartTimestamp\(leftMission\) - getMissionStartTimestamp\(rightMission\)/)
assert.match(dashboardSource, /journeyMissions\.map\(\(mission, index\) =>/)
assert.match(dashboardSource, /<MissionHealthScoreBadge score=\{mission\.healthScore\} \/>/)
assert.match(dashboardSource, /<MissionStatusBadge status=\{mission\.status\} \/>/)
assert.match(dashboardSource, /mission\.parentMissionId/)
assert.match(dashboardSource, /Retest/)
assert.match(dashboardSource, /border-l/)
assert.match(dashboardSource, /<ProductJourneySection missions=\{missions\} \/>/)

console.log('Founder dashboard product journey source checks passed.')
