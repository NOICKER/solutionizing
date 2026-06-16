"use client"

import Link from 'next/link'
import { ClipboardList, Flag, LayoutDashboard, Rocket, Settings, Users, MessageSquare } from 'lucide-react'
import { Fragment, useCallback, useEffect, useState } from 'react'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { apiFetch, isApiClientError } from '@/lib/api/client'
import { RequireAuth } from '@/components/RequireAuth'
import { toast } from '@/components/ui/sonner'
import { getFlagReasonLabel } from '@/lib/flags'
import type { ApiMissionFlagGroup, FlagStatus, Role } from '@/types/api'
import {
 BrandMark,
 ConfirmationDialog,
 DashboardCardSkeleton,
 EmptyStatePanel,
 ErrorStatePanel,
 MissionStatusBadge,
 SpinnerIcon,
 StatCard,
 SidebarNavItem,
 PageHeader,
 primaryButtonClass,
 outlineButtonClass,
 mutedButtonClass,
 textFieldClass,
} from '@/components/solutionizing/ui'

interface DashboardStats {
 totals: {
 users: number
 founders: number
 testers: number
 missions: number
 completedMissions: number
 totalResponsesCollected: number
 }
 last30Days: {
 newUsers: number
 launchedMissions: number
 completedMissions: number
 coinsIssued: number
 coinsWithdrawn: number
 platformRevenue: number
 }
}

interface UserProfile {
 displayName: string | null
}

interface User {
 id: string
 email: string
 role: Role | null
 isSuspended: boolean
 suspendedAt: string | null
 suspendReason: string | null
 createdAt: string
 founderProfile: UserProfile | null
 testerProfile: UserProfile | null
}

interface FeedbackItem {
 id: string
 userId: string | null
 page: string
 screenshotUrl: string | null
 message: string
 category: string
 createdAt: string
 user: {
 email: string
 } | null
}

type ReportResolutionStatus = FlagStatus

type MissionDialogState =
 | { type: 'approve'; missionId: string; missionTitle: string }
 | { type: 'reject'; missionId: string; missionTitle: string }

type ReportResolutionDraft = {
 reportId: string
 status: Exclude<ReportResolutionStatus, 'PENDING'>
 note: string
}

type CoinAwardDraft = {
 userId: string
 amount: string
 note: string
}

type CoinAwardMessage = {
 userId: string
 type: 'success' | 'error'
 text: string
}

const overviewSidebarProps = { glyph: <LayoutDashboard className="h-4 w-4" /> }
const missionsSidebarProps = { glyph: <Rocket className="h-4 w-4" /> }
const usersSidebarProps = { glyph: <Users className="h-4 w-4" /> }
const flagsSidebarProps = { glyph: <Flag className="h-4 w-4" /> }
const feedbackSidebarProps = { glyph: <MessageSquare className="h-4 w-4" /> }
const settingsSidebarProps = { glyph: <Settings className="h-4 w-4" /> }

const adminNavItems = [
 { id: 'overview', label: 'Overview', icon: LayoutDashboard, sidebarProps: overviewSidebarProps },
 { id: 'missions', label: 'Missions', icon: Rocket, sidebarProps: missionsSidebarProps },
 { id: 'users', label: 'Users', icon: Users, sidebarProps: usersSidebarProps },
 { id: 'flags', label: 'Flags', icon: Flag, sidebarProps: flagsSidebarProps },
 { id: 'feedback', label: 'Feedback', icon: MessageSquare, sidebarProps: feedbackSidebarProps },
] as const

type AdminTab = (typeof adminNavItems)[number]['id']

function getUserDisplayName(user: User) {
 return user.founderProfile?.displayName ?? user.testerProfile?.displayName ?? 'Incognito User'
}

function getRoleBadgeClass(role: User['role']) {
 if (role === 'FOUNDER') return 'bg-blue-100 text-blue-700 '
 if (role === 'TESTER') return 'bg-purple-100 text-purple-700 '
 if (role === 'ADMIN') return 'bg-amber-100 text-amber-700 '
 return 'bg-gray-100 text-gray-700 '
}

function ReportStatusBadge({ status }: { status: ReportResolutionStatus }) {
 const classes =
 status === 'RESOLVED'
 ? 'bg-green-100 text-green-700 '
 : status === 'DISMISSED'
 ? 'bg-gray-200 text-gray-700 '
 : 'bg-amber-100 text-amber-700 '

 return (
 <span className={`inline-flex rounded-full px-3 py-1 text-[0.7rem] font-bold ${classes}`}>
 {status}
 </span>
 )
}

export default function AdminDashboardPage() {
 const router = useRouter()
 const [stats, setStats] = useState<DashboardStats | null>(null)
 const [recentUsers, setRecentUsers] = useState<User[]>([])
 const [pendingMissions, setPendingMissions] = useState<any[]>([])
 const [pendingMissionsError, setPendingMissionsError] = useState('')
 const [flaggedItems, setFlaggedItems] = useState<ApiMissionFlagGroup[]>([])
 const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([])
 const [selectedImage, setSelectedImage] = useState<string | null>(null)
 const [userList, setUserList] = useState<User[]>([])
 const [isLoading, setIsLoading] = useState(true)
 const [isActionLoading, setIsActionLoading] = useState(false)
 const [userActionLoadingId, setUserActionLoadingId] = useState<string | null>(null)
 const [reportActionLoadingId, setReportActionLoadingId] = useState<string | null>(null)
 const [error, setError] = useState<string | null>(null)
 const [activeTab, setActiveTab] = useState<AdminTab>('overview')
 const [missionDialog, setMissionDialog] = useState<MissionDialogState | null>(null)
 const [missionDialogError, setMissionDialogError] = useState('')
 const [rejectionReason, setRejectionReason] = useState('')
 const [reportResolutionDraft, setReportResolutionDraft] = useState<ReportResolutionDraft | null>(null)
 const [reportResolutionError, setReportResolutionError] = useState('')
 const [coinAwardDraft, setCoinAwardDraft] = useState<CoinAwardDraft | null>(null)
 const [coinAwardLoadingId, setCoinAwardLoadingId] = useState<string | null>(null)
 const [coinAwardMessage, setCoinAwardMessage] = useState<CoinAwardMessage | null>(null)

 const fetchDashboardData = useCallback(async () => {
 try {
 setIsLoading(true)
 setError(null)

 const [statsRes, usersRes] = await Promise.all([
 apiFetch<DashboardStats>('/api/v1/admin/stats'),
 apiFetch<User[]>('/api/v1/admin/users?limit=5'),
 ])

 setStats(statsRes)
 setRecentUsers(usersRes)
 } catch (err) {
 if (isApiClientError(err)) {
 setError(err.message)
 } else {
 setError('Failed to load dashboard data')
 }
 } finally {
 setIsLoading(false)
 }
 }, [])

 const fetchPendingMissions = useCallback(async () => {
 try {
 setIsLoading(true)
 setPendingMissionsError('')
 const res = await apiFetch<any[]>('/api/v1/admin/missions/pending')
 setPendingMissions(res)
 } catch (err) {
 console.error('Failed to fetch pending missions', err)
 setPendingMissionsError('Failed to load pending missions.')
 } finally {
 setIsLoading(false)
 }
 }, [])

 const fetchAllUsers = useCallback(async () => {
 try {
 setIsLoading(true)
 const res = await apiFetch<User[]>('/api/v1/admin/users')
 setUserList(res)
 } catch (err) {
 console.error('Failed to fetch users', err)
 } finally {
 setIsLoading(false)
 }
 }, [])

 const fetchFlaggedContent = useCallback(async () => {
 try {
 setIsLoading(true)
 const res = await apiFetch<ApiMissionFlagGroup[]>('/api/v1/admin/flags')
 setFlaggedItems(res)
 } catch (err) {
 console.error('Failed to fetch flagged content', err)
 } finally {
 setIsLoading(false)
 }
 }, [])

 const fetchFeedbackContent = useCallback(async () => {
 try {
 setIsLoading(true)
 const res = await apiFetch<{ items: FeedbackItem[] }>('/api/v1/admin/feedback')
 setFeedbackItems(res.items)
 } catch (err) {
 console.error('Failed to fetch feedback content', err)
 } finally {
 setIsLoading(false)
 }
 }, [])

 useEffect(() => {
 if (activeTab === 'overview') void fetchDashboardData()
 if (activeTab === 'missions') void fetchPendingMissions()
 if (activeTab === 'users') void fetchAllUsers()
 if (activeTab === 'flags') void fetchFlaggedContent()
 if (activeTab === 'feedback') void fetchFeedbackContent()
 }, [activeTab, fetchDashboardData, fetchPendingMissions, fetchAllUsers, fetchFlaggedContent, fetchFeedbackContent])

 const closeMissionDialog = useCallback(() => {
 setMissionDialog(null)
 setMissionDialogError('')
 setRejectionReason('')
 }, [])

 const closeReportResolution = useCallback(() => {
 setReportResolutionDraft(null)
 setReportResolutionError('')
 }, [])

 const handleApproveMission = (missionId: string, missionTitle: string) => {
 setMissionDialog({ type: 'approve', missionId, missionTitle })
 setMissionDialogError('')
 setRejectionReason('')
 }

 const handleRejectMission = (missionId: string, missionTitle: string) => {
 setMissionDialog({ type: 'reject', missionId, missionTitle })
 setMissionDialogError('')
 setRejectionReason('')
 }

 const handleMissionDialogConfirm = async () => {
 if (!missionDialog) {
 return
 }

 if (missionDialog.type === 'reject' && rejectionReason.trim().length < 10) {
 setMissionDialogError('Rejection reason must be at least 10 characters')
 return
 }

 try {
 setIsActionLoading(true)

 if (missionDialog.type === 'approve') {
 await apiFetch(`/api/v1/admin/missions/${missionDialog.missionId}/approve`, { method: 'POST' })
 } else {
 await apiFetch(`/api/v1/admin/missions/${missionDialog.missionId}/reject`, {
 method: 'POST',
 body: { reason: rejectionReason.trim() },
 })
 }

 await fetchPendingMissions()
 closeMissionDialog()
 } catch {
 setMissionDialogError(
 missionDialog.type === 'approve' ? 'Failed to approve mission' : 'Failed to reject mission'
 )
 } finally {
 setIsActionLoading(false)
 }
 }

 const updateUserInLists = useCallback((updatedUser: User) => {
 setRecentUsers((current) => current.map((user) => (user.id === updatedUser.id ? updatedUser : user)))
 setUserList((current) => current.map((user) => (user.id === updatedUser.id ? updatedUser : user)))
 }, [])

 const handleUnsuspendUser = useCallback(async (userId: string) => {
 try {
 setUserActionLoadingId(userId)
 const updatedUser = await apiFetch<User>(`/api/v1/admin/users/${userId}/unsuspend`, {
 method: 'POST',
 })
 updateUserInLists(updatedUser)
 toast.success('Account reactivated.')
 } catch (err) {
 const message = isApiClientError(err) ? err.message : 'Failed to unsuspend user.'
 toast.error(message)
 } finally {
 setUserActionLoadingId(null)
 }
 }, [updateUserInLists])

 const handleOpenCoinAward = useCallback((userId: string) => {
 setCoinAwardDraft({ userId, amount: '', note: '' })
 setCoinAwardMessage(null)
 }, [])

 const handleConfirmCoinAward = useCallback(async () => {
 if (!coinAwardDraft) {
 return
 }

 const amount = Number(coinAwardDraft.amount)
 const note = coinAwardDraft.note.trim()

 if (!Number.isInteger(amount) || amount <= 0) {
 setCoinAwardMessage({
 userId: coinAwardDraft.userId,
 type: 'error',
 text: 'Enter a positive whole number of coins.',
 })
 return
 }

 if (note.length < 10) {
 setCoinAwardMessage({
 userId: coinAwardDraft.userId,
 type: 'error',
 text: 'Note must be at least 10 characters.',
 })
 return
 }

 try {
 setCoinAwardLoadingId(coinAwardDraft.userId)
 setCoinAwardMessage(null)
 await apiFetch('/api/v1/admin/coins/adjust', {
 method: 'POST',
 body: {
 userId: coinAwardDraft.userId,
 amount,
 note,
 },
 })
 setCoinAwardMessage({
 userId: coinAwardDraft.userId,
 type: 'success',
 text: `${amount.toLocaleString()} coins awarded.`,
 })
 setCoinAwardDraft(null)
 toast.success('Coins awarded.')
 } catch (err) {
 const message = isApiClientError(err) ? err.message : 'Failed to award coins.'
 setCoinAwardMessage({
 userId: coinAwardDraft.userId,
 type: 'error',
 text: message,
 })
 toast.error(message)
 } finally {
 setCoinAwardLoadingId(null)
 }
 }, [coinAwardDraft])

 const handleOpenReportResolution = useCallback(
 (reportId: string, status: Exclude<ReportResolutionStatus, 'PENDING'>) => {
 setReportResolutionDraft({ reportId, status, note: '' })
 setReportResolutionError('')
 },
 []
 )

 const handleConfirmReportResolution = useCallback(async () => {
 if (!reportResolutionDraft) {
 return
 }

 try {
 setReportActionLoadingId(reportResolutionDraft.reportId)
 setReportResolutionError('')

 const updatedReport = await apiFetch<{
 id: string
 status: ReportResolutionStatus
 resolutionNote: string | null
 createdAt: string
 }>(`/api/v1/admin/flags/${reportResolutionDraft.reportId}/resolve`, {
 method: 'POST',
 body: {
 status: reportResolutionDraft.status,
 note: reportResolutionDraft.note.trim() || undefined,
 },
 })

 setFlaggedItems((current) =>
 current.map((group) => ({
 ...group,
 flags: group.flags.map((report) =>
 report.id === updatedReport.id
 ? {
 ...report,
 status: updatedReport.status,
 resolutionNote: updatedReport.resolutionNote,
 createdAt: updatedReport.createdAt,
 }
 : report
 ),
 }))
 )

 closeReportResolution()
 toast.success(
 reportResolutionDraft.status === 'RESOLVED' ? 'Flag resolved.' : 'Flag dismissed.'
 )
 } catch (err) {
 const message = isApiClientError(err) ? err.message : 'Failed to update flag.'
 setReportResolutionError(message)
 toast.error(message)
 } finally {
 setReportActionLoadingId(null)
 }
 }, [closeReportResolution, reportResolutionDraft])

 const totalFlagReports = flaggedItems.reduce((total, group) => total + group.flags.length, 0)

 if (error) {
 return (
 <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] p-8 ">
 <ErrorStatePanel
 title="Dashboard Error"
 body={error}
 onRetry={() => {
 void fetchDashboardData()
 }}
 />
 </div>
 )
 }

 return (
 <RequireAuth role="ADMIN">
 <div className="flex min-h-screen bg-[var(--bg)] ">
 <aside className="fixed bottom-0 left-0 top-0 hidden w-72 border-r border-[var(--border)] bg-white p-6 md:block">
 <div className="mb-10 flex items-center gap-3">
 <BrandMark className="h-8 w-8 text-[var(--electric)]" />
 <span className="text-xl font-bold tracking-tight text-[var(--ink)] ">Admin Panel</span>
 </div>

 <nav className="flex flex-col gap-2">
 {adminNavItems.map((item) => (
 <SidebarNavItem
 key={item.id}
 {...item.sidebarProps}
 label={item.label}
 active={activeTab === item.id}
 onClick={() => setActiveTab(item.id)}
 />
 ))}
 <div className="my-4 border-t border-[var(--border)] " />
 <SidebarNavItem
 {...settingsSidebarProps}
 label="Platform Settings"
 onClick={() => toast.info('Platform settings coming soon.')}
 />
 </nav>

 <div className="absolute bottom-6 left-6 right-6">
 <div className="rounded-card bg-[var(--bg-light)] p-4 text-center ">
 <p className="mb-2 text-xs font-bold text-[var(--ink-soft)] ">Solutionizing v1.2.0</p>
 <button
 className={`${outlineButtonClass} w-full py-2 text-xs cursor-none`}
 onClick={() => router.push('/dashboard')}
 >
 Go to Homepage
 </button>
 </div>
 </div>
 </aside>

 <main className="flex-1 p-6 pb-28 md:ml-72 md:p-10 md:pb-10">
 <PageHeader
 title={
 activeTab === 'overview' ? 'System Overview' :
 activeTab === 'missions' ? 'Mission Control' :
 activeTab === 'flags' ? 'Flag Review Queue' :
 activeTab === 'feedback' ? 'User Feedback' :
 'User Management'
 }
 subtitle={
 activeTab === 'overview' ? 'Monitor platform activity.' :
 activeTab === 'missions' ? 'Moderate mission submissions.' :
 activeTab === 'flags' ? 'Review structured flags.' :
 activeTab === 'feedback' ? 'Review user feedback and bugs.' :
 'Manage platform users.'
 }
 >
 <button className={`${primaryButtonClass} whitespace-nowrap hidden sm:inline-flex cursor-none`} onClick={() => toast.info('All systems operational.')}>System Status</button>
 <button
 className={`${outlineButtonClass} whitespace-nowrap cursor-none`}
 onClick={() => {
 if (activeTab === 'overview') void fetchDashboardData()
 if (activeTab === 'missions') void fetchPendingMissions()
 if (activeTab === 'users') void fetchAllUsers()
 if (activeTab === 'flags') void fetchFlaggedContent()
 if (activeTab === 'feedback') void fetchFeedbackContent()
 }}
 >
 Refresh Data
 </button>
 </PageHeader>

 {isLoading ? (
 activeTab === 'overview' ? (
 <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
 {[1, 2, 3, 4].map((i) => (
 <DashboardCardSkeleton key={i} count={1} variant="stat" />
 ))}
 </div>
 ) : (
 <DashboardCardSkeleton count={1} variant="card" />
 )
 ) : (
 <div key={activeTab} className="animate-[tabEnter_0.22s_ease_forwards]">
 <div className="space-y-10">
 {activeTab === 'overview' ? (
 stats ? (
 <>
 <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
 <StatCard
 label="Total Missions"
 value={stats.totals.missions}
 glyph="ðŸš€"
 colorClass="bg-white "
 glyphColorClass="bg-orange-100 text-orange-600"
 />
 <StatCard
 label="Active Founders"
 value={stats.totals.founders}
 glyph="ðŸ¢"
 colorClass="bg-white "
 glyphColorClass="bg-blue-100 text-blue-600"
 />
 <StatCard
 label="Qualified Testers"
 value={stats.totals.testers}
 glyph="âš¡"
 colorClass="bg-white "
 glyphColorClass="bg-purple-100 text-purple-600"
 />
 <StatCard
 label="Platform Revenue"
 value={`â‚¹${(stats.last30Days.platformRevenue / 100).toLocaleString()}`}
 glyph="ðŸ’°"
 colorClass="bg-white "
 glyphColorClass="bg-emerald-100 text-emerald-600"
 />
 </div>

 <div className="overflow-hidden rounded-panel border border-[var(--border)] bg-white ">
 <div className="flex flex-col gap-2 border-b border-[var(--border)] p-4 sm:p-6 sm:flex-row sm:items-center sm:justify-between ">
 <h3 className="text-lg font-bold text-[var(--ink)] sm:text-xl ">Newest User Registrations</h3>
 <button
 className="text-left text-sm font-bold text-[var(--electric)] hover:underline sm:text-right cursor-none"
 onClick={() => setActiveTab('users')}
 >
 View all users
 </button>
 </div>
 {recentUsers.length > 0 ? (
 <div className="overflow-x-auto">
 <table className="w-full text-left">
 <thead>
 <tr className="bg-[var(--bg)] text-[0.65rem] font-bold uppercase tracking-wider text-[var(--ink-soft)] ">
 <th className="px-4 py-3 sm:px-6 sm:py-4">User</th>
 <th className="px-4 py-3 sm:px-6 sm:py-4">Role</th>
 <th className="hidden px-6 py-4 md:table-cell">Joined On</th>
 <th className="px-4 py-3 sm:px-6 sm:py-4">Status</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[var(--border)] ">
 {recentUsers.map((user) => (
 <tr key={user.id} className="text-sm">
 <td className="px-4 py-4 sm:px-6 text-[var(--ink)] ">
 <div className="flex flex-col gap-0.5">
 <span className="font-bold line-clamp-1">{getUserDisplayName(user)}</span>
 <span className="text-[0.7rem] text-[var(--ink-soft)] line-clamp-1">{user.email}</span>
 </div>
 </td>
 <td className="px-4 py-4 sm:px-6 uppercase">
 <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-bold sm:px-3 sm:py-1 sm:text-xs ${getRoleBadgeClass(user.role)}`}>
 {user.role || 'PENDING'}
 </span>
 </td>
 <td className="hidden px-6 py-4 text-[var(--ink-soft)] md:table-cell ">
 {format(new Date(user.createdAt), 'MMM d, yyyy')}
 </td>
 <td className="px-4 py-4 sm:px-6 text-[var(--ink-soft)] ">
 {user.isSuspended ? (
 <div className="flex items-center gap-1.5 sm:gap-2">
 <div className="h-1.5 w-1.5 rounded-full bg-red-500 sm:h-2 sm:w-2" />
 <span className="text-[0.65rem] font-bold text-red-600 sm:text-xs ">Suspended</span>
 </div>
 ) : (
 <div className="flex items-center gap-1.5 sm:gap-2">
 <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 sm:h-2 sm:w-2" />
 <span className="text-[0.65rem] font-bold text-emerald-600 sm:text-xs ">Active</span>
 </div>
 )}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 ) : (
 <EmptyStatePanel
 title="No users found"
 description="Wait for new platform registrations."
 icon={<Users className="h-16 w-16 text-[var(--ink-soft)] " />}
 />
 )}
 </div>
 </>
 ) : null
 ) : null}

 {activeTab === 'missions' ? (
 <div className="overflow-hidden rounded-panel border border-[var(--border)] bg-white text-[var(--ink)] ">
 <div className="border-b border-[var(--border)] p-6 ">
 <h3 className="text-xl font-bold">Pending Review ({pendingMissions.length})</h3>
 </div>
 {pendingMissionsError ? (
 <div className="p-6">
 <ErrorStatePanel
 title="Failed to load pending missions."
 body="Please refresh and try again."
 onRetry={() => void fetchPendingMissions()}
 />
 </div>
 ) : pendingMissions.length > 0 ? (
 <div className="overflow-x-auto">
 <table className="w-full text-left">
 <thead>
 <tr className="bg-[var(--bg)] text-[0.65rem] font-bold uppercase tracking-wider text-[var(--ink-soft)] ">
 <th className="px-4 py-3 sm:px-6 sm:py-4">Mission</th>
 <th className="hidden px-6 py-4 sm:table-cell">Founder</th>
 <th className="px-4 py-3 sm:px-6 sm:py-4">Reward</th>
 <th className="px-4 py-3 sm:px-6 sm:py-4 text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[var(--border)] ">
 {pendingMissions.map((mission) => (
 <tr key={mission.id} className="text-sm">
 <td className="px-4 py-4 sm:px-6">
 <div className="flex flex-col">
 <span className="font-bold line-clamp-1">{mission.title}</span>
 <span className="text-[0.7rem] text-[var(--ink-soft)] ">{mission.founder?.companyName || 'Unknown Corp'}</span>
 </div>
 </td>
 <td className="hidden px-6 py-4 sm:table-cell text-[0.7rem]">
 <div className="flex flex-col">
 <span className="font-semibold text-[var(--ink)] ">{mission.founder?.displayName}</span>
 </div>
 </td>
 <td className="px-4 py-4 sm:px-6 font-bold text-[var(--electric)] text-[0.7rem] sm:text-sm">
 {mission.totalRewardCoins} <span className="hidden sm:inline">Coins</span>
 </td>
 <td className="px-4 py-4 sm:px-6">
 <div className="flex flex-col items-end gap-1.5 sm:flex-row sm:justify-end sm:gap-2">
 <button
 className="rounded-full bg-emerald-100 px-3 py-1 text-[0.65rem] font-bold text-emerald-700 hover:bg-emerald-200 sm:px-4 sm:text-xs :bg-emerald-900/60 cursor-none"
 onClick={() => handleApproveMission(mission.id, mission.title)}
 disabled={isActionLoading}
 >
 Approve
 </button>
 <button
 className="rounded-full bg-orange-100 px-3 py-1 text-[0.65rem] font-bold text-orange-700 hover:bg-orange-200 sm:px-4 sm:text-xs :bg-orange-900/60 cursor-none"
 onClick={() => handleRejectMission(mission.id, mission.title)}
 disabled={isActionLoading}
 >
 Reject
 </button>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 ) : (
 <EmptyStatePanel
 title="All missions reviewed"
 description="No missions are currently pending review."
 icon={<ClipboardList className="h-16 w-16 text-[var(--ink-soft)] " />}
 />
 )}
 </div>
 ) : null}

 {activeTab === 'users' ? (
 <div className="overflow-hidden rounded-panel border border-[var(--border)] bg-white text-[var(--ink)] ">
 <div className="border-b border-[var(--border)] p-6 ">
 <h3 className="text-xl font-bold">All Users ({userList.length})</h3>
 </div>
 {userList.length > 0 ? (
 <div className="overflow-x-auto">
 <table className="w-full text-left">
 <thead>
 <tr className="bg-[var(--bg)] text-[0.65rem] font-bold uppercase tracking-wider text-[var(--ink-soft)] ">
 <th className="px-4 py-3 sm:px-6 sm:py-4">User</th>
 <th className="px-4 py-3 sm:px-6 sm:py-4">Role</th>
 <th className="hidden px-6 py-4 lg:table-cell">Joined</th>
 <th className="hidden px-6 py-4 sm:table-cell">Status</th>
 <th className="px-4 py-3 sm:px-6 sm:py-4 text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[var(--border)] ">
 {userList.map((userItem) => {
 const isUserActionLoading = userActionLoadingId === userItem.id
 const userDisplayName = getUserDisplayName(userItem)
 const isCoinAwardOpen = coinAwardDraft?.userId === userItem.id
 const isCoinAwardLoading = coinAwardLoadingId === userItem.id
 const coinAwardStatus =
 coinAwardMessage?.userId === userItem.id ? coinAwardMessage : null

 return (
 <Fragment key={userItem.id}>
 <tr className="text-sm">
 <td className="px-4 py-4 sm:px-6">
 <div className="flex flex-col gap-0.5">
 <span className="font-bold line-clamp-1">{userDisplayName}</span>
 <span className="text-[0.7rem] text-[var(--ink-soft)] line-clamp-1">{userItem.email}</span>
 {userItem.isSuspended ? (
 <span className="inline-flex w-fit rounded-full bg-red-100 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-red-700 ">
 Suspended
 </span>
 ) : null}
 </div>
 </td>
 <td className="px-4 py-4 sm:px-6 uppercase">
 <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-bold sm:px-3 sm:py-1 sm:text-xs ${getRoleBadgeClass(userItem.role)}`}>
 {userItem.role || 'PENDING'}
 </span>
 </td>
 <td className="hidden px-6 py-4 text-[var(--ink-soft)] lg:table-cell ">
 {format(new Date(userItem.createdAt), 'MMM d, yyyy')}
 </td>
 <td className="hidden px-6 py-4 sm:table-cell">
 <div className="flex flex-col gap-1">
 {userItem.founderProfile || userItem.testerProfile ? (
 <span className="flex items-center gap-1 text-[0.65rem] font-bold text-emerald-600 sm:text-xs ">
 <div className="h-1 w-1 rounded-full bg-emerald-500 sm:h-1.5 sm:w-1.5" />
 Completed
 </span>
 ) : (
 <span className="flex items-center gap-1 text-[0.65rem] font-bold text-orange-600 sm:text-xs ">
 <div className="h-1 w-1 rounded-full bg-orange-500 sm:h-1.5 sm:w-1.5" />
 Incomplete
 </span>
 )}
 </div>
 </td>
 <td className="px-4 py-4 sm:px-6 text-right">
 <div className="flex flex-col items-end gap-2">
 <button
 className={`inline-flex items-center gap-2 px-3 py-1.5 text-[0.65rem] sm:px-4 sm:py-2 sm:text-xs ${primaryButtonClass} cursor-none`}
 onClick={() => handleOpenCoinAward(userItem.id)}
 >
 Award Coins
 </button>
 {userItem.isSuspended ? (
 <button
 className={`inline-flex items-center gap-2 px-3 py-1.5 text-[0.65rem] sm:px-4 sm:py-2 sm:text-xs ${outlineButtonClass} cursor-none`}
 disabled={isUserActionLoading}
 onClick={() => void handleUnsuspendUser(userItem.id)}
 >
 {isUserActionLoading ? <SpinnerIcon /> : null}
 Unsuspend
 </button>
 ) : null}
 {coinAwardStatus ? (
 <p className={`max-w-56 text-[0.7rem] font-semibold ${coinAwardStatus.type === 'success' ? 'text-emerald-600 ' : 'text-red-600 '}`}>
 {coinAwardStatus.text}
 </p>
 ) : null}
 </div>
 </td>
 </tr>
 {isCoinAwardOpen && coinAwardDraft ? (
 <tr className="bg-[var(--bg)] text-sm ">
 <td colSpan={5} className="px-4 pb-5 sm:px-6">
 <div className="rounded-[1.5rem] border border-[var(--border)] bg-white p-4 ">
 <div className="mb-4">
 <h4 className="font-bold text-[var(--ink)] ">Award coins to {userDisplayName}</h4>
 <p className="mt-1 text-xs text-[var(--ink-soft)] ">
 Add a positive coin amount and a clear admin note.
 </p>
 </div>
 <div className="grid gap-4 md:grid-cols-[minmax(0,180px),1fr]">
 <label className="block">
 <span className="mb-2 block text-[0.65rem] font-bold uppercase tracking-wider text-[var(--ink-soft)] ">
 Coin amount
 </span>
 <input
 type="number"
 min={1}
 step={1}
 value={coinAwardDraft.amount}
 onChange={(event) =>
 setCoinAwardDraft((current) =>
 current ? { ...current, amount: event.target.value } : current
 )
 }
 className={`${textFieldClass} cursor-none`}
 placeholder="100"
 />
 </label>
 <label className="block">
 <span className="mb-2 block text-[0.65rem] font-bold uppercase tracking-wider text-[var(--ink-soft)] ">
 Note
 </span>
 <input
 value={coinAwardDraft.note}
 onChange={(event) =>
 setCoinAwardDraft((current) =>
 current ? { ...current, note: event.target.value } : current
 )
 }
 className={textFieldClass}
 placeholder="Reason for awarding coins"
 />
 <p className="mt-1 text-xs text-[var(--ink-soft)] ">Minimum 10 characters</p>
 </label>
 </div>
 <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
 <button
 className={`px-4 py-2 text-xs ${mutedButtonClass} cursor-none`}
 disabled={isCoinAwardLoading}
 onClick={() => {
 setCoinAwardDraft(null)
 setCoinAwardMessage(null)
 }}
 >
 Cancel
 </button>
 <button
 className={`inline-flex items-center gap-2 px-4 py-2 text-xs ${primaryButtonClass} cursor-none`}
 disabled={isCoinAwardLoading}
 onClick={() => void handleConfirmCoinAward()}
 >
 {isCoinAwardLoading ? <SpinnerIcon /> : null}
 Confirm Award
 </button>
 </div>
 </div>
 </td>
 </tr>
 ) : null}
 </Fragment>
 )
 })}
 </tbody>
 </table>
 </div>
 ) : (
 <EmptyStatePanel
 title="No users found"
 description="Platform has no registered users."
 icon={<Users className="h-16 w-16 text-[var(--ink-soft)] " />}
 />
 )}
 </div>
 ) : null}

 {activeTab === 'flags' ? (
 <div className="overflow-hidden rounded-panel border border-[var(--border)] bg-white text-[var(--ink)] ">
 <div className="border-b border-[var(--border)] p-6 ">
 <h3 className="text-xl font-bold">Flags Needing Attention ({totalFlagReports})</h3>
 </div>
 {flaggedItems.length > 0 ? (
 <div className="space-y-4 p-6">
 {flaggedItems.map((group) => (
 <article
 key={group.missionId}
 className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--bg-light)] p-5 "
 >
 <div className="flex flex-col gap-3 border-b border-[var(--border-strong)] pb-4 md:flex-row md:items-start md:justify-between">
 <div className="space-y-2">
 <div className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[var(--ink-soft)] ">
 Mission signals
 </div>
 <Link
 href={`/mission/status/${group.missionId}`}
 className="text-lg font-bold text-[var(--ink)] hover:text-[var(--electric)]  cursor-none"
 >
 {group.missionTitle ?? 'Untitled mission'}
 </Link>
 </div>
 {group.missionStatus ? <MissionStatusBadge status={group.missionStatus} /> : null}
 </div>

 <div className="mt-5 space-y-4">
 {group.flags.map((report) => {
 const isPending = report.status === 'PENDING'
 const isResolvingThisReport = reportResolutionDraft?.reportId === report.id
 const isReportActionLoading = reportActionLoadingId === report.id

 return (
 <div
 key={report.id}
 className="rounded-[1.5rem] border border-[var(--border)] bg-white p-4 "
 >
 <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
 <div className="space-y-2">
 <div className="flex flex-wrap items-center gap-2">
 <span className="text-sm font-bold text-[var(--ink)] ">
 {report.reporterDisplayName ?? 'Unknown reporter'}
 </span>
 <ReportStatusBadge status={report.status} />
 </div>
 <p className="text-sm font-semibold text-[var(--ink-soft)] ">
 {report.reporterRole} flagged {report.targetRole.toLowerCase()} â€¢ {getFlagReasonLabel(report.reason)}
 </p>
 <p className="text-xs text-[var(--ink-soft)] ">
 Target: {report.targetDisplayName ?? 'Unknown user'}
 </p>
 <p className="text-xs text-[var(--ink-soft)] ">
 Reported {format(new Date(report.createdAt), 'MMM d, yyyy â€¢ HH:mm')}
 </p>
 {report.details ? (
 <p className="text-sm italic text-[var(--ink-soft)] ">&quot;{report.details}&quot;</p>
 ) : null}
 {report.resolutionNote ? (
 <p className="text-xs text-[var(--ink-soft)] ">Admin note: {report.resolutionNote}</p>
 ) : null}
 </div>

 {isPending ? (
 <div className="flex items-center gap-2 text-xs font-bold">
 <button
 className="text-emerald-700 hover:underline  cursor-none"
 onClick={() => handleOpenReportResolution(report.id, 'RESOLVED')}
 >
 Resolve
 </button>
 <span className="text-[#d9d2cb] ">|</span>
 <button
 className="text-[var(--ink-soft)] hover:underline  cursor-none"
 onClick={() => handleOpenReportResolution(report.id, 'DISMISSED')}
 >
 Dismiss
 </button>
 </div>
 ) : null}
 </div>

 {isResolvingThisReport && reportResolutionDraft ? (
 <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--cream)] p-4 ">
 <div className="mb-2 text-sm font-bold text-[var(--ink)] ">
 {reportResolutionDraft.status === 'RESOLVED'
 ? 'Resolve this flag?'
 : 'Dismiss this flag?'}
 </div>
 <textarea
 rows={2}
 value={reportResolutionDraft.note}
 onChange={(event) =>
 setReportResolutionDraft((current) =>
 current
 ? {
 ...current,
 note: event.target.value,
 }
 : current
 )
 }
 className={`${textFieldClass} resize-none cursor-none`}
 placeholder="Optional note"
 />
 {reportResolutionError ? (
 <p className="mt-2 text-sm text-red-600">{reportResolutionError}</p>
 ) : null}
 <div className="mt-3 flex flex-wrap items-center gap-3">
 <button
 className={`px-4 py-2 text-xs ${mutedButtonClass} cursor-none`}
 onClick={closeReportResolution}
 >
 Cancel
 </button>
 <button
 className={`inline-flex items-center gap-2 px-4 py-2 text-xs ${primaryButtonClass} cursor-none`}
 disabled={isReportActionLoading}
 onClick={() => void handleConfirmReportResolution()}
 >
 {isReportActionLoading ? <SpinnerIcon /> : null}
 {reportResolutionDraft.status === 'RESOLVED'
 ? 'Confirm Resolve'
 : 'Confirm Dismiss'}
 </button>
 </div>
 </div>
 ) : null}
 </div>
 )
 })}
 </div>
 </article>
 ))}
 </div>
 ) : (
 <EmptyStatePanel
 title="Clear of flags"
 description="No structured mission flags have been submitted recently."
 icon={<Flag className="h-16 w-16 text-[var(--ink-soft)] " />}
 />
 )}
 </div>
 ) : null}

 {activeTab === 'feedback' ? (
 <div className="overflow-hidden rounded-panel border border-[var(--border)] bg-white text-[var(--ink)] ">
 <div className="border-b border-[var(--border)] p-6 ">
 <h3 className="text-xl font-bold">Feedback Submissions ({feedbackItems.length})</h3>
 </div>
 {feedbackItems.length > 0 ? (
 <div className="overflow-x-auto">
 <table className="w-full text-left">
 <thead>
 <tr className="bg-[var(--bg)] text-[0.65rem] font-bold uppercase tracking-wider text-[var(--ink-soft)] ">
 <th className="px-4 py-3 sm:px-6 sm:py-4">User</th>
 <th className="px-4 py-3 sm:px-6 sm:py-4">Category</th>
 <th className="px-4 py-3 sm:px-6 sm:py-4">Message</th>
 <th className="hidden px-6 py-4 md:table-cell">Page</th>
 <th className="hidden px-6 py-4 lg:table-cell">Date</th>
 <th className="px-4 py-3 sm:px-6 sm:py-4 text-right">Screenshot</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[var(--border)] ">
 {feedbackItems.map((item) => (
 <tr key={item.id} className="text-sm">
 <td className="px-4 py-4 sm:px-6 text-[var(--ink)] ">
 <span className="font-bold line-clamp-1">{item.user?.email || 'Anonymous'}</span>
 </td>
 <td className="px-4 py-4 sm:px-6">
 <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[0.65rem] font-bold text-gray-700 ">
 {item.category}
 </span>
 </td>
 <td className="px-4 py-4 sm:px-6">
 <p className="line-clamp-2 text-xs text-[var(--ink-soft)] ">{item.message}</p>
 </td>
 <td className="hidden px-6 py-4 text-xs text-[var(--ink-soft)] md:table-cell ">
 <span className="line-clamp-1 max-w-[150px]">{item.page}</span>
 </td>
 <td className="hidden px-6 py-4 text-xs text-[var(--ink-soft)] lg:table-cell ">
 {format(new Date(item.createdAt), 'MMM d, yyyy HH:mm')}
 </td>
 <td className="px-4 py-4 sm:px-6 text-right">
 {item.screenshotUrl ? (
 <button
 onClick={() => setSelectedImage(item.screenshotUrl)}
 className="text-xs font-bold text-[var(--electric)] hover:underline cursor-none"
 >
 View
 </button>
 ) : (
 <span className="text-xs text-[var(--ink-soft)] ">None</span>
 )}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 ) : (
 <EmptyStatePanel
 title="No feedback yet"
 description="No user feedback has been submitted."
 icon={<MessageSquare className="h-16 w-16 text-[var(--ink-soft)] " />}
 />
 )}
 </div>
 ) : null}
 </div>
 </div>
 )}
 </main>

 <nav className="fixed bottom-4 left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center justify-between rounded-panel border border-[var(--border)] bg-white/95 px-2 py-2 shadow-[0_24px_60px_-46px_rgba(26,22,37,0.28)] backdrop-blur md:hidden">
 {adminNavItems.map((item) => {
 const Icon = item.icon
 const isActive = activeTab === item.id

 return (
 <button
 key={item.id}
 type="button"
 onClick={() => setActiveTab(item.id)}
 className={`cursor-none flex min-w-0 flex-1 flex-col items-center gap-2 rounded-card px-2 py-2 transition ${
 isActive
 ? 'bg-[var(--electric-dim)] text-[var(--electric)]'
 : 'text-[var(--ink-soft)] hover:bg-[var(--bg-light)]'
 }`}
 >
 <div
 className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
 isActive ? 'bg-[var(--electric-mid)] text-[var(--electric)]' : 'bg-[var(--bg-light)] text-[var(--ink-soft)]'
 }`}
 >
 <Icon className="h-5 w-5" />
 </div>
 <span className="text-[0.65rem] font-bold uppercase tracking-[0.18em]">
 {item.label}
 </span>
 </button>
 )
 })}
 </nav>

 {missionDialog ? (
 <ConfirmationDialog
 title={missionDialog.type === 'approve' ? 'Approve this mission?' : 'Reject this mission?'}
 body={
 missionDialog.type === 'approve'
 ? `Approve "${missionDialog.missionTitle}" and make it available to testers.`
 : `Reject "${missionDialog.missionTitle}" and send feedback to the founder.`
 }
 confirmLabel={missionDialog.type === 'approve' ? 'APPROVE MISSION' : 'REJECT MISSION'}
 confirmStyle={missionDialog.type === 'approve' ? 'primary' : 'danger'}
 onCancel={closeMissionDialog}
 onConfirm={() => void handleMissionDialogConfirm()}
 isLoading={isActionLoading}
 errorMessage={missionDialogError}
 >
 {missionDialog.type === 'reject' ? (
 <div className="text-left">
 <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--ink)] ">
 Rejection Reason
 </label>
 <textarea
 value={rejectionReason}
 onChange={(event) => setRejectionReason(event.target.value)}
 rows={4}
 autoFocus
 className={`${textFieldClass} resize-none cursor-none`}
 placeholder="Explain why this mission is being rejected."
 />
 <p className="mt-2 text-xs text-[var(--ink-soft)] ">Minimum 10 characters</p>
 </div>
 ) : null}
 </ConfirmationDialog>
 ) : null}

 {selectedImage ? (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setSelectedImage(null)}>
 <div className="relative flex max-h-full max-w-full items-center justify-center" onClick={(e) => e.stopPropagation()}>
 <img src={selectedImage} alt="Feedback Screenshot" className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl" />
 <button 
 className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-black shadow-lg hover:bg-gray-200 cursor-none" 
 onClick={() => setSelectedImage(null)}
 >
 <span className="sr-only">Close</span>
 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
 </button>
 </div>
 </div>
 ) : null}
 </div>
 </RequireAuth>
 )
}
