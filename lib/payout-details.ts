export type PayoutMethod = 'UPI' | 'BANK_TRANSFER'

export interface UpiPayoutDetails {
  method: 'UPI'
  upiId: string
}

export interface BankTransferPayoutDetails {
  method: 'BANK_TRANSFER'
  accountHolderName: string
  accountNumber: string
  ifscCode: string
}

export type PayoutDetails = UpiPayoutDetails | BankTransferPayoutDetails

export type PayoutField =
  | 'upiId'
  | 'accountHolderName'
  | 'accountNumber'
  | 'ifscCode'

export type PayoutFieldErrors = Partial<Record<PayoutField, string>>

export const UPI_ID_PATTERN = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/
export const ACCOUNT_NUMBER_PATTERN = /^\d{9,18}$/
export const IFSC_CODE_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizePayoutDetails(details: PayoutDetails): PayoutDetails {
  if (details.method === 'UPI') {
    return {
      method: 'UPI',
      upiId: details.upiId.trim(),
    }
  }

  return {
    method: 'BANK_TRANSFER',
    accountHolderName: details.accountHolderName.trim(),
    accountNumber: details.accountNumber.trim(),
    ifscCode: details.ifscCode.trim().toUpperCase(),
  }
}

export function validatePayoutDetails(details: PayoutDetails): PayoutFieldErrors {
  const normalized = normalizePayoutDetails(details)

  if (normalized.method === 'UPI') {
    if (!normalized.upiId) {
      return { upiId: 'UPI ID is required.' }
    }

    if (!UPI_ID_PATTERN.test(normalized.upiId)) {
      return { upiId: 'Enter a valid UPI ID.' }
    }

    return {}
  }

  const errors: PayoutFieldErrors = {}

  if (normalized.accountHolderName.length < 2) {
    errors.accountHolderName = 'Account holder name must be at least 2 characters.'
  }

  if (!ACCOUNT_NUMBER_PATTERN.test(normalized.accountNumber)) {
    errors.accountNumber = 'Account number must be 9 to 18 digits.'
  }

  if (!IFSC_CODE_PATTERN.test(normalized.ifscCode)) {
    errors.ifscCode = 'Enter a valid IFSC code.'
  }

  return errors
}

export function hasPayoutFieldErrors(errors: PayoutFieldErrors) {
  return Object.values(errors).some(Boolean)
}

export function parsePayoutDetails(raw: string | null | undefined): PayoutDetails | null {
  if (!raw?.trim()) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as unknown

    if (!isRecord(parsed) || typeof parsed.method !== 'string') {
      return null
    }

    if (parsed.method === 'UPI' && typeof parsed.upiId === 'string') {
      return normalizePayoutDetails({
        method: 'UPI',
        upiId: parsed.upiId,
      })
    }

    if (
      parsed.method === 'BANK_TRANSFER' &&
      typeof parsed.accountHolderName === 'string' &&
      typeof parsed.accountNumber === 'string' &&
      typeof parsed.ifscCode === 'string'
    ) {
      return normalizePayoutDetails({
        method: 'BANK_TRANSFER',
        accountHolderName: parsed.accountHolderName,
        accountNumber: parsed.accountNumber,
        ifscCode: parsed.ifscCode,
      })
    }
  } catch {
    return null
  }

  return null
}

export function serializePayoutDetails(details: PayoutDetails) {
  return JSON.stringify(normalizePayoutDetails(details))
}

export function getInitialPayoutDetails(raw: string | null | undefined): PayoutDetails {
  const parsed = parsePayoutDetails(raw)

  if (parsed) {
    return parsed
  }

  return {
    method: 'UPI',
    upiId: raw?.trim() ?? '',
  }
}
