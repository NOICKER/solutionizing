"use client"

import { SpinnerIcon, formatCoins } from '@/components/solutionizing/ui'

const coinPacks = [
  { packId: 'starter', name: 'Starter', coins: 10000, price: 'Rs 90', discount: '10% OFF', popular: false },
  { packId: 'growth', name: 'Growth', coins: 25000, price: 'Rs 200', discount: '20% OFF', popular: true },
  { packId: 'scale', name: 'Scale', coins: 60000, price: 'Rs 420', discount: '30% OFF', popular: false },
] as const

function CoinPackCard({
  pack,
  loadingPackId,
  onPurchase,
}: {
  pack: (typeof coinPacks)[number]
  loadingPackId: string | null
  onPurchase: (packId: string) => void
}) {
  const isLoading = loadingPackId === pack.packId
  const purchaseDisabled = loadingPackId !== null

  return (
    <div
      className={`relative rounded-3xl border bg-white p-6 shadow-[0_20px_50px_-40px_rgba(26,22,37,0.22)] dark:bg-gray-800 ${
        pack.popular ? 'border-[#d77a57]/40' : 'border-[#ece6df]'
      }`}
    >
      {pack.popular ? (
        <div className="absolute right-6 top-6 rounded-full bg-[#d77a57] px-3 py-1 text-[0.65rem] font-black uppercase tracking-[0.18em] text-white">
          Popular
        </div>
      ) : null}

      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#faf5f0] text-lg font-black text-[#d77a57] dark:bg-gray-900">
        C
      </div>

      <div className="mt-6">
        <h3 className="text-xl font-black text-[#1a1625] dark:text-white">{pack.name}</h3>
        <div className="mt-3 text-4xl font-black text-[#1a1625] dark:text-white">{formatCoins(pack.coins)}</div>
        <div className="mt-1 text-sm font-medium text-[#6b687a] dark:text-gray-400">coins</div>
        <div className="mt-4 inline-flex rounded-full border border-[#ece6df] bg-[#faf5f0] px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#6b687a] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
          {pack.discount}
        </div>
        <div className="mt-5 text-3xl font-black text-[#1a1625] dark:text-white">{pack.price}</div>
      </div>

      <button
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-[2rem] bg-[#d77a57] py-3 text-sm font-black text-white transition-colors hover:bg-[#c4673f] disabled:pointer-events-none disabled:opacity-70"
        disabled={purchaseDisabled}
        onClick={() => onPurchase(pack.packId)}
      >
        {isLoading ? <SpinnerIcon className="h-4 w-4" /> : null}
        PURCHASE
      </button>
    </div>
  )
}

interface FounderWalletsTabProps {
  coinBalance: number
  purchaseError: string
  purchaseLoadingPackId: string | null
  onPurchase: (packId: string) => void
}

export function FounderWalletsTab({
  coinBalance,
  purchaseError,
  purchaseLoadingPackId,
  onPurchase,
}: FounderWalletsTabProps) {
  return (
    <section className="rounded-[1.9rem] border border-[#ece6df] bg-white/80 p-4 shadow-[0_24px_60px_-46px_rgba(26,22,37,0.26)] dark:border-gray-700 dark:bg-gray-800/90 sm:p-6">
      <div className="mb-8">
        <div className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-[#9b98a8] dark:text-gray-400">Wallet overview</div>
        <h2 className="mt-2 text-2xl font-black text-[#1a1625] dark:text-white">Wallets & Coins</h2>
        <p className="mt-2 max-w-2xl text-sm text-[#6b687a] dark:text-gray-400">
          Track your available balance and add more coins for upcoming research missions.
        </p>
      </div>

      <div className="mb-6 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="rounded-3xl border border-[#ece6df] bg-[#fffdfa] p-6 dark:border-gray-700 dark:bg-gray-900/70">
          <div className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#9b98a8] dark:text-gray-400">Available balance</div>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <span className="text-4xl font-black text-[#1a1625] dark:text-white">{formatCoins(coinBalance)} coins</span>
            <span className="pb-1 text-sm font-medium text-[#9b98a8] dark:text-gray-400">~ Rs {(coinBalance / 100).toFixed(0)}</span>
          </div>
          <p className="mt-3 max-w-xl text-sm text-[#6b687a] dark:text-gray-400">
            Use your coin balance to launch missions, fill tester slots, and keep studies moving without delays.
          </p>
        </div>

        <div className="rounded-3xl border border-[#ece6df] bg-white p-6 dark:border-gray-700 dark:bg-gray-900/70">
          <div className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#9b98a8] dark:text-gray-400">How it works</div>
          <div className="mt-4 space-y-3 text-sm text-[#6b687a] dark:text-gray-400">
            <p>Choose a pack below to add credits to your founder wallet.</p>
            <p>Coins are used when missions launch and tester slots get funded.</p>
            <p>During beta, purchases are credited instantly after checkout.</p>
          </div>
        </div>
      </div>

      {purchaseError ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40">{purchaseError}</div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {coinPacks.map((pack) => (
          <CoinPackCard key={pack.packId} pack={pack} loadingPackId={purchaseLoadingPackId} onPurchase={onPurchase} />
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-100">
        <strong>Beta notice:</strong> Payment processing coming soon - coins are credited instantly during beta.
      </div>
    </section>
  )
}
