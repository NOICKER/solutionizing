import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api/middleware'
import { validateBody } from '@/lib/api/validate'
import { ok, notFound, conflict, serverError } from '@/lib/api/response'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { resend } from '@/lib/resend'
import { logApiRouteError } from '@/lib/api/log'
import { Prisma } from '@prisma/client'

const SuspendUserSchema = z.object({
  reason: z.string().min(10),
})

export async function POST(
  request: Request,
  context: { params: { userId: string } }
) {
  try {
    await requireRole('ADMIN')
    const body = await validateBody(request, SuspendUserSchema)

    const user = await prisma.user.findUnique({
      where: { id: context.params.userId },
      include: {
        founderProfile: true,
        testerProfile: true,
      },
    })

    if (!user) {
      return notFound('User')
    }

    if (user.isSuspended) {
      return conflict('User is already suspended')
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isSuspended: true,
        suspendedAt: new Date(),
        suspendReason: body.reason,
      },
      include: {
        founderProfile: true,
        testerProfile: true,
      },
    })

    await supabaseAdmin.auth.admin.signOut(user.id)

    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? '',
      to: user.email,
      subject: 'Your account has been suspended',
      html: `
        <p>Your account has been suspended.</p>
        <p>Reason: ${body.reason}</p>
        <p>If you believe this was a mistake, please contact support.</p>
      `,
    })

    return ok(updatedUser)
  } catch (err) {
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}
