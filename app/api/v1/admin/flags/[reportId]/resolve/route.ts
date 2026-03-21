import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/api/middleware'
import { validateBody } from '@/lib/api/validate'
import { ok, notFound, serverError } from '@/lib/api/response'
import { logApiRouteError } from '@/lib/api/log'

const ResolveMissionReportSchema = z.object({
  status: z.enum(['RESOLVED', 'DISMISSED']),
  note: z.string().trim().max(500).optional(),
})

export async function POST(
  request: Request,
  context: { params: { reportId: string } }
) {
  try {
    await requireRole('ADMIN')
    const body = await validateBody(request, ResolveMissionReportSchema)

    const existingReport = await prisma.missionReport.findUnique({
      where: { id: context.params.reportId },
      select: { id: true },
    })

    if (!existingReport) {
      return notFound('Mission report')
    }

    const updatedReport = await prisma.missionReport.update({
      where: { id: existingReport.id },
      data: {
        status: body.status,
        note: body.note?.trim() ? body.note.trim() : null,
      },
    })

    return ok(updatedReport)
  } catch (err) {
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}
