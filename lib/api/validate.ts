import { ZodSchema } from 'zod'
import { badRequest } from '@/lib/api/response'
export async function validateBody<T>(request: Request, schema: ZodSchema<T>): Promise<T> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    throw badRequest('Invalid JSON body')
  }
  const result = schema.safeParse(body)
  if (!result.success) {
    throw badRequest('Validation failed', result.error.flatten())
  }
  return result.data
}
