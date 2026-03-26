import 'server-only'
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'
import {
  getInitialPayoutDetails,
  parsePayoutDetails,
  serializePayoutDetails,
  type PayoutDetails,
} from '@/lib/payout-details'

const PAYOUT_DETAILS_PREFIX = 'enc:v1'

function getPayoutEncryptionKey() {
  const configuredSecret =
    process.env.PAYOUT_DETAILS_ENCRYPTION_KEY ??
    (process.env.NODE_ENV !== 'production'
      ? 'solutionizing-local-payout-encryption-key'
      : null)

  if (!configuredSecret) {
    throw new Error('PAYOUT_DETAILS_ENCRYPTION_KEY is not configured')
  }

  return createHash('sha256').update(configuredSecret).digest()
}

function encryptValue(plainText: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', getPayoutEncryptionKey(), iv)
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return `${PAYOUT_DETAILS_PREFIX}:${iv.toString('base64')}:${encrypted.toString('base64')}:${authTag.toString('base64')}`
}

function decryptValue(raw: string) {
  if (!raw.startsWith(`${PAYOUT_DETAILS_PREFIX}:`)) {
    return raw
  }

  const [, ivBase64, encryptedBase64, authTagBase64] = raw.split(':')

  if (!ivBase64 || !encryptedBase64 || !authTagBase64) {
    return raw
  }

  const decipher = createDecipheriv(
    'aes-256-gcm',
    getPayoutEncryptionKey(),
    Buffer.from(ivBase64, 'base64')
  )
  decipher.setAuthTag(Buffer.from(authTagBase64, 'base64'))

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedBase64, 'base64')),
    decipher.final(),
  ]).toString('utf8')
}

export function serializePayoutDetailsForStorage(details: PayoutDetails) {
  return encryptValue(serializePayoutDetails(details))
}

export function parseStoredPayoutDetails(raw: string | null | undefined) {
  if (!raw) {
    return null
  }

  try {
    const decrypted = decryptValue(raw)
    return parsePayoutDetails(decrypted) ?? getInitialPayoutDetails(decrypted)
  } catch {
    return parsePayoutDetails(raw) ?? getInitialPayoutDetails(raw)
  }
}

export function getStoredPayoutDetailsForClient(raw: string | null | undefined) {
  const parsed = parseStoredPayoutDetails(raw)

  if (!parsed) {
    return null
  }

  return serializePayoutDetails(parsed)
}
