import { notifySessionExpired } from '@/lib/auth/session'

type JsonBody = Record<string, unknown> | unknown[]

type ApiRequestInit = Omit<RequestInit, 'body'> & {
  body?: BodyInit | JsonBody | null
  skipSessionHandling?: boolean
}

type ErrorPayload =
  | {
      error?: string | { code?: string; message?: string; details?: unknown }
      code?: string
      details?: unknown
      message?: string
    }
  | null

function isJsonBody(value: ApiRequestInit['body']): value is JsonBody {
  if (value == null) {
    return false
  }

  if (
    typeof value === 'string' ||
    value instanceof FormData ||
    value instanceof URLSearchParams ||
    value instanceof Blob ||
    value instanceof ArrayBuffer
  ) {
    return false
  }

  return typeof value === 'object'
}

function getNextPath() {
  return `${window.location.pathname}${window.location.search}`
}

function getDefaultMessage(status: number) {
  if (status >= 500) {
    return 'Something went wrong. Try again.'
  }

  if (status === 404) {
    return 'We could not find what you were looking for.'
  }

  if (status === 403) {
    return 'You do not have permission to do that.'
  }

  if (status === 401) {
    return 'Your session expired. Please sign in.'
  }

  return 'Something went wrong. Try again.'
}

function getDefaultCode(status: number) {
  if (status === 401) return 'UNAUTHORIZED'
  if (status === 403) return 'FORBIDDEN'
  if (status === 404) return 'NOT_FOUND'
  if (status >= 500) return 'SERVER_ERROR'
  return 'BAD_REQUEST'
}

export class ApiClientError extends Error {
  status: number
  code: string
  details?: unknown

  constructor(message: string, code: string, status: number, details?: unknown) {
    super(message)
    this.name = 'ApiClientError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export function isApiClientError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError
}

function normalizeApiError(status: number, payload: ErrorPayload) {
  const nestedError =
    payload && typeof payload.error === 'object' && payload.error !== null ? payload.error : null
  const details = nestedError?.details ?? payload?.details
  const detailsCode =
    details && typeof details === 'object' && 'code' in details && typeof details.code === 'string'
      ? details.code
      : undefined

  const code = nestedError?.code ?? payload?.code ?? detailsCode ?? getDefaultCode(status)
  const message =
    nestedError?.message ??
    (typeof payload?.error === 'string' ? payload.error : undefined) ??
    payload?.message ??
    getDefaultMessage(status)

  return new ApiClientError(message, code, status, details)
}

export async function apiFetch<T>(input: string, init: ApiRequestInit = {}) {
  const headers = new Headers(init.headers)
  let body = init.body

  if (isJsonBody(body)) {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(body)
  }

  let response: Response

  try {
    response = await fetch(input, {
      ...init,
      body: body ?? undefined,
      credentials: 'include',
      headers,
    })
  } catch {
    throw new ApiClientError('Check your internet connection', 'NETWORK_ERROR', 0)
  }

  const contentType = response.headers.get('content-type') ?? ''
  const payload = contentType.includes('application/json')
    ? ((await response.json().catch(() => null)) as { data?: T } & ErrorPayload)
    : null

  if (response.status === 401 && !init.skipSessionHandling && typeof window !== 'undefined') {
    notifySessionExpired(getNextPath())
  }

  if (!response.ok) {
    throw normalizeApiError(response.status, payload)
  }

  return payload?.data as T
}
