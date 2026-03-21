import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api/middleware'
import { ok, notFound, conflict, serverError } from '@/lib/api/response'
import { resend } from '@/lib/resend'
import { logApiRouteError } from '@/lib/api/log'

export async function POST(
  request: Request,
  context: { params: { userId: string } }
) {
  try {
    await requireRole('ADMIN')

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

    if (!user.isSuspended) {
      return conflict('User is not suspended')
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isSuspended: false,
        suspendedAt: null,
        suspendReason: null,
      },
      include: {
        founderProfile: true,
        testerProfile: true,
      },
    })

    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? '',
      to: user.email,
      subject: 'Your Solutionizing account has been reactivated',
      html: `
        <p>Your Solutionizing account has been reactivated.</p>
        <p>Your account is now active again.</p>
      `,
    })

    return ok(updatedUser)
  } catch (err) {
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}
