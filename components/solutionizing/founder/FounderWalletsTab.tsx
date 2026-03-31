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
      className={`relative rounded-card border bg-surface p-6 transition-all hover:border-primary/40 ${
        pack.popular ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border-subtle'
      }`}
    >
      {pack.popular ? (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#F97C5A] to-[#E45D43] px-4 py-1 text-[0.65rem] font-black uppercase tracking-[0.18em] text-white shadow-[0_4px_12px_rgba(249,124,90,0.4)]">
          Most Recommended
        </div>
      ) : null}

      <div className="mb-3 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-text-muted">
        {pack.popular ? 'Mid Tier' : pack.packId === 'starter' ? 'Entry Tier' : 'Alpha Tier'}
      </div>

      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
        <span className="text-2xl font-black text-primary">C</span>
      </div>

      <div className="mt-6">
        <h3 className="text-2xl font-black text-white">{pack.name}</h3>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-4xl font-black text-primary">{formatCoins(pack.coins)}</span>
          <span className="text-sm font-bold uppercase tracking-wider text-text-muted">COINS</span>
        </div>
        <div className="mt-5 space-y-2 text-sm text-text-muted">
          {pack.packId === 'starter' && (
            <>
              <p>✓ Standard Mission Capacity</p>
              <p>✓ Basic Architecture Tools</p>
              <p className="opacity-50">✗ Priority Support</p>
            </>
          )}
          {pack.packId === 'growth' && (
            <>
              <p>✓ Expanded Mission Logic</p>
              <p>✓ Advanced Neural Clusters</p>
              <p>✓ Priority Node Access</p>
            </>
          )}
          {pack.packId === 'scale' && (
            <>
              <p>✓ Unlimited Mission Architect</p>
              <p>✓ Global Deployment Cluster</p>
              <p>✓ Dedicated Concierge</p>
            </>
          )}
        </div>
      </div>

      <button
        className={`mt-8 flex w-full items-center justify-center gap-2 rounded-[2rem] py-3 text-sm font-black transition-all disabled:pointer-events-none disabled:opacity-70 ${
          pack.popular
            ? 'bg-gradient-to-r from-[#F97C5A] to-[#E45D43] text-white hover:shadow-[0_8px_24px_rgba(249,124,90,0.4)] hover:scale-[1.02]'
            : 'border border-border-subtle text-text-main hover:border-primary/50 hover:text-primary'
        }`}
        disabled={purchaseDisabled}
        onClick={() => onPurchase(pack.packId)}
      >
        {isLoading ? <SpinnerIcon className="h-4 w-4" /> : null}
        Buy for {pack.priceLabel}
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
    <div className="rounded-panel border border-border-subtle bg-surface p-6 sm:p-8">
      <div
        className={`inline-flex h-16 w-16 items-center justify-center rounded-3xl ${
          isSuccess ? 'bg-emerald-900/40 text-emerald-300' : 'bg-red-900/40 text-red-300'
        }`}
      >
        {isSuccess ? <CheckCircle2 className="h-8 w-8" /> : <AlertTriangle className="h-8 w-8" />}
      </div>

      <div className="mt-6 max-w-2xl">
        <div className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-text-muted">
          {isSuccess ? 'Purchase complete' : 'Purchase failed'}
        </div>
        <h2 className="mt-2 text-3xl font-black text-white">
          {isSuccess ? 'Coins credited to wallet' : 'Checkout did not complete'}
        </h2>
        <p className="mt-3 text-sm leading-6 text-text-muted">{purchaseResult.message}</p>
      </div>

      {isSuccess ? (
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-card border border-border-subtle bg-surface-elevated p-5">
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-text-muted">Pack</div>
            <div className="mt-2 text-xl font-black text-white">{purchaseResult.packName}</div>
          </div>
          <div className="rounded-card border border-border-subtle bg-surface-elevated p-5">
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-text-muted">Coins added</div>
            <div className="mt-2 text-xl font-black text-white">{formatCoins(purchaseResult.coinsAdded)} coins</div>
          </div>
          <div className="rounded-card border border-border-subtle bg-surface-elevated p-5">
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-text-muted">New balance</div>
            <div className="mt-2 text-xl font-black text-white">{formatCoins(purchaseResult.newBalance)} coins</div>
          </div>
        </div>
      ) : (
        <div className="mt-8 rounded-card border border-red-900/60 bg-red-950/30 p-5">
          <div className="flex items-start gap-3">
            <LifeBuoy className="mt-0.5 h-5 w-5 text-red-300" />
            <div>
              <p className="text-sm font-bold text-red-200">Need help?</p>
              <p className="mt-1 text-sm text-red-300">
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
              className="rounded-[2rem] border border-border-subtle px-5 py-3 text-sm font-bold text-text-muted transition-colors hover:bg-surface-elevated hover:text-text-main"
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
              className="inline-flex items-center gap-2 rounded-[2rem] border border-border-subtle px-5 py-3 text-sm font-bold text-text-muted transition-colors hover:bg-surface-elevated hover:text-text-main"
            >
              <LifeBuoy className="h-4 w-4" />
              CONTACT SUPPORT
            </a>
            <button
              type="button"
              className="rounded-[2rem] border border-border-subtle px-5 py-3 text-sm font-bold text-text-muted transition-colors hover:bg-surface-elevated hover:text-text-main"
              onClick={onReset}
            >
              BACK TO PACKS
            </button>
          </>
        )}
      </div>

      <div className="mt-8 rounded-2xl border border-amber-900/50 bg-amber-950/30 p-4 text-sm text-amber-300">
        <strong>Audit note:</strong> This environment still uses the beta instant-credit purchase path. A verified Razorpay order flow and payment verification step still need to be wired before production.
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
    <section className="rounded-panel border border-border-subtle bg-surface p-4 sm:p-6">
      <div className="mb-8">
        <div className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-text-muted">Architectural Capital</div>
        <h2 className="mt-2 text-2xl font-black text-white">Available Balance</h2>
        <p className="mt-2 max-w-2xl text-sm text-text-muted">
          Track your available balance and add more coins for upcoming research missions.
        </p>
      </div>

      <div className="mb-6 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="rounded-card border border-border-subtle bg-surface-elevated p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-text-muted">Available balance</div>
              <div className="mt-1 flex flex-wrap items-end gap-3">
                <span className="text-4xl font-black text-white">{formatCoins(coinBalance)} COINS</span>
                <span className="pb-1 text-sm font-medium text-text-muted">~ ₹{(coinBalance / 100).toFixed(0)} Value</span>
              </div>
            </div>
          </div>
          <p className="mt-4 max-w-xl text-sm text-text-muted">
            Use your coin balance to launch missions, fill tester slots, and keep studies moving without delays.
          </p>
        </div>

        <div className="rounded-card border border-primary/30 bg-gradient-to-br from-primary/20 to-primary/5 p-6">
          <h3 className="text-xl font-black text-white">Instant Power Refresh</h3>
          <p className="mt-2 text-sm text-text-muted">Auto-refill triggered at 5,000 coins.</p>
          <button className="mt-6 w-full rounded-[2rem] bg-gradient-to-r from-[#F97C5A] to-[#E45D43] py-2.5 text-sm font-black text-white hover:shadow-[0_8px_24px_rgba(249,124,90,0.35)] transition-all">
            MANAGE AUTO-PAY
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-white">Acquire More Power</h3>
            <p className="text-sm text-text-muted">Scale your architectural precision with high-density coin bundles.</p>
          </div>
          <div className="flex rounded-xl border border-border-subtle overflow-hidden">
            <button className="px-4 py-1.5 text-xs font-bold bg-primary/10 text-primary">ONE-TIME</button>
            <button className="px-4 py-1.5 text-xs font-bold text-text-muted hover:text-text-main">MONTHLY</button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {coinPacks.map((pack) => (
          <CoinPackCard key={pack.packId} pack={pack} loadingPackId={purchaseLoadingPackId} onPurchase={onPurchase} />
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-amber-900/50 bg-amber-950/30 p-4 text-sm text-amber-300">
        <strong>Beta notice:</strong> Real Razorpay checkout is not wired in this environment yet. If a purchase fails, you will now land on a dedicated retry-and-support state instead of only seeing a transient banner.
      </div>
    </section>
  )
}
