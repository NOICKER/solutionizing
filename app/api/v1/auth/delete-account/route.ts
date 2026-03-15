import { requireAuth } from '@/lib/api/middleware'
import { prisma } from '@/lib/prisma'
import { ok, serverError } from '@/lib/api/response'

export async function DELETE(request: Request) {
  try {
    const authUser = await requireAuth()

    await prisma.user.update({
      where: { id: authUser.id },
      data: { 
        isDeleted: true,
        deletedAt: new Date() 
      },
    })

    return ok({ message: 'Account deleted successfully' })
  } catch (err) {
    if (err instanceof Response) return err
    console.error('[delete-account]', err)
    return serverError()
  }
}
