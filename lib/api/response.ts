import { NextResponse } from 'next/server'
export function ok<T>(data: T, meta?: object) {
  return NextResponse.json({ data, meta: meta ?? null }, { status: 200 })
}
export function created<T>(data: T) {
  return NextResponse.json({ data, meta: null }, { status: 201 })
}
export function apiError(message: string, code: string, status: number, details?: object) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details: details ?? null,
      },
    },
    { status }
  )
}
export const unauthorized = () => apiError('Unauthorized', 'UNAUTHORIZED', 401)
export const forbidden    = () => apiError('Forbidden', 'FORBIDDEN', 403)
export const notFound     = (r='Resource') => apiError(`${r} not found`, 'NOT_FOUND', 404)
export const badRequest   = (msg: string, details?: object) => apiError(msg, 'BAD_REQUEST', 400, details)
export const conflict     = (msg: string) => apiError(msg, 'CONFLICT', 409)
export const serverError  = () => apiError('Internal server error', 'SERVER_ERROR', 500)
