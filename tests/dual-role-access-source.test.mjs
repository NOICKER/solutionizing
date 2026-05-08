import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const workspaceRoot = path.resolve(__dirname, '..')

async function readSource(relativePath) {
  return readFile(path.join(workspaceRoot, relativePath), 'utf8')
}

const [
  currentUserSource,
  authContextSource,
  requireAuthSource,
  middlewareSource,
  selectRoleRouteSource,
  founderDashboardRouteSource,
  testerDashboardRouteSource,
  dashboardRedirectSource,
  founderDashboardSource,
  testerWorkspaceSource,
] = await Promise.all([
  readSource('lib/auth/current-user.ts'),
  readSource('context/AuthContext.tsx'),
  readSource('components/RequireAuth.tsx'),
  readSource('lib/api/middleware.ts'),
  readSource('app/api/v1/auth/select-role/route.ts'),
  readSource('app/dashboard/founder/page.tsx'),
  readSource('app/dashboard/tester/page.tsx'),
  readSource('app/dashboard/page.tsx'),
  readSource('components/solutionizing/FounderDashboardPage.tsx'),
  readSource('components/solutionizing/TesterWorkspacePage.tsx'),
])

assert.match(currentUserSource, /export type DashboardRole = 'FOUNDER' \| 'TESTER'/)
assert.match(currentUserSource, /roles: DashboardRole\[\]/)
assert.match(currentUserSource, /export function hasRole/)
assert.match(currentUserSource, /export function hasCompletedOnboardingForRole/)
assert.match(currentUserSource, /founderProfile\s*\?\s*\['FOUNDER'\]/)
assert.match(currentUserSource, /testerProfile\s*\?\s*\['TESTER'\]/)

assert.match(authContextSource, /roles: DashboardRole\[\]/)
assert.match(authContextSource, /export function hasRole/)
assert.doesNotMatch(authContextSource, /testerProfile: null/)
assert.doesNotMatch(authContextSource, /founderProfile: null/)

assert.match(requireAuthSource, /hasRole\(user, role\)/)

assert.match(middlewareSource, /include:\s*\{\s*founderProfile: true,\s*testerProfile: true,\s*\}/)
assert.match(middlewareSource, /role === 'FOUNDER' && !dbUser\.founderProfile/)
assert.match(middlewareSource, /role === 'TESTER' && !dbUser\.testerProfile/)
assert.doesNotMatch(middlewareSource, /dbUser\.role !== role && dbUser\.role !== 'ADMIN'/)

assert.match(selectRoleRouteSource, /const existingProfile = body\.role === 'FOUNDER'/)
assert.match(selectRoleRouteSource, /if \(existingProfile\)/)
assert.doesNotMatch(selectRoleRouteSource, /existingUser\?\.founderProfile \|\| existingUser\?\.testerProfile/)

assert.match(founderDashboardRouteSource, /hasRole\(user, 'FOUNDER'\)/)
assert.doesNotMatch(founderDashboardRouteSource, /user\.role === 'TESTER'/)
assert.match(testerDashboardRouteSource, /hasRole\(user, 'TESTER'\)/)
assert.doesNotMatch(testerDashboardRouteSource, /user\.role === 'FOUNDER'/)
assert.match(dashboardRedirectSource, /getPreferredDashboardPath\(user\)/)

assert.match(founderDashboardSource, /Switch to Tester/)
assert.match(founderDashboardSource, /router\.push\('\/dashboard\/tester'\)/)
assert.match(founderDashboardSource, /\/api\/v1\/auth\/select-role/)

assert.match(testerWorkspaceSource, /hasRole\(user, 'TESTER'\)/)
assert.doesNotMatch(testerWorkspaceSource, /user\.role === 'FOUNDER'/)

console.log('Dual role access source checks passed.')
