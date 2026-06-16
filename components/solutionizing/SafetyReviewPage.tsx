"use client"

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch, isApiClientError } from '@/lib/api/client'
import { ApiMissionDetail } from '@/types/api'
import { MissionStatusBadge, NotFoundPanel } from '@/components/solutionizing/ui'

function SafetyReviewPageSkeleton() {
  const skeletonBar = 'animate-pulse rounded-full bg-[var(--cream)]'
  const skeletonBlock = 'animate-pulse rounded-[1.25rem] bg-[var(--cream)]'

  return (
    <div className="min-h-screen bg-[var(--bg)] p-8">
      <div className="rounded-[16px] border border-[var(--border)] bg-[var(--cream)] p-6 sm:p-8 w-full max-w-lg mx-auto">
        <div className={`mb-8 h-5 w-40 ${skeletonBar}`} />
        <div className="mb-8 flex justify-center">
          <div className={`h-20 w-20 rounded-full ${skeletonBlock}`} />
        </div>
        <div className="space-y-4 text-center">
          <div className={`mx-auto h-10 w-56 ${skeletonBar}`} />
          <div className={`mx-auto h-5 w-72 ${skeletonBar}`} />
        </div>
        <div className={`mt-8 h-40 ${skeletonBlock}`} />
        <div className={`mt-6 h-24 ${skeletonBlock}`} />
        <div className="mt-8 space-y-3">
          <div className={`h-14 rounded-[2rem] ${skeletonBlock}`} />
          <div className={`mx-auto h-5 w-36 ${skeletonBar}`} />
        </div>
      </div>
    </div>
  )
}

export function SafetyReviewPage({ missionId }: { missionId: string }) {
  const router = useRouter()
  const [mission, setMission] = useState<ApiMissionDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isNotFound, setIsNotFound] = useState(false)

  useEffect(() => {
    async function loadMission() {
      try {
        const response = await apiFetch<ApiMissionDetail>(`/api/v1/missions/${missionId}`)

        if (response.status !== 'REJECTED') {
          router.replace('/dashboard/founder')
          return
        }

        setMission(response)
      } catch (error) {
        if (isApiClientError(error) && error.status === 404) {
          setIsNotFound(true)
        } else {
          router.replace('/dashboard/founder')
        }
      } finally {
        setIsLoading(false)
      }
    }

    void loadMission()
  }, [missionId, router])

  if (isLoading) {
    return <SafetyReviewPageSkeleton />
  }

  if (isNotFound || !mission) {
    return <NotFoundPanel backHref="/dashboard/founder" />
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] p-8">
      <div className="rounded-[16px] border border-[var(--border)] bg-[var(--cream)] p-6 sm:p-8 w-full max-w-lg mx-auto">
        <Link href="/dashboard/founder" className="mb-8 inline-block font-['Satoshi'] font-semibold text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)] cursor-none">
          ← Back to dashboard
        </Link>

        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[rgba(192,57,43,0.1)] text-[#c0392b]">
            <svg className="w-10 h-10 text-current" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>

        <div className="mb-4 flex justify-center">
          <MissionStatusBadge status={mission.status} />
        </div>
        <h1 className="mb-2 text-center font-[family-name:var(--font-fraunces)] italic font-normal text-[var(--ink)] text-2xl">Mission Rejected</h1>
        <p className="mb-8 text-center text-lg font-['Satoshi'] text-[var(--ink-soft)]">{mission.title}</p>

        <div className="mb-8 rounded-[12px] border border-[rgba(192,57,43,0.2)] bg-[rgba(192,57,43,0.05)] p-8">
          <h2 className="mb-3 text-lg font-['Satoshi'] font-bold text-[#c0392b]">Feedback from our team</h2>
          <p className="text-sm font-['Satoshi'] font-medium text-[#c0392b]/80">Rejection reason: {mission.rejectionReason ?? mission.reviewNote ?? 'Your mission needs updates before it can be reviewed again.'}</p>
        </div>

        <div className="mb-8 rounded-[12px] border border-[var(--electric)]/20 bg-[var(--electric)]/5 p-6">
          <h3 className="mb-2 text-sm font-['Satoshi'] font-bold text-[var(--electric)]">What to do next</h3>
          <p className="text-sm font-['Satoshi'] text-[var(--electric)]/80">
            Review the feedback above, edit your mission to fix the issues, then resubmit for review.
          </p>
        </div>

        <div className="space-y-3">
          <Link href={`/mission/wizard?edit=true&missionId=${mission.id}`} className="block text-center bg-[var(--electric)] text-[var(--cream)] rounded-xl px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90 cursor-none w-full">
            EDIT MISSION →
          </Link>
          <div className="text-center">
            <Link href="/dashboard/founder" className="inline-block w-full border border-[var(--border-strong)] text-[var(--ink-soft)] rounded-xl px-6 py-3 text-sm font-semibold bg-transparent hover:border-[var(--electric)] hover:text-[var(--electric)] cursor-none">
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
