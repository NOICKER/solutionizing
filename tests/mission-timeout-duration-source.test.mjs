import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const workspaceRoot = path.resolve(__dirname, '..')

const readSource = (relativePath) => readFile(path.join(workspaceRoot, relativePath), 'utf8')

const [
  schemaSource,
  createMissionRoute,
  updateMissionRoute,
  wizardSource,
  assignmentSource,
] = await Promise.all([
  readSource('prisma/schema.prisma'),
  readSource('app/api/v1/missions/route.ts'),
  readSource('app/api/v1/missions/[missionId]/route.ts'),
  readSource('components/solutionizing/MissionWizardPage.tsx'),
  readSource('lib/business/assignment.ts'),
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

assert.match(schemaSource, /timeoutDuration\s+Int\s+@default\(168\)/)
assert.match(migrationText, /ADD COLUMN\s+"timeoutDuration"\s+INTEGER\s+NOT NULL\s+DEFAULT 168/i)

assert.match(createMissionRoute, /const TimeoutDurationSchema = z\.number\(\)\.int\(\)\.refine/)
assert.match(createMissionRoute, /VALID_TIMEOUT_DURATIONS/)
assert.match(createMissionRoute, /timeoutDuration:\s*TimeoutDurationSchema\.default\(168\)/)
assert.match(createMissionRoute, /timeoutDuration:\s*body\.timeoutDuration/)
assert.match(updateMissionRoute, /const TimeoutDurationSchema = z\.number\(\)\.int\(\)\.refine/)
assert.match(updateMissionRoute, /VALID_TIMEOUT_DURATIONS/)
assert.match(updateMissionRoute, /timeoutDuration:\s*TimeoutDurationSchema\.optional\(\)/)
assert.match(updateMissionRoute, /timeoutDuration:\s*effectiveTimeoutDuration/)

assert.match(wizardSource, /timeoutDuration:\s*168/)
assert.match(wizardSource, /Tester Deadline/)
assert.match(wizardSource, /24 hours/)
assert.match(wizardSource, /3 days/)
assert.match(wizardSource, /7 days/)
assert.match(wizardSource, /14 days/)
assert.match(wizardSource, /timeoutDuration:\s*preparedState\.timeoutDuration/)
assert.match(wizardSource, /timeoutDuration:\s*mission\.timeoutDuration/)

assert.doesNotMatch(assignmentSource, /addHours\(now,\s*24\)/)
assert.match(assignmentSource, /timeoutDuration:\s*true/)
assert.match(assignmentSource, /timeoutAt:\s*addHours\(assignedAt,\s*latestMission\.timeoutDuration\)/)

console.log('Mission timeout duration source checks passed.')
