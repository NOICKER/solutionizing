import { requireAuth } from '@/lib/api/middleware'
import { prisma } from '@/lib/prisma'
import { validateBody } from '@/lib/api/validate'
import { ok, conflict, serverError } from '@/lib/api/response'
import { z } from 'zod'

const SelectRoleSchema = z.object({
  role: z.enum(['FOUNDER', 'TESTER']),
  displayName: z.string().min(2).max(50),
})

export async function POST(request: Request) {
  try {
    const authUser = await requireAuth()
    const body = await validateBody(request, SelectRoleSchema)

    const existingUser = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: { founderProfile: true, testerProfile: true },
    })

    if (existingUser?.founderProfile || existingUser?.testerProfile) {
      return conflict('Role already set')
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: authUser.id },
        data: { role: body.role },
      })

      if (body.role === 'FOUNDER') {
        await tx.founderProfile.create({
          data: {
            userId: authUser.id,
            displayName: body.displayName,
          },
        })
      } else {
        await tx.testerProfile.create({
          data: {
            userId: authUser.id,
            displayName: body.displayName,
          },
        })
      }
    })

    return ok({ role: body.role, displayName: body.displayName })
  } catch (err) {
    if (err instanceof Response) return err
    console.error('[select-role]', err)
    return serverError()
  }
}
