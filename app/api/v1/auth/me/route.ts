import { requireAuth } from '@/lib/api/middleware'
import { prisma } from '@/lib/prisma'
import { ok, notFound, serverError } from '@/lib/api/response'

export async function GET(request: Request) {
  try {
    const authUser = await requireAuth()

    const dbUser = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: { founderProfile: true, testerProfile: true },
    })

    if (!dbUser) return notFound('User')

    return ok({ user: dbUser })
  } catch (err) {
    if (err instanceof Response) return err
    console.error('[me]', err)
    return serverError()
  }
}
