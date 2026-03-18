import { createSupabaseServerClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { prisma } from '@/lib/prisma'
import { enforceRateLimit } from '@/lib/api/rate-limit'
import { validateBody } from '@/lib/api/validate'
import { ok, apiError, serverError } from '@/lib/api/response'
import { z } from 'zod'
import { logApiRouteError } from '@/lib/api/log'
import { Prisma } from '@prisma/client'

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

function getSupabaseAuthErrorStatus(error: unknown) {
  if (!error || typeof error !== 'object' || !('status' in error)) {
    return null
  }

  return typeof error.status === 'number' ? error.status : null
}

function getSupabaseAuthErrorMessage(error: unknown) {
  if (!error || typeof error !== 'object' || !('message' in error)) {
    return ''
  }

  return typeof error.message === 'string' ? error.message.toLowerCase() : ''
}

function isPrismaError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError ||
    error instanceof Prisma.PrismaClientUnknownRequestError ||
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientRustPanicError
  )
}

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

    if (error) {
      const errorStatus = getSupabaseAuthErrorStatus(error)
      const errorMessage = getSupabaseAuthErrorMessage(error)

      if (errorMessage.includes('email not confirmed')) {
        return apiError(
          'Please verify your email first',
          'EMAIL_NOT_VERIFIED',
          403
        )
      }

      if (errorStatus === 400 || errorStatus === 401) {
        return apiError('Invalid email or password', 'INVALID_CREDENTIALS', 401)
      }

      console.error('[login] Supabase signInWithPassword error:', error)
      return serverError()
    }

    if (!data.user) {
      return apiError('Invalid email or password', 'INVALID_CREDENTIALS', 401)
    }

    let dbUser
    try {
      dbUser = await prisma.user.findUnique({
        where: { id: data.user.id },
        include: { founderProfile: true, testerProfile: true },
      })
    } catch (err) {
      console.error('[login] Database error:', err)
      return serverError()
    }

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
      ADMIN: '/dashboard/admin',
    }
    const onboardingCompleted =
      normalizedRole === 'FOUNDER'
        ? Boolean(dbUser.founderProfile?.onboardingCompleted)
        : normalizedRole === 'TESTER'
          ? Boolean(dbUser.testerProfile?.onboardingCompleted)
          : true
    const redirectTo =
      normalizedRole === null
        ? '/select-role'
        : !onboardingCompleted
          ? '/onboarding'
          : (redirectMap[normalizedRole] ?? '/')

    return ok({
      role: normalizedRole,
      redirectTo,
      user: { id: dbUser.id, email: dbUser.email, role: normalizedRole },
    })
  } catch (err) {
    if (err instanceof Response) return err
    if (isPrismaError(err)) {
      console.error('[login] Database error:', err)
      return serverError()
    }
    logApiRouteError(request, err)
    return serverError()
  }
}

