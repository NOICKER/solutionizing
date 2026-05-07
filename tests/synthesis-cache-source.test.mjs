import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const workspaceRoot = path.resolve(__dirname, '..')
const routePath = path.join(
  workspaceRoot,
  'app/api/v1/missions/[missionId]/synthesize/route.ts'
)

const routeSource = await readFile(routePath, 'utf8')

assert.doesNotMatch(routeSource, /new Map<|new Map\(/)
assert.doesNotMatch(routeSource, /synthesisCache/)
assert.match(routeSource, /getCachedJson/)
assert.match(routeSource, /setCachedJson/)
assert.match(routeSource, /SYNTHESIS_CACHE_TTL_SECONDS\s*=\s*60\s*\*\s*60/)
assert.match(routeSource, /`synthesis:\$\{missionId\}`/)
assert.match(routeSource, /NODE_ENV !== 'production'/)
assert.match(routeSource, /cache HIT/)
assert.match(routeSource, /cache MISS/)
assert.match(routeSource, /serverless/i)
assert.match(routeSource, /const BASE = \{ HIGH: 85, MEDIUM: 60, LOW: 35 \}/)
assert.match(routeSource, /Math\.max\(0, Math\.min\(100,/)
assert.match(routeSource, /BASE\[synthesis\.signalStrength\] - \(synthesis\.frictionPoints\.length \* 7\)/)
assert.match(routeSource, /prisma\.mission\.update\(/)
assert.match(routeSource, /where: \{ id: mission\.id \}/)
assert.match(routeSource, /data: \{ healthScore: score \}/)

console.log('Synthesis cache source checks passed.')
