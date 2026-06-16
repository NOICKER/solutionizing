"use client"

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { format } from 'date-fns'
import { toast } from '@/components/ui/sonner'
import { apiFetch, isApiClientError } from '@/lib/api/client'
import { ApiMissionDetail } from '@/types/api'
import { motion, AnimatePresence } from 'framer-motion'
import { MissionLifecycleTracker } from '@/components/solutionizing/MissionLifecycleTracker'
import {
 ConfirmationDialog,
 MissionStatusBadge,
 NotFoundPanel,
 clampPercent,
 formatCoins,
 SpinnerIcon,
 primaryButtonClass,
} from '@/components/solutionizing/ui'

// ─── Tester Responses Types ───────────────────────────────────────────────────

interface TesterResponseAnswer {
 id: string
 questionId: string
 responseText: string | null
 responseRating: number | null
 responseChoice: string | null
 question: {
 text: string
 type: string
 order: number
 }
}

interface TesterResponse {
 id: string
 completedAt: string | null
 coinsEarned: number
 tester: {
 displayName: string
 }
 responses: TesterResponseAnswer[]
}

// ─── Answer renderer ──────────────────────────────────────────────────────────

function AnswerDisplay({ answer }: { answer: TesterResponseAnswer }) {
 const { type } = answer.question

 if (type === 'RATING_1_5' && answer.responseRating !== null) {
 return (
 <div className="flex items-center gap-1">
 {Array.from({ length: 5 }).map((_, i) => (
 <span
 key={i}
 className={`text-lg ${
 i < answer.responseRating! ? 'text-[#92400e]' : 'text-[var(--ink-soft)] opacity-40'
 }`}
 >
 ★
 </span>
 ))}
 <span className="ml-2 text-sm font-semibold text-[#92400e]">
 {answer.responseRating} / 5
 </span>
 </div>
 )
 }

 if ((type === 'YES_NO' || type === 'MULTIPLE_CHOICE') && answer.responseChoice) {
 return (
 <span className="inline-flex items-center rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-sm font-semibold text-teal-400">
 {answer.responseChoice}
 </span>
 )
 }

 if ((type === 'TEXT_SHORT' || type === 'TEXT_LONG') && answer.responseText) {
 return (
 <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--ink)]">
 {answer.responseText}
 </p>
 )
 }

 return <span className="text-sm italic text-[var(--ink-soft)]">No answer provided</span>
}

// ─── Single tester card ───────────────────────────────────────────────────────

function TesterResponseCard({
 response,
 index,
}: {
 response: TesterResponse
 index: number
}) {
 const [isOpen, setIsOpen] = useState(false)

 const initials = response.tester.displayName
 .split(' ')
 .filter(Boolean)
 .slice(0, 2)
 .map((p) => p[0]?.toUpperCase() ?? '')
 .join('') || 'T'

 return (
 <motion.div
 initial={{ opacity: 0, y: 12 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: index * 0.06 }}
 className="overflow-hidden rounded-[1.25rem] border border-[var(--border)] bg-[var(--bg-light)]"
 >
 {/* Card header — always visible */}
 <button
 type="button"
 onClick={() => setIsOpen((prev) => !prev)}
 className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[var(--border)] cursor-none"
 aria-expanded={isOpen}
 >
 {/* Avatar */}
 <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[12px] bg-[var(--electric-dim)] text-sm font-bold text-[var(--electric)]">
 {initials}
 </div>

 {/* Name + timestamp */}
 <div className="min-w-0 flex-1">
 <div className="truncate font-semibold text-[var(--ink)]">
 {response.tester.displayName}
 </div>
 <div className="mt-0.5 text-xs text-[var(--ink-soft)]">
 Completed{' '}
 {response.completedAt
 ? format(new Date(response.completedAt), 'MMM d, yyyy · h:mm a')
 : 'Unknown time'}
 </div>
 </div>

 {/* Completed badge */}
 <span className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
 <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
 Completed
 </span>

 {/* Chevron */}
 <svg
 className={`h-5 w-5 flex-shrink-0 text-[var(--ink-soft)] transition-transform duration-200 ${
 isOpen ? 'rotate-180' : ''
 }`}
 fill="none"
 viewBox="0 0 24 24"
 stroke="currentColor"
 >
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
 </svg>
 </button>

 {/* Expanded answers */}
 <AnimatePresence initial={false}>
 {isOpen && (
 <motion.div
 key="content"
 initial={{ height: 0, opacity: 0 }}
 animate={{ height: 'auto', opacity: 1 }}
 exit={{ height: 0, opacity: 0 }}
 transition={{ duration: 0.22, ease: 'easeInOut' }}
 className="overflow-hidden"
 >
 <div className="space-y-4 border-t border-[var(--border)] px-5 py-5">
 {response.responses.length === 0 ? (
 <p className="text-sm italic text-[var(--ink-soft)]">No answers recorded for this submission.</p>
 ) : (
 response.responses.map((answer, ansIdx) => (
 <div key={answer.id} className="space-y-1.5">
 <div className="flex items-start gap-2">
 <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-[12px] bg-[var(--border-strong)] text-[0.6rem] font-bold text-[var(--ink)]">
 {ansIdx + 1}
 </span>
 <p className="text-sm font-semibold text-[var(--ink)]">{answer.question.text}</p>
 </div>
 <div className="pl-7">
 <AnswerDisplay answer={answer} />
 </div>
 </div>
 ))
 )}
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </motion.div>
 )
}

// ─── Full Tester Responses section ────────────────────────────────────────────

function TesterResponsesSection({ missionId, completedCount }: { missionId: string; completedCount: number }) {
 const [responses, setResponses] = useState<TesterResponse[]>([])
 const [isLoading, setIsLoading] = useState(false)
 const [error, setError] = useState('')

 const loadResponses = useCallback(async () => {
 if (completedCount === 0) return
 setIsLoading(true)
 setError('')
 try {
 const data = await apiFetch<TesterResponse[]>(`/api/v1/missions/${missionId}/responses`)
 setResponses(data)
 } catch (fetchError) {
 setError(
 isApiClientError(fetchError) && fetchError.code === 'NETWORK_ERROR'
 ? 'Check your internet connection'
 : 'Could not load responses'
 )
 } finally {
 setIsLoading(false)
 }
 }, [missionId, completedCount])

 useEffect(() => {
 void loadResponses()
 }, [loadResponses])

 return (
 <div style={{ background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.5rem 2rem', marginTop: '2rem' }}>
 {/* Section header */}
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
 <div>
 <h2 style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontWeight: 400, fontSize: '1.4rem', color: 'var(--ink)', margin: 0 }}>
 Tester Responses
 </h2>
 <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: '0.85rem', color: 'var(--ink-soft)', marginTop: '0.2rem', marginBottom: 0 }}>
 {completedCount === 0
 ? 'Responses will appear here as testers complete the mission.'
 : `${completedCount} tester${completedCount !== 1 ? 's' : ''} completed this mission.`}
 </p>
 </div>
 {completedCount > 0 && (
 <span style={{
 background: 'var(--electric-dim)', color: 'var(--electric)', border: '1px solid var(--electric-mid)',
 borderRadius: '100px', padding: '0.25rem 0.8rem', fontFamily: 'DM Mono, monospace', fontSize: '0.68rem', fontWeight: 600
 }}>
 {completedCount} completed
 </span>
 )}
 </div>

 {/* Content */}
 {isLoading ? (
 <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
 {Array.from({ length: Math.min(completedCount || 2, 3) }).map((_, i) => (
 <div
 key={i}
 style={{ height: '64px', borderRadius: '12px', background: 'var(--bg-light)', animation: 'pulse 1.5s infinite' }}
 />
 ))}
 </div>
 ) : error ? (
 <div style={{ background: 'rgba(192, 57, 43, 0.05)', border: '1px solid rgba(192, 57, 43, 0.2)', borderRadius: '12px', padding: '1rem', color: '#c0392b', fontSize: '0.88rem' }}>
 {error}
 <button className="cursor-none"
 type="button"
 style={{ marginLeft: '0.5rem', fontWeight: 'bold', textDecoration: 'underline', background: 'none', border: 'none', color: '#c0392b', cursor: 'none' }}
 onClick={() => void loadResponses()}
 >
 Retry
 </button>
 </div>
 ) : completedCount === 0 ? (
 <div style={{ border: '1px dashed var(--border-strong)', borderRadius: '12px', padding: '2.5rem', textAlign: 'center', background: 'var(--bg-light)' }}>
 <p style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontWeight: 400, fontSize: '1.1rem', color: 'var(--ink)', margin: '0 0 0.5rem' }}>No responses yet</p>
 <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: '0.85rem', color: 'var(--ink-soft)', margin: 0 }}>
 Check back once testers complete the mission.
 </p>
 </div>
 ) : responses.length === 0 && !isLoading ? (
 <div style={{ border: '1px dashed var(--border-strong)', borderRadius: '12px', padding: '2rem', textAlign: 'center', background: 'var(--bg-light)' }}>
 <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: '0.85rem', color: 'var(--ink-soft)', margin: 0 }}>Response data is loading…</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 {responses.map((response, index) => (
 <TesterResponseCard key={response.id} response={response} index={index} />
 ))}
 </div>
 )}
 </div>
 )
}

function MissionStatusPageSkeleton() {
 const skeletonBar = 'animate-pulse rounded-full bg-[var(--cream)]'
 const skeletonBlock = 'animate-pulse rounded-[1.25rem] bg-[var(--cream)]'
 const panelClass =
 'rounded-[1.25rem] border border-[var(--border)] bg-[var(--bg-light)] p-8'

 return (
 <div className="relative min-h-screen overflow-hidden bg-[var(--bg)] pt-[60px] pb-12 sm:pt-[80px]">
 <div className="fixed top-0 left-0 right-0 z-50 flex h-[56px] items-center border-b border-[var(--border)] bg-[var(--bg)]/90 px-4 backdrop-blur-md sm:px-6">
 <div className={`h-6 w-40 ${skeletonBar}`} />
 </div>
 <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8 mt-6">

 <div className={panelClass}>
 <div className="mb-8 flex items-start justify-between gap-6">
 <div className="flex-1 space-y-4">
 <div className={`h-12 w-3/4 rounded-[1.75rem] ${skeletonBar}`} />
 <div className={`h-5 w-full max-w-2xl ${skeletonBar}`} />
 <div className={`h-5 w-2/3 ${skeletonBar}`} />
 </div>
 <div className={`h-10 w-28 ${skeletonBar}`} />
 </div>

 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
 {Array.from({ length: 4 }).map((_, index) => (
 <div
 key={index}
 className="rounded-[12px] border border-[var(--border)] bg-[var(--bg-light)] p-4 sm:p-6"
 >
 <div className={`h-3 w-16 sm:w-24 ${skeletonBar}`} />
 <div className={`mt-4 h-9 w-16 sm:w-24 ${skeletonBar}`} />
 <div className={`mt-3 h-4 w-12 sm:w-20 ${skeletonBar}`} />
 </div>
 ))}
 </div>
 </div>

 <div className="grid gap-6 lg:grid-cols-[1.6fr,1fr]">
 <div className={`${panelClass} space-y-6`}>
 <div className={`h-4 w-36 ${skeletonBar}`} />
 <div className={`h-24 ${skeletonBlock}`} />
 <div className="grid gap-4 md:grid-cols-2">
 <div className={`h-32 ${skeletonBlock}`} />
 <div className={`h-32 ${skeletonBlock}`} />
 </div>
 </div>
 <div className={`${panelClass} space-y-5`}>
 <div className={`h-4 w-24 ${skeletonBar}`} />
 <div className={`h-14 rounded-[2rem] ${skeletonBlock}`} />
 <div className={`h-14 rounded-[2rem] ${skeletonBlock}`} />
 <div className={`h-28 ${skeletonBlock}`} />
 </div>
 </div>
 </div>
 </div>
 )
}

// ─── Find More Testers button ─────────────────────────────────────────────────

function FindMoreTestersButton({ missionId }: { missionId: string }) {
 const [state, setState] = useState<'idle' | 'loading' | 'success' | 'rate-limited' | 'error'>('idle')
 const [message, setMessage] = useState('')

 async function handleClick() {
 setState('loading')
 setMessage('')

 try {
 const data = await apiFetch<{ newTestersAssigned: number }>(`/api/v1/missions/${missionId}/reassign`, {
 method: 'POST',
 })

 if (data.newTestersAssigned > 0) {
 setMessage(`${data.newTestersAssigned} new tester${data.newTestersAssigned !== 1 ? 's' : ''} assigned!`)
 toast.success(`${data.newTestersAssigned} new tester${data.newTestersAssigned !== 1 ? 's' : ''} assigned to your mission.`)
 } else {
 setMessage('No new testers available right now. Try again later.')
 }

 setState('success')
 } catch (fetchError) {
 if (isApiClientError(fetchError) && fetchError.status === 429) {
 setState('rate-limited')
 setMessage('Please wait 10 minutes between requests.')
 } else {
 setState('error')
 setMessage(
 isApiClientError(fetchError) && fetchError.code === 'NETWORK_ERROR'
 ? 'Check your internet connection'
 : 'Something went wrong. Please try again.'
 )
 }
 }
 }

 return (
 <div className="mt-6 flex flex-col items-center gap-3">
 <button
 type="button"
 disabled={state === 'loading'}
 onClick={() => void handleClick()}
 className="group relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-[100px] bg-[var(--electric)] px-7 py-3.5 font-bold tracking-wide text-[var(--cream)] transition-all hover:shadow-[0_8px_24px_var(--electric-dim)] focus:outline-none disabled:pointer-events-none disabled:opacity-60 cursor-none"
 >
 {state === 'loading' ? (
 <SpinnerIcon />
 ) : (
 <svg className="h-5 w-5 transition-transform group-hover:rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
 </svg>
 )}
 push again to your testers
 </button>

 <AnimatePresence>
 {message && (
 <motion.p
 initial={{ opacity: 0, y: -8 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -8 }}
 className={`text-center text-sm font-medium ${
 state === 'success'
 ? 'text-[#1e7a47]'
 : state === 'rate-limited'
 ? 'text-amber-500'
 : 'text-[#c0392b]'
 }`}
 >
 {message}
 </motion.p>
 )}
 </AnimatePresence>
 </div>
 )
}

export function MissionStatusPage({ missionId }: { missionId: string }) {
 const [mission, setMission] = useState<ApiMissionDetail | null>(null)
 const [isLoading, setIsLoading] = useState(true)
 const [isNotFound, setIsNotFound] = useState(false)
 const [error, setError] = useState('')
 const [countdown, setCountdown] = useState(30)
 const [dialogType, setDialogType] = useState<'pause' | 'close' | null>(null)
 const [dialogLoading, setDialogLoading] = useState(false)
 const [dialogError, setDialogError] = useState('')
 const [resumeLoading, setResumeLoading] = useState(false)
 const [resumeError, setResumeError] = useState('')

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
 const updatedMission = await apiFetch<ApiMissionDetail>(`/api/v1/missions/${mission.id}/pause`, {
 method: 'POST',
 })
 setMission(updatedMission)
 } else {
 const response = await apiFetch<{
 mission: ApiMissionDetail
 refundAmount?: number
 refundCoins?: number
 }>(
 `/api/v1/missions/${mission.id}/close`,
 { method: 'POST' }
 )
 setMission(response.mission)
 const refund = response.refundCoins ?? response.refundAmount ?? 0
 toast.success(`Mission closed. ${formatCoins(refund)} coins refunded to your balance.`)
 }

 setDialogType(null)
 setCountdown(30)
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

 async function handleResume() {
 if (!mission) {
 return
 }

 setResumeLoading(true)
 setResumeError('')

 try {
 const updatedMission = await apiFetch<ApiMissionDetail>(`/api/v1/missions/${mission.id}/resume`, {
 method: 'POST',
 })
 setMission(updatedMission)
 toast.success('Mission resumed.')
 setCountdown(30)
 } catch (fetchError) {
 setResumeError(
 isApiClientError(fetchError) && fetchError.code === 'NETWORK_ERROR'
 ? 'Check your internet connection'
 : 'Something went wrong. Please try again.'
 )
 } finally {
 setResumeLoading(false)
 }
 }

 if (isLoading) {
 return <MissionStatusPageSkeleton />
 }

 if (isNotFound) {
 return <NotFoundPanel backHref="/dashboard/founder" />
 }

 if (!mission) {
 return (
 <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] p-8">
 <div className="w-full max-w-md rounded-[1.25rem] border border-[var(--border)] bg-[var(--bg-light)] p-8 text-center text-red-600 shadow-2xl">
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
 const effectiveLaunchAt =
 mission.launchedAt ??
 ((mission.status === 'ACTIVE' || mission.status === 'PAUSED' || mission.status === 'COMPLETED')
 ? mission.reviewedAt
 : null)

 return (
  <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] pt-[60px] pb-12 sm:pt-[80px]">
  <style>{`@keyframes pageIn { from { opacity: 0; } to { opacity: 1; } } body { animation: pageIn 0.4s cubic-bezier(0.16,1,0.3,1) forwards; }`}</style>

  {/* Fixed Top Bar */}
  <div className="fixed top-0 left-0 right-0 z-50 flex h-[56px] items-center border-b border-[var(--border)] bg-[var(--bg)]/90 px-4 backdrop-blur-md sm:px-6">
  <Link
  href="/dashboard/founder"
  className="flex items-center gap-2 font-[family-name:var(--font-dm-mono)] text-xs text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors cursor-none"
  >
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <path d="m15 18-6-6 6-6" />
  </svg>
  Back to dashboard
  </Link>
  </div>

  <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 mt-6">

 <div style={{ marginBottom: '2rem' }}>
 <MissionLifecycleTracker mission={mission} />
 </div>

 <div style={{ marginBottom: '2.5rem' }}>
 <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
 <div style={{ flex: 1 }}>
 <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.68rem', color: 'var(--electric)', letterSpacing: '0.12em', display: 'block', marginBottom: '0.5rem' }}>
 MISSION DETAILS
 </span>
 <h1 style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: '1.8rem', color: 'var(--ink)', fontWeight: 400, margin: 0 }}>
 {mission.title}
 </h1>
 <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: '0.9rem', color: 'var(--ink-soft)', marginTop: '0.5rem', marginBottom: 0 }}>
 {mission.goal}
 </p>
 </div>
 <MissionStatusBadge status={mission.status} />
 </div>
 </div>

 <div style={{ background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.5rem 2rem', marginBottom: '1.5rem' }}>
 <h2 style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.68rem', color: 'var(--ink-soft)', letterSpacing: '0.12em', marginBottom: '1rem', marginTop: 0 }}>
 MISSION PROGRESS
 </h2>

 <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
 <div style={{ background: 'var(--bg)', height: '6px', borderRadius: '100px', width: '100%', overflow: 'hidden' }}>
 <div
 style={{
 background: 'var(--electric)', height: '6px', borderRadius: '100px',
 width: `${progress}%`, transition: 'width 0.5s cubic-bezier(0.16,1,0.3,1)'
 }}
 />
 </div>
 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.6rem' }}>
 <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.78rem', color: 'var(--electric)' }}>
 {progress.toFixed(0)}% Complete
 </span>
 <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.78rem', color: 'var(--ink-soft)' }}>
 {mission.testersCompleted} of {mission.testersRequired} testers
 </span>
 </div>
 </div>

  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
 {[
 { label: 'Assigned', value: assignedCount, color: 'var(--ink-soft)' },
 { label: 'In Progress', value: inProgressCount, color: 'var(--electric)' },
 { label: 'Completed', value: completedCount, color: '#1e7a47' },
 { label: 'Timed Out', value: timedOutCount, color: '#c0392b' },
 ].map((stat) => (
 <div
 key={stat.label}
 style={{
 background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.2rem 1.4rem'
 }}
 >
 <div style={{ fontFamily: 'Fraunces, serif', fontSize: '2rem', fontWeight: 700, color: stat.color, lineHeight: 1 }}>
 {stat.value}
 </div>
 <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.65rem', color: 'var(--ink-soft)', letterSpacing: '0.12em', marginTop: '0.4rem', textTransform: 'uppercase' }}>
 {stat.label}
 </div>
 </div>
 ))}
 </div>

 {/* Find More Testers button — visible when ACTIVE and slots remain */}
 {mission.status === 'ACTIVE' && mission.testersCompleted < mission.testersRequired && (
 <FindMoreTestersButton missionId={mission.id} />
 )}
 </div>

 <div style={{ background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.5rem 2rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
 <div style={{
 width: 36, height: 36, borderRadius: '50%',
 background: 'var(--electric-dim)', border: '1px solid var(--electric-mid)',
 color: 'var(--electric)', display: 'flex', alignItems: 'center', justifyContent: 'center'
 }}>
 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
 <circle cx="12" cy="12" r="10" />
 <polyline points="12 6 12 12 16 14" />
 </svg>
 </div>
 <div>
 <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.68rem', color: 'var(--ink-soft)', letterSpacing: '0.12em' }}>MISSION LAUNCHED</div>
 <div style={{ fontFamily: 'Satoshi, sans-serif', fontWeight: 600, fontSize: '0.9rem', color: 'var(--ink)' }}>
 {effectiveLaunchAt ? format(new Date(effectiveLaunchAt), 'MMM d, yyyy h:mm a') : 'Not launched yet'}
 </div>
 </div>
 </div>

 {(mission.status === 'ACTIVE' || mission.status === 'PAUSED') ? (
 <div style={{
 display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
 background: 'var(--cream)', border: '1px solid var(--border)',
 borderRadius: '100px', padding: '0.4rem 1rem', fontFamily: 'DM Mono, monospace',
 fontSize: '0.72rem', color: 'var(--ink-soft)'
 }}>
 <span style={{ position: 'relative', display: 'flex', width: '8px', height: '8px' }}>
 <span style={{ position: 'absolute', display: 'inline-flex', height: '100%', width: '100%', background: '#1e7a47', borderRadius: '50%', opacity: 0.75, animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
 <span style={{ position: 'relative', display: 'inline-flex', height: '8px', width: '8px', background: '#1e7a47', borderRadius: '50%' }} />
 </span>
 Refreshing in {countdown}s
 </div>
 ) : null}
 </div>

 <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', marginBottom: '2.5rem' }}>
 {mission.status === 'ACTIVE' ? (
 <>
 <button className="cursor-none"
 style={{
 background: 'var(--electric)', color: 'var(--cream)', border: 'none',
 borderRadius: '100px', padding: '0.65rem 1.6rem', fontFamily: 'Satoshi, sans-serif',
 fontWeight: 700, fontSize: '0.88rem', cursor: 'none'
 }}
 onClick={() => setDialogType('pause')}
 >
 PAUSE MISSION
 </button>
 <button className="cursor-none"
 style={{
 background: 'transparent', border: '1.5px solid var(--border-strong)', color: '#c0392b',
 borderRadius: '100px', padding: '0.6rem 1.4rem', fontFamily: 'Satoshi, sans-serif',
 fontWeight: 600, fontSize: '0.88rem', cursor: 'none'
 }}
 onClick={() => setDialogType('close')}
 >
 CLOSE MISSION
 </button>
 </>
 ) : null}

 {mission.status === 'PAUSED' ? (
 <>
 <button className="cursor-none"
 style={{
 background: 'var(--electric)', color: 'var(--cream)', border: 'none',
 borderRadius: '100px', padding: '0.65rem 1.6rem', fontFamily: 'Satoshi, sans-serif',
 fontWeight: 700, fontSize: '0.88rem', cursor: 'none', opacity: resumeLoading ? 0.6 : 1
 }}
 onClick={() => void handleResume()}
 disabled={resumeLoading}
 >
 {resumeLoading ? <SpinnerIcon className="h-4 w-4 mr-2 inline" /> : null}
 RESUME MISSION
 </button>
 <button className="cursor-none"
 style={{
 background: 'transparent', border: '1.5px solid var(--border-strong)', color: '#c0392b',
 borderRadius: '100px', padding: '0.6rem 1.4rem', fontFamily: 'Satoshi, sans-serif',
 fontWeight: 600, fontSize: '0.88rem', cursor: 'none'
 }}
 onClick={() => setDialogType('close')}
 >
 CLOSE MISSION
 </button>
 {resumeError ? (
 <p style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.72rem', color: '#c0392b', margin: 0 }}>
 {resumeError}
 </p>
 ) : null}
 </>
 ) : null}

 {mission.status === 'COMPLETED' ? (
 <Link className="cursor-none"
 href={`/mission/insights/${mission.id}`}
 style={{
 background: 'var(--electric)', color: 'var(--cream)', border: 'none',
 borderRadius: '100px', padding: '0.65rem 1.6rem', fontFamily: 'Satoshi, sans-serif',
 fontWeight: 700, fontSize: '0.88rem', cursor: 'none', display: 'inline-flex',
 alignItems: 'center', gap: '0.4rem', textDecoration: 'none'
 }}
 >
 <span>VIEW INSIGHTS</span>
 <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
 </svg>
 </Link>
 ) : null}
 </div>

 {error ? (
 <p style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.72rem', color: '#c0392b', textAlign: 'center', margin: '1rem 0' }}>
 {error}
 </p>
 ) : null}

 <TesterResponsesSection missionId={mission.id} completedCount={completedCount} />
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
