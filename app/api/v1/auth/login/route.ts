import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { validateBody } from '@/lib/api/validate'
import { ok, unauthorized, apiError, serverError } from '@/lib/api/response'
import { z } from 'zod'

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(request: Request) {
  try {
    const body = await validateBody(request, LoginSchema)
    const supabase = createSupabaseServerClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    })

    if (error || !data.user) {
      return apiError('Invalid email or password', 'INVALID_CREDENTIALS', 401)
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: data.user.id },
      include: { founderProfile: true, testerProfile: true },
    })

    if (!dbUser) return unauthorized()

    if (!dbUser.emailVerified) {
      return apiError(
        'Please verify your email first',
        'EMAIL_NOT_VERIFIED',
        403
      )
    }

    if (dbUser.isSuspended) {
      return apiError('Account suspended', 'ACCOUNT_SUSPENDED', 403)
    }

    const normalizedRole =
      dbUser.role === 'ADMIN'
        ? 'ADMIN'
        : dbUser.founderProfile
          ? 'FOUNDER'
          : dbUser.testerProfile
            ? 'TESTER'
            : null

    const redirectMap: Record<string, string> = {
      FOUNDER: '/dashboard/founder',
      TESTER: '/dashboard/tester',
      ADMIN: '/',
    }
    const redirectTo =
      normalizedRole === null ? '/select-role' : (redirectMap[normalizedRole] ?? '/')

    return ok({
      role: normalizedRole,
      redirectTo,
      user: { id: dbUser.id, email: dbUser.email, role: normalizedRole },
    })
  } catch (err) {
    if (err instanceof Response) return err
    console.error('[login]', err)
    return serverError()
  }
}
