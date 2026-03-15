import { createSupabaseServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { prisma } from '@/lib/prisma'
import { enforceRateLimit } from '@/lib/api/rate-limit'
import { validateBody } from '@/lib/api/validate'
import { ok, apiError, serverError } from '@/lib/api/response'
import { z } from 'zod'

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(request: Request) {
  try {
    const rateLimitResponse = await enforceRateLimit(request, 'auth-login')

    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const body = await validateBody(request, LoginSchema)
    const supabase = createSupabaseServerClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    })

    if (error || !data.user) {
      return apiError('Invalid email or password', 'INVALID_CREDENTIALS', 401)
    }

    let dbUser = await prisma.user.findUnique({
      where: { id: data.user.id },
      include: { founderProfile: true, testerProfile: true },
    })

    // Self-heal: If user exists in Supabase but not in Prisma, create them locally.
    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          id: data.user.id,
          email: data.user.email!,
          emailVerified: !!data.user.email_confirmed_at,
        },
        include: { founderProfile: true, testerProfile: true },
      })
    }

    // Sync emailVerified status if verified in Supabase
    if (!dbUser.emailVerified && data.user.email_confirmed_at) {
      dbUser = await prisma.user.update({
        where: { id: dbUser.id },
        data: { emailVerified: true },
        include: { founderProfile: true, testerProfile: true },
      })
    }

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
    
    if (dbUser.isDeleted) {
      return apiError('Account deleted. Please contact support to reactivate.', 'ACCOUNT_DELETED', 403)
    }

    const normalizedRole =
      dbUser.role === 'ADMIN'
        ? 'ADMIN'
        : dbUser.founderProfile
          ? 'FOUNDER'
          : dbUser.testerProfile
            ? 'TESTER'
            : null

    // Sync role to app_metadata on login
    await supabaseAdmin.auth.admin.updateUserById(data.user.id, {
      app_metadata: { role: normalizedRole },
    })

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
