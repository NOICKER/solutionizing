export const COIN_PURCHASE_ENV_VAR = 'ALLOW_BETA_INSTANT_COIN_CREDIT'
export const COIN_PURCHASES_UNAVAILABLE_MESSAGE =
  'Coin purchases are temporarily unavailable.'

let hasLoggedMissingCoinPurchaseConfig = false

export function isCoinPurchaseConfigurationMissing() {
  return process.env[COIN_PURCHASE_ENV_VAR] === undefined
}

export function isCoinPurchaseConfigured() {
  return !isCoinPurchaseConfigurationMissing()
}

export function isCoinPurchaseEnabled() {
  return process.env[COIN_PURCHASE_ENV_VAR] === 'true'
}

function warnIfCoinPurchaseConfigurationMissing() {
  if (!isCoinPurchaseConfigurationMissing() || hasLoggedMissingCoinPurchaseConfig) {
    return
  }

  console.warn(
    '[CoinPurchase] Missing deployment configuration. Set ALLOW_BETA_INSTANT_COIN_CREDIT=true to enable beta instant coin credits; purchases will remain unavailable while unset.'
  )
  hasLoggedMissingCoinPurchaseConfig = true
}

// Deployment requirement: every server environment must set this flag explicitly so purchase availability never fails silently.
warnIfCoinPurchaseConfigurationMissing()
