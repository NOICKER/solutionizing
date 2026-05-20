import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const workspaceRoot = path.resolve(__dirname, '..')

const readSource = (relativePath) => readFile(path.join(workspaceRoot, relativePath), 'utf8')

const [
  schemaSource,
  typesSource,
  testerPageSource,
  testerTabSource,
  statsRouteSource,
  assignmentsRouteSource,
  dashboardDataSource,
  reputationSource,
  timeoutProcessorSource,
  submitRouteSource,
] = await Promise.all([
  readSource('prisma/schema.prisma'),
  readSource('types/api.ts'),
  readSource('components/solutionizing/TesterDashboardPage.tsx'),
  readSource('components/solutionizing/tester/TesterMissionsTab.tsx'),
  readSource('app/api/v1/tester/stats/route.ts'),
  readSource('app/api/v1/tester/assignments/route.ts'),
  readSource('lib/dashboard-initial-data.ts'),
  readSource('lib/business/reputation.ts'),
  readSource('lib/queue/processors/timeout.ts'),
  readSource('app/api/v1/tester/assignments/[assignmentId]/submit/route.ts'),
])

const migrationDirs = await readdir(path.join(workspaceRoot, 'prisma/migrations'), {
  withFileTypes: true,
})
const migrationSources = await Promise.all(
  migrationDirs
    .filter((entry) => entry.isDirectory())
    .map((entry) => readSource(`prisma/migrations/${entry.name}/migration.sql`).catch(() => ''))
)
const migrationText = migrationSources.join('\n')

assert.match(schemaSource, /model TesterRatingEvent/)
assert.match(schemaSource, /@@map\("tester_rating_events"\)/)
assert.match(migrationText, /CREATE TABLE "tester_rating_events"/)

assert.match(reputationSource, /testerRatingEvent\.create/)
assert.match(reputationSource, /delta:\s*actualDelta/)
assert.match(timeoutProcessorSource, /updateReputation\(assignment\.testerId,\s*'TIMEOUT',\s*\{\s*missionId:\s*assignment\.missionId\s*\}\)/)
assert.match(submitRouteSource, /updateReputation\(tester\.testerProfile\.id,\s*'COMPLETION',\s*\{\s*missionId:\s*result\.missionId\s*\}\)/)

assert.match(typesSource, /interface ApiTesterRatingEvent/)
assert.match(typesSource, /ratingEvents:\s*ApiTesterRatingEvent\[\]/)
assert.match(typesSource, /missedMissionCount:\s*number/)
assert.match(statsRouteSource, /testerRatingEvent\.findMany/)
assert.match(statsRouteSource, /take:\s*3/)
assert.match(statsRouteSource, /totalTimedOut/)
assert.match(statsRouteSource, /missedMissionCount/)
assert.match(dashboardDataSource, /testerRatingEvent\.findMany/)
assert.match(dashboardDataSource, /take:\s*3/)
assert.match(dashboardDataSource, /totalTimedOut/)
assert.match(dashboardDataSource, /missedMissionCount/)

assert.match(testerPageSource, /status=ASSIGNED&status=IN_PROGRESS&status=TIMED_OUT/)

assert.match(testerTabSource, /Missions expire if not completed within the \{"founder's"\} set deadline/)
assert.match(testerTabSource, /Missing a deadline reduces your score and consistency rating/)
assert.match(testerTabSource, /Lower ratings mean fewer mission assignments/)
assert.match(testerTabSource, /Missed Missions/)
assert.match(testerTabSource, /Your rating dropped due to this missed mission\./)
assert.match(testerTabSource, /No missions available right now\. This could be because your current mission is pending, or no new missions match your profile yet\. Check back soon\./)
assert.match(testerTabSource, /You have \$\{missedMissionCount\} missed missions affecting your score/)
assert.match(testerTabSource, /ratingEvents/)
assert.match(testerTabSource, /formatSignedDelta\(event\.delta\)/)
assert.match(testerTabSource, /formatRatingEventReason\(event\.reason, missionName\)/)

console.log('Tester timeout and rating event source checks passed.')
