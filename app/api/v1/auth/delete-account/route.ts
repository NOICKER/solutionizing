export const dynamic = 'force-dynamic'
import { requireAuth } from '@/lib/api/middleware'
import { prisma } from '@/lib/prisma'
import { ok, serverError } from '@/lib/api/response'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { logApiRouteError } from '@/lib/api/log'

export async function DELETE(request: Request) {
  try {
    const authUser = await requireAuth()

    await prisma.$transaction(async (tx) => {
      // Get profile IDs
      const user = await tx.user.findUnique({
        where: { id: authUser.id },
        select: {
          founderProfile: { select: { id: true } },
          testerProfile: { select: { id: true } },
        },
      })

      const founderProfileId = user?.founderProfile?.id
      const testerProfileId = user?.testerProfile?.id

      // ── TESTER CLEANUP ──────────────────────────────────────────
      if (testerProfileId) {
        // TesterRating blocks MissionAssignment deletion
        await tx.testerRating.deleteMany({ where: { testerId: testerProfileId } })
        // MissionAssignment blocks TesterProfile deletion (cascades MissionResponse + MissionFlag)
        await tx.missionAssignment.deleteMany({ where: { testerId: testerProfileId } })
      }

      // ── FOUNDER CLEANUP ─────────────────────────────────────────
      if (founderProfileId) {
        const missions = await tx.mission.findMany({
          where: { founderId: founderProfileId },
          select: { id: true },
        })
        const missionIds = missions.map((m) => m.id)

        if (missionIds.length > 0) {
          const assignments = await tx.missionAssignment.findMany({
            where: { missionId: { in: missionIds } },
            select: { id: true },
          })
          const assignmentIds = assignments.map((a) => a.id)

          if (assignmentIds.length > 0) {
            // TesterRating blocks MissionAssignment deletion
            await tx.testerRating.deleteMany({ where: { assignmentId: { in: assignmentIds } } })
          }

          // MissionAssignment blocks Mission deletion (cascades MissionResponse + MissionFlag)
          await tx.missionAssignment.deleteMany({ where: { missionId: { in: missionIds } } })
          // MissionQuestion blocks Mission deletion (cascades MissionResponse)
          await tx.missionQuestion.deleteMany({ where: { missionId: { in: missionIds } } })
          // MissionAsset blocks Mission deletion
          await tx.missionAsset.deleteMany({ where: { missionId: { in: missionIds } } })
        }

        // TesterRating.founderId blocks FounderProfile deletion
        await tx.testerRating.deleteMany({ where: { founderId: founderProfileId } })
        // Payment blocks FounderProfile deletion
        await tx.payment.deleteMany({ where: { founderId: founderProfileId } })
        // Mission blocks FounderProfile deletion
        await tx.mission.deleteMany({ where: { founderId: founderProfileId } })
      }

      // ── SHARED CLEANUP ──────────────────────────────────────────
      // CoinTransaction blocks User deletion
      await tx.coinTransaction.deleteMany({ where: { userId: authUser.id } })
      // Feedback references userId (optional but clean up anyway)
      await tx.feedback.deleteMany({ where: { userId: authUser.id } })

      // Finally delete User — cascades FounderProfile, TesterProfile, MissionFlags, TesterRatingEvents
      await tx.user.delete({ where: { id: authUser.id } })
    })

    // Permanently delete from Supabase Auth
    await supabaseAdmin.auth.admin.deleteUser(authUser.id)

    return ok({ message: 'Account deleted successfully' })
  } catch (err) {
    if (err instanceof Response) return err
    logApiRouteError(request, err)
    return serverError()
  }
}