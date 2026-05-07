import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const workspaceRoot = path.resolve(__dirname, '..')

async function readSource(relativePath) {
  return readFile(path.join(workspaceRoot, relativePath), 'utf8')
}

function getPackPrices(coinsSource) {
  const entries = [...coinsSource.matchAll(/\{ id: '([^']+)', coins: \d+, priceRupees: (\d+),/g)]
  return Object.fromEntries(entries.map(([, id, priceRupees]) => [id, Number(priceRupees)]))
}

async function main() {
  const [landingPageSource, coinsSource, walletTabSource] = await Promise.all([
    readSource('app/page.tsx'),
    readSource('lib/business/coins.ts'),
    readSource('components/solutionizing/founder/FounderWalletsTab.tsx'),
  ])
  const prices = getPackPrices(coinsSource)

  assert.equal(prices.starter, 149)
  assert.equal(prices.growth, 349)
  assert.equal(prices.scale, 799)

  assert.match(landingPageSource, new RegExp(`price: "₹${prices.starter}"`))
  assert.match(landingPageSource, new RegExp(`price: "₹${prices.growth}"`))
  assert.match(landingPageSource, /price: "₹0"/)
  assert.doesNotMatch(landingPageSource, /price: "\$\d+"/)

  assert.match(walletTabSource, /priceLabel: '₹149'/)
  assert.match(walletTabSource, /priceLabel: '₹349'/)
  assert.match(walletTabSource, /priceLabel: '₹799'/)
  assert.doesNotMatch(walletTabSource, /priceLabel: 'Rs\.? ?\d+'/)

  console.log('Pricing copy checks passed.')
}

await main()
