"use client"

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { format } from 'date-fns'
import { toast } from '@/components/ui/sonner'
import { apiFetch, isApiClientError } from '@/lib/api/client'
import { ApiMissionDetail } from '@/types/api'
import { motion } from 'framer-motion'
import {
  ConfirmationDialog,
  MissionStatusBadge,
  NotFoundPanel,
  clampPercent,
  formatCoins,
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
      <div className="min-h-screen bg-black/95 p-8 text-neutral-100 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="flex flex-col items-center gap-4"
        >
          <div className="h-12 w-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
          <p className="text-neutral-400 font-medium">Loading mission status...</p>
        </motion.div>
      </div>
    )
  }

  if (isNotFound) {
    return <NotFoundPanel backHref="/dashboard/founder" />
  }

  if (!mission) {
    return (
      <div className="min-h-screen bg-black/95 p-8 flex items-center justify-center">
        <div className="max-w-md w-full rounded-3xl border border-red-500/20 bg-red-500/5 p-8 text-center text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.1)] backdrop-blur-xl">
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

  const glassPanelClasses = "rounded-3xl border border-neutral-800 bg-neutral-900/40 p-8 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:border-neutral-700/50 hover:bg-neutral-900/60"

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  }

  return (
    <div className="min-h-screen bg-black text-neutral-100 p-8 relative overflow-hidden">
      {/* Premium Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-br from-emerald-500/10 via-indigo-500/5 to-transparent blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-gradient-to-tl from-emerald-500/10 via-teal-500/5 to-transparent blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="mx-auto max-w-4xl relative z-10"
      >
        <motion.div variants={itemVariants}>
          <Link href="/dashboard/founder" className="mb-8 inline-flex items-center gap-2 font-medium text-neutral-400 transition-colors hover:text-emerald-400">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Back to dashboard
          </Link>
        </motion.div>

        <motion.div variants={itemVariants} className="mb-10">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex-1 pr-8">
              <h1 className="mb-3 text-4xl sm:text-5xl font-black tracking-tight text-white drop-shadow-sm">{mission.title}</h1>
              <p className="text-lg text-neutral-400">{mission.goal}</p>
            </div>
            <MissionStatusBadge status={mission.status} />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className={`mb-6 ${glassPanelClasses}`}>
          <h2 className="mb-8 text-2xl font-bold tracking-tight text-white">Mission Progress</h2>
          
          <div className="relative mb-8">
            <div className="mb-4 h-6 w-full overflow-hidden rounded-full bg-neutral-800/50 inset-0 shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 relative"
              >
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSIvPgo8L3N2Zz4=')] opacity-30 mix-blend-overlay" />
              </motion.div>
            </div>
            <div className="flex justify-between items-center text-sm font-semibold">
              <span className="text-emerald-400">{progress.toFixed(0)}% Complete</span>
              <span className="text-neutral-400">
                {mission.testersCompleted} of {mission.testersRequired} testers
              </span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Assigned', value: assignedCount, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
              { label: 'In Progress', value: inProgressCount, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
              { label: 'Completed', value: completedCount, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
              { label: 'Timed Out', value: timedOutCount, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
            ].map((stat, i) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className={`flex flex-col items-center justify-center rounded-2xl border ${stat.border} ${stat.bg} p-6 text-center backdrop-blur-sm transition-transform hover:scale-105`}
              >
                <div className={`text-4xl font-black tracking-tight mb-2 ${stat.color}`}>{stat.value}</div>
                <div className="text-sm font-medium uppercase tracking-wider text-neutral-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className={`mb-8 ${glassPanelClasses} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-6`}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div>
              <div className="text-sm text-neutral-400">Mission launched</div>
              <div className="font-semibold text-white">
                {mission.launchedAt ? format(new Date(mission.launchedAt), 'MMM d, yyyy h:mm a') : 'Not launched yet'}
              </div>
            </div>
          </div>

          {(mission.status === 'ACTIVE' || mission.status === 'PAUSED') && (
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-800/50 px-4 py-2 text-sm font-medium text-neutral-300 shadow-sm backdrop-blur-md">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
              </span>
              Refreshing in {countdown}s
            </div>
          )}
        </motion.div>

        <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-4">
          {mission.status === 'ACTIVE' && (
            <>
              <button 
                className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-neutral-800 px-8 py-4 font-bold tracking-wide text-white transition-all hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 focus:ring-offset-black"
                onClick={() => setDialogType('pause')}
              >
                PAUSE MISSION
              </button>
              <button 
                className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full border border-red-500/30 bg-red-500/10 px-8 py-4 font-bold tracking-wide text-red-500 transition-all hover:bg-red-500/20 hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black" 
                onClick={() => setDialogType('close')}
              >
                CLOSE MISSION
              </button>
            </>
          )}

          {mission.status === 'PAUSED' && (
            <button 
              className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full border border-red-500/30 bg-red-500/10 px-8 py-4 font-bold tracking-wide text-red-500 transition-all hover:bg-red-500/20 hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black" 
              onClick={() => setDialogType('close')}
            >
              CLOSE MISSION
            </button>
          )}

          {mission.status === 'COMPLETED' && (
            <Link 
              href={`/mission/insights/${mission.id}`} 
              className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-4 font-bold tracking-wide text-white transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-black"
            >
              <span>VIEW INSIGHTS</span>
              <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          )}
        </motion.div>

        {error && (
          <motion.p 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="mt-6 text-center text-sm font-medium text-red-400"
          >
            {error}
          </motion.p>
        )}
      </motion.div>

      {dialogType && (
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
      )}
    </div>
  )
}

