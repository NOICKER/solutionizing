"use client"

import { AlertTriangle, CheckCircle2, LifeBuoy, RotateCcw, Wallet } from 'lucide-react'
import { SpinnerIcon, formatCoins, primaryButtonClass } from '@/components/solutionizing/ui'

const coinPacks = [
  { packId: 'starter', name: 'Starter', coins: 14900, priceLabel: 'Rs 149', discount: '10% OFF', popular: false },
  { packId: 'growth', name: 'Growth', coins: 34900, priceLabel: 'Rs 349', discount: '20% OFF', popular: true },
  { packId: 'scale', name: 'Scale', coins: 79900, priceLabel: 'Rs 799', discount: '30% OFF', popular: false },
] as const

type CoinPack = (typeof coinPacks)[number]
type CoinPackId = CoinPack['packId']

export type PurchaseFlowState =
  | {
      status: 'success'
      packId: CoinPackId
      packName: string
      coinsAdded: number
      newBalance: number
      message: string
    }
  | {
      status: 'failure'
      packId: CoinPackId
      packName: string
      message: string
    }
  | null

function CoinPackCard({
  pack,
  loadingPackId,
  onPurchase,
}: {
  pack: CoinPack
  loadingPackId: string | null
  onPurchase: (packId: CoinPackId) => void
}) {
  const isLoading = loadingPackId === pack.packId
  const purchaseDisabled = loadingPackId !== null

  return (
    <div
      className={`relative rounded-card border bg-white p-6 shadow-[0_20px_50px_-40px_rgba(26,22,37,0.22)] dark:bg-gray-800 ${
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
        <div className="mt-5 text-3xl font-black text-[#1a1625] dark:text-white">{pack.priceLabel}</div>
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

function PurchaseOutcomePanel({
  purchaseResult,
  loadingPackId,
  onRetry,
  onReset,
  onGoToMissions,
}: {
  purchaseResult: Exclude<PurchaseFlowState, null>
  loadingPackId: string | null
  onRetry: (packId: CoinPackId) => void
  onReset: () => void
  onGoToMissions: () => void
}) {
  const isSuccess = purchaseResult.status === 'success'

  return (
    <div className="rounded-panel border border-[#ece6df] bg-white/90 p-6 shadow-[0_24px_60px_-46px_rgba(26,22,37,0.26)] dark:border-gray-700 dark:bg-gray-800/90 sm:p-8">
      <div
        className={`inline-flex h-16 w-16 items-center justify-center rounded-3xl ${
          isSuccess ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300'
        }`}
      >
        {isSuccess ? <CheckCircle2 className="h-8 w-8" /> : <AlertTriangle className="h-8 w-8" />}
      </div>

      <div className="mt-6 max-w-2xl">
        <div className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-[#9b98a8] dark:text-gray-400">
          {isSuccess ? 'Purchase complete' : 'Purchase failed'}
        </div>
        <h2 className="mt-2 text-3xl font-black text-[#1a1625] dark:text-white">
          {isSuccess ? 'Coins are now in your wallet' : 'Checkout did not complete'}
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#6b687a] dark:text-gray-400">{purchaseResult.message}</p>
      </div>

      {isSuccess ? (
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-card border border-[#ece6df] bg-[#fffdfa] p-5 dark:border-gray-700 dark:bg-gray-900/70">
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#9b98a8] dark:text-gray-400">Pack</div>
            <div className="mt-2 text-xl font-black text-[#1a1625] dark:text-white">{purchaseResult.packName}</div>
          </div>
          <div className="rounded-card border border-[#ece6df] bg-[#fffdfa] p-5 dark:border-gray-700 dark:bg-gray-900/70">
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#9b98a8] dark:text-gray-400">Coins added</div>
            <div className="mt-2 text-xl font-black text-[#1a1625] dark:text-white">{formatCoins(purchaseResult.coinsAdded)} coins</div>
          </div>
          <div className="rounded-card border border-[#ece6df] bg-[#fffdfa] p-5 dark:border-gray-700 dark:bg-gray-900/70">
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#9b98a8] dark:text-gray-400">New balance</div>
            <div className="mt-2 text-xl font-black text-[#1a1625] dark:text-white">{formatCoins(purchaseResult.newBalance)} coins</div>
          </div>
        </div>
      ) : (
        <div className="mt-8 rounded-card border border-red-200 bg-red-50 p-5 dark:border-red-900/60 dark:bg-red-950/30">
          <div className="flex items-start gap-3">
            <LifeBuoy className="mt-0.5 h-5 w-5 text-red-600 dark:text-red-300" />
            <div>
              <p className="text-sm font-bold text-red-800 dark:text-red-100">Need help?</p>
              <p className="mt-1 text-sm text-red-700 dark:text-red-200">
                Retry the same pack, or contact support if the problem persists. Include the pack name and the time of the failed attempt so we can trace it quickly.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        {isSuccess ? (
          <>
            <button type="button" className={`px-5 py-3 text-sm ${primaryButtonClass}`} onClick={onGoToMissions}>
              USE COINS IN MISSIONS
            </button>
            <button
              type="button"
              className="rounded-[2rem] border border-[#ece6df] px-5 py-3 text-sm font-bold text-[#6b687a] transition-colors hover:bg-[#f6f1ec] hover:text-[#1a1625] dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
              onClick={onReset}
            >
              BUY ANOTHER PACK
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className={`flex items-center gap-2 px-5 py-3 text-sm ${primaryButtonClass}`}
              disabled={loadingPackId !== null}
              onClick={() => onRetry(purchaseResult.packId)}
            >
              {loadingPackId === purchaseResult.packId ? <SpinnerIcon className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
              RETRY PURCHASE
            </button>
            <a
              href="mailto:hello@solutionizing.com?subject=Coin%20purchase%20support"
              className="inline-flex items-center gap-2 rounded-[2rem] border border-[#ece6df] px-5 py-3 text-sm font-bold text-[#6b687a] transition-colors hover:bg-[#f6f1ec] hover:text-[#1a1625] dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
            >
              <LifeBuoy className="h-4 w-4" />
              CONTACT SUPPORT
            </a>
            <button
              type="button"
              className="rounded-[2rem] border border-[#ece6df] px-5 py-3 text-sm font-bold text-[#6b687a] transition-colors hover:bg-[#f6f1ec] hover:text-[#1a1625] dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
              onClick={onReset}
            >
              BACK TO PACKS
            </button>
          </>
        )}
      </div>

      <div className="mt-8 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-100">
        <strong>Audit note:</strong> This environment still uses the beta instant-credit purchase path. A verified Razorpay order flow and payment verification step still need to be wired before this can be treated as production checkout.
      </div>
    </div>
  )
}

interface FounderWalletsTabProps {
  coinBalance: number
  purchaseLoadingPackId: string | null
  purchaseResult: PurchaseFlowState
  onPurchase: (packId: CoinPackId) => void
  onResetPurchaseResult: () => void
  onGoToMissions: () => void
}

export function FounderWalletsTab({
  coinBalance,
  purchaseLoadingPackId,
  purchaseResult,
  onPurchase,
  onResetPurchaseResult,
  onGoToMissions,
}: FounderWalletsTabProps) {
  if (purchaseResult) {
    return (
      <PurchaseOutcomePanel
        purchaseResult={purchaseResult}
        loadingPackId={purchaseLoadingPackId}
        onRetry={onPurchase}
        onReset={onResetPurchaseResult}
        onGoToMissions={onGoToMissions}
      />
    )
  }

  return (
    <section className="rounded-panel border border-[#ece6df] bg-white/80 p-4 shadow-[0_24px_60px_-46px_rgba(26,22,37,0.26)] dark:border-gray-700 dark:bg-gray-800/90 sm:p-6">
      <div className="mb-8">
        <div className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-[#9b98a8] dark:text-gray-400">Wallet overview</div>
        <h2 className="mt-2 text-2xl font-black text-[#1a1625] dark:text-white">Wallets & Coins</h2>
        <p className="mt-2 max-w-2xl text-sm text-[#6b687a] dark:text-gray-400">
          Track your available balance and add more coins for upcoming research missions.
        </p>
      </div>

      <div className="mb-6 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="rounded-card border border-[#ece6df] bg-[#fffdfa] p-6 dark:border-gray-700 dark:bg-gray-900/70">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#faf5f0] text-[#d77a57] dark:bg-gray-800">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#9b98a8] dark:text-gray-400">Available balance</div>
              <div className="mt-1 flex flex-wrap items-end gap-3">
                <span className="text-4xl font-black text-[#1a1625] dark:text-white">{formatCoins(coinBalance)} coins</span>
                <span className="pb-1 text-sm font-medium text-[#9b98a8] dark:text-gray-400">~ Rs {(coinBalance / 100).toFixed(0)}</span>
              </div>
            </div>
          </div>
          <p className="mt-4 max-w-xl text-sm text-[#6b687a] dark:text-gray-400">
            Use your coin balance to launch missions, fill tester slots, and keep studies moving without delays.
          </p>
        </div>

        <div className="rounded-card border border-[#ece6df] bg-white p-6 dark:border-gray-700 dark:bg-gray-900/70">
          <div className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#9b98a8] dark:text-gray-400">How it works today</div>
          <div className="mt-4 space-y-3 text-sm text-[#6b687a] dark:text-gray-400">
            <p>Choose a pack below to add credits to your founder wallet.</p>
            <p>Coins are available immediately after a successful beta purchase response.</p>
            <p>This environment does not yet run a verified Razorpay checkout flow, so payment availability depends on feature flags.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {coinPacks.map((pack) => (
          <CoinPackCard key={pack.packId} pack={pack} loadingPackId={purchaseLoadingPackId} onPurchase={onPurchase} />
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-100">
        <strong>Beta notice:</strong> Real Razorpay checkout is not wired in this environment yet. If a purchase fails, you will now land on a dedicated retry-and-support state instead of only seeing a transient banner.
      </div>
    </section>
  )
}
