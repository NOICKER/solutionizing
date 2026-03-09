"use client"

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { format } from 'date-fns'
import { toast } from '@/components/ui/sonner'
import { apiFetch, isApiClientError } from '@/lib/api/client'
import { ApiMissionDetail } from '@/types/api'
import {
  ConfirmationDialog,
  MissionStatusBadge,
  NotFoundPanel,
  SpinnerIcon,
  clampPercent,
  formatCoins,
  primaryButtonClass,
} from '@/components/solutionizing/ui'

export function MissionStatusPage({ missionId }: { missionId: string }) {
  const [mission, setMission] = useState<ApiMissionDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isNotFound, setIsNotFound] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(30)
  const [dialogType, setDialogType] = useState<'pause' | 'close' | null>(null)
  const [dialogLoading, setDialogLoading] = useState(false)
  const [dialogError, setDialogError] = useState('')

  const loadMission = useCallback(async () => {
    setError('')

    try {
      const response = await apiFetch<ApiMissionDetail>(`/api/v1/missions/${missionId}`)
      setMission(response)
      setIsNotFound(false)
    } catch (fetchError) {
      if (isApiClientError(fetchError) && fetchError.status === 404) {
        setIsNotFound(true)
      } else {
        setError(
          isApiClientError(fetchError) && fetchError.code === 'NETWORK_ERROR'
            ? 'Check your internet connection'
            : 'Something went wrong. Please try again.'
        )
      }
    } finally {
      setIsLoading(false)
    }
  }, [missionId])

  useEffect(() => {
    void loadMission()
  }, [loadMission])

  useEffect(() => {
    if (!mission || (mission.status !== 'ACTIVE' && mission.status !== 'PAUSED')) {
      return
    }

    if (countdown <= 0) {
      void loadMission()
      setCountdown(30)
      return
    }

    const timer = window.setTimeout(() => setCountdown((value) => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [countdown, loadMission, mission])

  useEffect(() => {
    setCountdown(30)
  }, [mission?.id, mission?.status])

  async function handleConfirm() {
    if (!mission || !dialogType) {
      return
    }

    setDialogLoading(true)
    setDialogError('')

    try {
      if (dialogType === 'pause') {
        await apiFetch(`/api/v1/missions/${mission.id}/pause`, { method: 'POST' })
      } else {
        const response = await apiFetch<{ refundAmount?: number; refundCoins?: number }>(
          `/api/v1/missions/${mission.id}/close`,
          { method: 'POST' }
        )
        const refund = response.refundCoins ?? response.refundAmount ?? 0
        toast.success(`Mission closed. ${formatCoins(refund)} coins refunded to your balance.`)
      }

      setDialogType(null)
      await loadMission()
    } catch (fetchError) {
      setDialogError(
        isApiClientError(fetchError) && fetchError.code === 'NETWORK_ERROR'
          ? 'Check your internet connection'
          : 'Something went wrong. Please try again.'
      )
    } finally {
      setDialogLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#faf9f7] p-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="h-6 w-40 animate-pulse rounded bg-[#e5e4e0]" />
          <div className="rounded-3xl border border-[#e5e4e0] bg-white p-8">
            <div className="mb-4 h-8 w-1/2 animate-pulse rounded bg-[#e5e4e0]" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-[#e5e4e0]" />
          </div>
          <div className="h-64 animate-pulse rounded-3xl bg-white" />
        </div>
      </div>
    )
  }

  if (isNotFound) {
    return <NotFoundPanel backHref="/dashboard/founder" />
  }

  if (!mission) {
    return (
      <div className="min-h-screen bg-[#faf9f7] p-8">
        <div className="mx-auto max-w-4xl rounded-2xl bg-[#faf9f7] p-12 text-center text-sm text-red-600">
          {error}
        </div>
      </div>
    )
  }

  const completedCount = mission.assignmentCounts?.COMPLETED ?? mission.testersCompleted
  const assignedCount = mission.assignmentCounts?.ASSIGNED ?? Math.max(mission.testersRequired - completedCount, 0)
  const inProgressCount = mission.assignmentCounts?.IN_PROGRESS ?? 0
  const timedOutCount = mission.assignmentCounts?.TIMED_OUT ?? 0
  const progress = clampPercent((mission.testersCompleted / Math.max(mission.testersRequired, 1)) * 100)

  return (
    <div className="min-h-screen bg-[#faf9f7] p-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/dashboard/founder" className="mb-6 inline-block font-semibold text-[#6b687a] transition-colors hover:text-[#1a1625]">
          ← Back to dashboard
        </Link>

        <div className="mb-8">
          <div className="mb-3 flex items-start justify-between">
            <div className="flex-1">
              <h1 className="mb-2 text-3xl font-black text-[#1a1625]">{mission.title}</h1>
              <p className="text-[#6b687a]">{mission.goal}</p>
            </div>
            <MissionStatusBadge status={mission.status} />
          </div>
        </div>

        <div className="mb-6 rounded-3xl border border-[#e5e4e0] bg-white p-8">
          <h2 className="mb-6 text-xl font-black text-[#1a1625]">Mission Progress</h2>
          <div className="mb-4 h-4 w-full overflow-hidden rounded-full bg-[#f3f3f5]">
            <div className="h-full rounded-full bg-gradient-to-r from-[#d77a57] to-[#c4673f]" style={{ width: `${progress}%` }} />
          </div>
          <div className="mb-6 text-lg font-black text-[#1a1625]">
            {mission.testersCompleted} of {mission.testersRequired} testers
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-black text-blue-600">{assignedCount}</div>
              <div className="text-sm text-[#6b687a]">Assigned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-amber-600">{inProgressCount}</div>
              <div className="text-sm text-[#6b687a]">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-green-600">{completedCount}</div>
              <div className="text-sm text-[#6b687a]">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-red-600">{timedOutCount}</div>
              <div className="text-sm text-[#6b687a]">Timed Out</div>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-3xl border border-[#e5e4e0] bg-white p-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[#6b687a]">Mission launched:</span>
              <span className="font-bold text-[#1a1625]">
                {mission.launchedAt ? format(new Date(mission.launchedAt), 'MMM d, yyyy h:mm a') : 'Not launched yet'}
              </span>
            </div>
          </div>

          {mission.status === 'ACTIVE' || mission.status === 'PAUSED' ? (
            <div className="mt-4 flex justify-end">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#f3f3f5] px-3 py-1.5 text-xs text-[#9b98a8]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refreshing in {countdown}s
              </div>
            </div>
          ) : null}
        </div>

        <div className="mb-6 flex items-center gap-4">
          {mission.status === 'ACTIVE' ? (
            <>
              <button className={`px-6 py-3 ${primaryButtonClass}`} onClick={() => setDialogType('pause')}>
                PAUSE MISSION
              </button>
              <button className="rounded-[2rem] border-2 border-red-300 px-6 py-3 font-bold text-red-600 transition-all hover:bg-red-50" onClick={() => setDialogType('close')}>
                CLOSE MISSION
              </button>
            </>
          ) : null}

          {mission.status === 'PAUSED' ? (
            <button className="rounded-[2rem] border-2 border-red-300 px-6 py-3 font-bold text-red-600 transition-all hover:bg-red-50" onClick={() => setDialogType('close')}>
              CLOSE MISSION
            </button>
          ) : null}

          {mission.status === 'COMPLETED' ? (
            <Link href={`/mission/insights/${mission.id}`} className={`px-6 py-3 ${primaryButtonClass}`}>
              VIEW INSIGHTS →
            </Link>
          ) : null}
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>

      {dialogType ? (
        <ConfirmationDialog
          title={dialogType === 'pause' ? 'Pause this mission?' : 'Close this mission?'}
          body={
            dialogType === 'pause'
              ? "Testers won't receive new assignments while paused."
              : "You'll receive a refund for unfilled tester slots. This cannot be undone."
          }
          confirmLabel={dialogType === 'pause' ? 'PAUSE MISSION' : 'CLOSE MISSION'}
          confirmStyle={dialogType === 'pause' ? 'primary' : 'danger'}
          onCancel={() => {
            setDialogType(null)
            setDialogError('')
          }}
          onConfirm={() => void handleConfirm()}
          isLoading={dialogLoading}
          errorMessage={dialogError}
        />
      ) : null}
    </div>
  )
}
