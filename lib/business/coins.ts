import { Difficulty } from '@prisma/client'

export const COINS_PER_RUPEE = 100

export const COIN_RATE: Record<Difficulty, number> = {
  EASY: 2000,
  MEDIUM: 2200,
  HARD: 2400,
}

export const PLATFORM_FEE_PCT = 0.20

export function computeMissionCoinCost(
  difficulty: Difficulty,
  testersRequired: number
): { coinPerTester: number; coinPlatformFee: number; coinCostTotal: number } {
  const coinPerTester = COIN_RATE[difficulty]
  const testerTotal = coinPerTester * testersRequired
  const coinPlatformFee = Math.ceil(testerTotal * PLATFORM_FEE_PCT)
  const coinCostTotal = testerTotal + coinPlatformFee

  return { coinPerTester, coinPlatformFee, coinCostTotal }
}

export function coinsToRupees(coins: number): number {
  return coins / COINS_PER_RUPEE
}

export function rupeesToCoins(rupees: number): number {
  return Math.ceil(rupees * COINS_PER_RUPEE)
}

export const COIN_PACKS = [
  { id: 'starter', coins: 14900, priceRupees: 149, discountPercent: 10, label: 'Starter' },
  { id: 'growth', coins: 34900, priceRupees: 349, discountPercent: 20, label: 'Growth' },
  { id: 'scale', coins: 79900, priceRupees: 799, discountPercent: 30, label: 'Scale' },
] as const

export const MIN_WITHDRAWAL_COINS = 5000
