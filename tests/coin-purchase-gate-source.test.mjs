import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const workspaceRoot = path.resolve(__dirname, '..')

async function readSource(relativePath) {
  return readFile(path.join(workspaceRoot, relativePath), 'utf8')
}

const [routeSource, dashboardSource, configSource] = await Promise.all([
  readSource('app/api/v1/coins/purchase/route.ts'),
  readSource('components/solutionizing/FounderDashboardPage.tsx'),
  readSource('lib/business/coin-purchase-config.ts').catch(() => ''),
])

assert.match(configSource, /COIN_PURCHASE_ENV_VAR\s*=\s*'ALLOW_BETA_INSTANT_COIN_CREDIT'/)
assert.match(configSource, /isCoinPurchaseEnabled/)
assert.match(configSource, /isCoinPurchaseConfigured/)
assert.match(configSource, /process\.env\[COIN_PURCHASE_ENV_VAR\] === undefined/)
assert.match(configSource, /console\.warn/)
assert.match(configSource, /Set ALLOW_BETA_INSTANT_COIN_CREDIT=true/)
assert.match(configSource, /deployment/i)

assert.match(routeSource, /isCoinPurchaseEnabled/)
assert.doesNotMatch(routeSource, /process\.env\.ALLOW_BETA_INSTANT_COIN_CREDIT/)
assert.match(routeSource, /COIN_PURCHASES_UNAVAILABLE_MESSAGE/)
assert.match(routeSource, /PAYMENTS_UNAVAILABLE/)
assert.match(routeSource, /503/)
assert.match(routeSource, /deployment requirement/i)

assert.doesNotMatch(dashboardSource, /This branch is still using the beta purchase gateway\./)
assert.match(dashboardSource, /error\.code === 'PAYMENTS_UNAVAILABLE'[\s\S]*\? error\.message/)

console.log('Coin purchase gate source checks passed.')
