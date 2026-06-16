"use client"

import { AlertTriangle, CheckCircle2, LifeBuoy, RotateCcw, Wallet } from 'lucide-react'
import { SpinnerIcon, formatCoins, primaryButtonClass } from '@/components/solutionizing/ui'

const coinPacks = [
  { packId: 'starter', name: 'Starter', coins: 14900, priceLabel: '₹149', discount: '10% OFF', popular: false },
  { packId: 'growth', name: 'Growth', coins: 34900, priceLabel: '₹349', discount: '20% OFF', popular: true },
  { packId: 'scale', name: 'Scale', coins: 79900, priceLabel: '₹799', discount: '30% OFF', popular: false },
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
      style={{ background: 'var(--bg-light)', border: pack.popular ? '1px solid var(--electric)' : '1px solid var(--border)', borderRadius: '12px', padding: '1.2rem 1.4rem', position: 'relative' }}
    >
      {pack.popular ? (
        <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'var(--electric)', color: 'var(--cream)', borderRadius: '100px', padding: '0.2rem 0.6rem', fontSize: '0.6rem', fontFamily: 'DM Mono, monospace', letterSpacing: '0.1em' }}>
          Most Recommended
        </div>
      ) : null}

      <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.65rem', letterSpacing: '0.1em', color: 'var(--ink-soft)', marginBottom: '1rem' }}>
        {pack.popular ? 'Mid Tier' : pack.packId === 'starter' ? 'Entry Tier' : 'Alpha Tier'}
      </div>

      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
        <span className="text-2xl font-[family-name:var(--font-fraunces)] italic font-normal ">C</span>
      </div>

      <div className="mt-6">
        <h3 style={{ fontFamily: 'Satoshi, sans-serif', fontSize: '1.2rem', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>{pack.name}</h3>
        <div className="mt-3 flex items-baseline gap-2">
          <span style={{ fontFamily: 'Satoshi, sans-serif', fontSize: '1.8rem', fontWeight: 700, color: 'var(--ink)' }}>{formatCoins(pack.coins)}</span>
          <span className="text-sm font-bold uppercase tracking-wider ">COINS</span>
        </div>
        <div className="mt-5 space-y-2 text-sm ">
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

      <button className="cursor-none"
        style={pack.popular ? { background: 'var(--electric)', color: 'var(--cream)', border: 'none', borderRadius: '100px', padding: '0.55rem 1.2rem', fontFamily: 'Satoshi, sans-serif', fontWeight: 700, fontSize: '0.82rem', cursor: 'none', width: '100%', marginTop: '2rem' } : { background: 'transparent', border: '1px solid var(--border-strong)', color: 'var(--ink)', borderRadius: '100px', padding: '0.5rem 1.1rem', fontFamily: 'Satoshi, sans-serif', fontWeight: 600, fontSize: '0.82rem', cursor: 'none', width: '100%', marginTop: '2rem' }}
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
    <div style={{ background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.5rem 2rem' }}>
      <div
        className={`inline-flex h-16 w-16 items-center justify-center rounded-3xl ${
          isSuccess ? 'bg-emerald-900/40 text-emerald-300' : 'bg-red-900/40 text-red-300'
        }`}
      >
        {isSuccess ? <CheckCircle2 className="h-8 w-8" /> : <AlertTriangle className="h-8 w-8" />}
      </div>

      <div className="mt-6 max-w-2xl">
        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.68rem', color: 'var(--ink-soft)', letterSpacing: '0.12em' }}>{isSuccess ? 'PURCHASE COMPLETE' : 'PURCHASE FAILED'}</div>
        <h2 style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: '1.3rem', color: 'var(--ink)', fontWeight: 400 }}>{isSuccess ? 'coins credited to wallet.' : 'checkout did not complete.'}</h2>
        <p className="mt-3 text-sm leading-6 ">{purchaseResult.message}</p>
      </div>

      {isSuccess ? (
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div style={{ background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.2rem 1.4rem' }}>
            <div className="text-xs font-bold uppercase tracking-[0.16em] ">Pack</div>
            <div className="mt-2 text-xl font-bold ">{purchaseResult.packName}</div>
          </div>
          <div style={{ background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.2rem 1.4rem' }}>
            <div className="text-xs font-bold uppercase tracking-[0.16em] ">Coins added</div>
            <div className="mt-2 text-xl font-bold ">{formatCoins(purchaseResult.coinsAdded)} coins</div>
          </div>
          <div style={{ background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.2rem 1.4rem' }}>
            <div className="text-xs font-bold uppercase tracking-[0.16em] ">New balance</div>
            <div className="mt-2 text-xl font-bold ">{formatCoins(purchaseResult.newBalance)} coins</div>
          </div>
        </div>
      ) : (
        <div style={{ background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.2rem 1.4rem' }}>
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
            <button className="cursor-none" type="button" style={{ background: 'var(--electric)', color: 'var(--cream)', border: 'none', borderRadius: '100px', padding: '0.55rem 1.2rem', fontFamily: 'Satoshi, sans-serif', fontWeight: 700, fontSize: '0.82rem', cursor: 'none' }} onClick={onGoToMissions}>
              USE COINS IN MISSIONS
            </button>
            <button className="cursor-none"
              type="button"
              style={{ background: 'transparent', border: '1px solid var(--border-strong)', color: 'var(--ink)', borderRadius: '100px', padding: '0.5rem 1.1rem', fontFamily: 'Satoshi, sans-serif', fontWeight: 600, fontSize: '0.82rem', cursor: 'none', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              onClick={onReset}
            >
              BUY ANOTHER PACK
            </button>
          </>
        ) : (
          <>
            <button className="cursor-none"
              type="button"
              style={{ background: 'var(--electric)', color: 'var(--cream)', border: 'none', borderRadius: '100px', padding: '0.55rem 1.2rem', fontFamily: 'Satoshi, sans-serif', fontWeight: 700, fontSize: '0.82rem', cursor: 'none' }}
              disabled={loadingPackId !== null}
              onClick={() => onRetry(purchaseResult.packId)}
            >
              {loadingPackId === purchaseResult.packId ? <SpinnerIcon className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
              RETRY PURCHASE
            </button>
            <a className="cursor-none"
              href="mailto:hello@solutionizing.com?subject=Coin%20purchase%20support"
              style={{ background: 'transparent', border: '1px solid var(--border-strong)', color: 'var(--ink)', borderRadius: '100px', padding: '0.5rem 1.1rem', fontFamily: 'Satoshi, sans-serif', fontWeight: 600, fontSize: '0.82rem', cursor: 'none', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <LifeBuoy className="h-4 w-4" />
              CONTACT SUPPORT
            </a>
            <button className="cursor-none"
              type="button"
              style={{ background: 'transparent', border: '1px solid var(--border-strong)', color: 'var(--ink)', borderRadius: '100px', padding: '0.5rem 1.1rem', fontFamily: 'Satoshi, sans-serif', fontWeight: 600, fontSize: '0.82rem', cursor: 'none', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              onClick={onReset}
            >
              BACK TO PACKS
            </button>
          </>
        )}
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
      <div className="animate-[tabEnter_0.22s_ease_forwards]">
        <PurchaseOutcomePanel
          purchaseResult={purchaseResult}
          loadingPackId={purchaseLoadingPackId}
          onRetry={onPurchase}
          onReset={onResetPurchaseResult}
          onGoToMissions={onGoToMissions}
        />
      </div>
    )
  }

  return (
    <section className="animate-[tabEnter_0.22s_ease_forwards]" style={{ background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.5rem 2rem' }}>
      <div className="mb-8">
        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.68rem', color: 'var(--ink-soft)', letterSpacing: '0.12em' }}>ARCHITECTURAL CAPITAL</div>
        <h2 style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: '1.3rem', color: 'var(--ink)', fontWeight: 400 }}>available balance.</h2>
        <p className="mt-2 max-w-2xl text-sm ">
          Track your available balance and add more coins for upcoming research missions.
        </p>
      </div>

      <div className="mb-6 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div style={{ background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.2rem 1.4rem' }}>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 ">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[0.7rem] font-bold uppercase tracking-[0.2em] ">Available balance</div>
              <div className="mt-1 flex flex-wrap items-end gap-3">
                <span style={{ fontFamily: 'Satoshi, sans-serif', fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)' }}>{formatCoins(coinBalance)} COINS</span>
                <span className="pb-1 text-sm font-medium ">~ ₹{(coinBalance / 100).toFixed(0)} Value</span>
              </div>
            </div>
          </div>
          <p className="mt-4 max-w-xl text-sm ">
            Use your coin balance to launch missions, fill tester slots, and keep studies moving without delays.
          </p>
        </div>

        <div style={{ background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.2rem 1.4rem' }}>
          <h3 style={{ fontFamily: 'Satoshi, sans-serif', fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>Instant Power Refresh</h3>
          <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: '0.88rem', color: 'var(--ink-soft)', margin: '0.2rem 0 0 0' }}>Auto-refill triggered at 5,000 coins.</p>
          <button className="cursor-none" style={{ background: 'var(--electric)', color: 'var(--cream)', border: 'none', borderRadius: '100px', padding: '0.55rem 1.2rem', fontFamily: 'Satoshi, sans-serif', fontWeight: 700, fontSize: '0.82rem', cursor: 'none' }}>
            MANAGE AUTO-PAY
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold ">Acquire More Power</h3>
            <p className="text-sm ">Scale your architectural precision with high-density coin bundles.</p>
          </div>
          <div className="flex rounded-xl border border-border-subtle overflow-hidden">
            <button className="px-4 py-1.5 text-xs font-bold bg-primary/10  cursor-none">ONE-TIME</button>
            <button className="px-4 py-1.5 text-xs font-bold  hover:text-text-main cursor-none">MONTHLY</button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {coinPacks.map((pack) => (
          <CoinPackCard key={pack.packId} pack={pack} loadingPackId={purchaseLoadingPackId} onPurchase={onPurchase} />
        ))}
      </div>
    </section>
  )
}
