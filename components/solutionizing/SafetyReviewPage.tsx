"use client"

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch, isApiClientError } from '@/lib/api/client'
import { ApiMissionDetail } from '@/types/api'
import { NotFoundPanel, primaryButtonClass } from '@/components/solutionizing/ui'

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
    return (
      <div className="min-h-screen bg-[#faf9f7] p-8">
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="h-6 w-40 animate-pulse rounded bg-[#e5e4e0]" />
          <div className="h-64 animate-pulse rounded-3xl bg-white" />
        </div>
      </div>
    )
  }

  if (isNotFound || !mission) {
    return <NotFoundPanel backHref="/dashboard/founder" />
  }

  return (
    <div className="min-h-screen bg-[#faf9f7] p-8">
      <div className="mx-auto max-w-2xl rounded-panel bg-[#faf9f7] p-12">
        <Link href="/dashboard/founder" className="mb-8 inline-block font-semibold text-[#6b687a] transition-colors hover:text-[#1a1625]">
          ← Back to dashboard
        </Link>

        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>

        <h1 className="mb-2 text-center text-3xl font-black text-[#1a1625]">Mission Rejected</h1>
        <p className="mb-8 text-center text-lg text-[#6b687a]">{mission.title}</p>

        <div className="mb-8 rounded-card border border-red-200 bg-red-50 p-8">
          <h2 className="mb-3 text-lg font-black text-red-900">Feedback from our team</h2>
          <p className="text-sm leading-relaxed text-red-800">{mission.reviewNote ?? 'Your mission needs updates before it can be reviewed again.'}</p>
        </div>

        <div className="mb-8 rounded-card border border-blue-200 bg-blue-50 p-6">
          <h3 className="mb-2 text-sm font-bold text-blue-900">What to do next</h3>
          <p className="text-sm text-blue-700">
            Review the feedback above, edit your mission to fix the issues, then resubmit for review.
          </p>
        </div>

        <div className="space-y-3">
          <Link href={`/mission/wizard?edit=true&missionId=${mission.id}`} className={`block w-full py-3.5 text-center ${primaryButtonClass}`}>
            EDIT MISSION →
          </Link>
          <div className="text-center">
            <Link href="/dashboard/founder" className="font-semibold text-[#6b687a] transition-colors hover:text-[#1a1625]">
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
