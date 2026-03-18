"use client"

import Link from 'next/link'
import { ClipboardList, Flag, LayoutDashboard, Rocket, Settings, Users } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { apiFetch, isApiClientError } from '@/lib/api/client'
import { RequireAuth } from '@/components/RequireAuth'
import {
  BrandMark,
  ConfirmationDialog,
  DashboardCardSkeleton,
  EmptyStatePanel,
  ErrorStatePanel,
  StatCard,
  SidebarNavItem,
  PageHeader,
  primaryButtonClass,
  outlineButtonClass,
  textFieldClass,
} from '@/components/solutionizing/ui'

// Types for Admin Dashboard
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

interface User {
  id: string
  name: string | null
  email: string
  role: string | null
  createdAt: string
  founderProfile: any
  testerProfile: any
}

interface FlaggedItem {
  id: string
  missionId: string
  missionTitle: string
  reason: string
  reporterName: string
  createdAt: string
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED'
}

interface UserListResponse {
  data: User[]
  pagination: {
    total: number
    totalPages: number
    page: number
    limit: number
  }
}

type MissionDialogState =
  | { type: 'approve'; missionId: string; missionTitle: string }
  | { type: 'reject'; missionId: string; missionTitle: string }

const overviewSidebarProps = { glyph: <LayoutDashboard className="h-4 w-4" /> }
const missionsSidebarProps = { glyph: <Rocket className="h-4 w-4" /> }
const usersSidebarProps = { glyph: <Users className="h-4 w-4" /> }
const flagsSidebarProps = { glyph: <Flag className="h-4 w-4" /> }
const settingsSidebarProps = { glyph: <Settings className="h-4 w-4" /> }

const adminNavItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, sidebarProps: overviewSidebarProps },
  { id: 'missions', label: 'Missions', icon: Rocket, sidebarProps: missionsSidebarProps },
  { id: 'users', label: 'Users', icon: Users, sidebarProps: usersSidebarProps },
  { id: 'flags', label: 'Flags', icon: Flag, sidebarProps: flagsSidebarProps },
] as const

type AdminTab = (typeof adminNavItems)[number]['id']

export default function AdminDashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentUsers, setRecentUsers] = useState<User[]>([])
  const [pendingMissions, setPendingMissions] = useState<any[]>([])
  const [flaggedItems, setFlaggedItems] = useState<FlaggedItem[]>([])
  const [userList, setUserList] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')
  const [missionDialog, setMissionDialog] = useState<MissionDialogState | null>(null)
  const [missionDialogError, setMissionDialogError] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [statsRes, usersRes] = await Promise.all([
        apiFetch<DashboardStats>('/api/v1/admin/stats'),
        apiFetch<UserListResponse>('/api/v1/admin/users?limit=5'),
      ])

      setStats(statsRes)
      setRecentUsers(usersRes.data)
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
      const res = await apiFetch<any[]>('/api/v1/admin/missions/pending')
      setPendingMissions(res)
    } catch (err) {
      console.error('Failed to fetch pending missions', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchAllUsers = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await apiFetch<UserListResponse>('/api/v1/admin/users')
      setUserList(res.data)
    } catch (err) {
      console.error('Failed to fetch users', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchFlaggedContent = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await apiFetch<FlaggedItem[]>('/api/v1/admin/flags')
      setFlaggedItems(res)
    } catch (err) {
      console.error('Failed to fetch flagged content', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'overview') fetchDashboardData()
    if (activeTab === 'missions') fetchPendingMissions()
    if (activeTab === 'users') fetchAllUsers()
    if (activeTab === 'flags') fetchFlaggedContent()
  }, [activeTab, fetchDashboardData, fetchPendingMissions, fetchAllUsers, fetchFlaggedContent])

  function closeMissionDialog() {
    setMissionDialog(null)
    setMissionDialogError('')
    setRejectionReason('')
  }

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

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf9f7] p-8">
        <ErrorStatePanel
          title="Dashboard Error"
          body={error}
          onRetry={() => { fetchDashboardData() }}
        />
      </div>
    )
  }

  return (
    <RequireAuth role="ADMIN">
      <div className="flex min-h-screen bg-[#faf9f7]">
        {/* Sidebar */}
        <aside className="fixed bottom-0 left-0 top-0 hidden w-72 border-r border-[#e5e4e0] bg-white p-6 md:block">
          <div className="mb-10 flex items-center gap-3">
            <BrandMark className="w-8 h-8 text-[#d77a57]" />
            <span className="text-xl font-black tracking-tight text-[#1a1625]">Admin Panel</span>
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
            <div className="my-4 border-t border-[#f0efed]" />
            <SidebarNavItem
              {...settingsSidebarProps}
              label="Platform Settings"
              onClick={() => {}}
            />
          </nav>

          <div className="absolute bottom-6 left-6 right-6">
            <div className="rounded-card bg-[#f6f1ec] p-4 text-center">
              <p className="mb-2 text-xs font-bold text-[#8b8797]">Solutionizing v1.2.0</p>
              <button
                className={`${outlineButtonClass} w-full py-2 text-xs`}
                onClick={() => router.push('/')}
              >
                Go to Homepage
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 pb-28 md:ml-72 md:p-10 md:pb-10">
          <PageHeader
            title={
              activeTab === 'overview' ? 'System Overview' :
              activeTab === 'missions' ? 'Mission Control' :
              activeTab === 'flags' ? 'Flagged Content' :
              'User Management'
            }
            subtitle={
              activeTab === 'overview' ? 'Monitor platform activity and manage system resources.' :
              activeTab === 'missions' ? 'Review and moderate mission submissions.' :
              activeTab === 'flags' ? 'Review reports and moderate policy violations.' :
              'Oversee platform users and their activity.'
            }
          >
            <button className={primaryButtonClass}>System Status</button>
            <button className={outlineButtonClass} onClick={() => {
              if (activeTab === 'overview') fetchDashboardData()
              if (activeTab === 'missions') fetchPendingMissions()
              if (activeTab === 'users') fetchAllUsers()
              if (activeTab === 'flags') fetchFlaggedContent()
            }}>Refresh Data</button>
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
            <div className="space-y-10">
              {activeTab === 'overview' && stats && (
                <>
                  {/* Stats Grid */}
                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                      label="Total Missions"
                      value={stats.totals.missions}
                      glyph="🚀"
                      colorClass="bg-white"
                      glyphColorClass="bg-orange-100 text-orange-600"
                    />
                    <StatCard
                      label="Active Founders"
                      value={stats.totals.founders}
                      glyph="🏢"
                      colorClass="bg-white"
                      glyphColorClass="bg-blue-100 text-blue-600"
                    />
                    <StatCard
                      label="Qualified Testers"
                      value={stats.totals.testers}
                      glyph="⚡"
                      colorClass="bg-white"
                      glyphColorClass="bg-purple-100 text-purple-600"
                    />
                    <StatCard
                      label="Platform Revenue"
                      value={`₹${(stats.last30Days.platformRevenue / 100).toLocaleString()}`}
                      glyph="💰"
                      colorClass="bg-white"
                      glyphColorClass="bg-emerald-100 text-emerald-600"
                    />
                  </div>

                  {/* Recent Users Table */}
                  <div className="rounded-panel border border-[#e5e4e0] bg-white overflow-hidden">
                    <div className="border-b border-[#e5e4e0] p-6 flex items-center justify-between">
                      <h3 className="text-xl font-bold text-[#1a1625]">Newest User Registrations</h3>
                      <button className="text-sm font-bold text-[#d77a57] hover:underline" onClick={() => setActiveTab('users')}>
                        View all users
                      </button>
                    </div>
                    {recentUsers.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-[#faf9f7] text-xs font-bold uppercase tracking-wider text-[#8b8797]">
                              <th className="px-6 py-4">User</th>
                              <th className="px-6 py-4">Role</th>
                              <th className="px-6 py-4">Joined On</th>
                              <th className="px-6 py-4">Identity Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#f0efed]">
                            {recentUsers.map((user) => (
                              <tr key={user.id} className="text-sm">
                                <td className="px-6 py-4 text-[#1a1625]">
                                  <div className="flex flex-col">
                                    <span className="font-bold">{user.name || 'Incognito User'}</span>
                                    <span className="text-xs text-[#8b8797]">{user.email}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 uppercase">
                                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                                    user.role === 'FOUNDER' ? 'bg-blue-100 text-blue-700' :
                                    user.role === 'TESTER' ? 'bg-purple-100 text-purple-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    {user.role || 'PENDING'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-[#6b687a]">
                                  {format(new Date(user.createdAt), 'MMM d, yyyy')}
                                </td>
                                <td className="px-6 py-4 text-[#6b687a]">
                                  <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                    <span className="text-xs font-bold text-emerald-600">Active</span>
                                  </div>
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
                        icon={<Users className="h-16 w-16 text-[#9b98a8] dark:text-gray-400" />}
                      />
                    )}
                  </div>
                </>
              )}

              {activeTab === 'missions' && (
                <div className="rounded-panel border border-[#e5e4e0] bg-white overflow-hidden text-[#1a1625]">
                  <div className="border-b border-[#e5e4e0] p-6">
                    <h3 className="text-xl font-bold">Pending Review ({pendingMissions.length})</h3>
                  </div>
                  {pendingMissions.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-[#faf9f7] text-xs font-bold uppercase tracking-wider text-[#8b8797]">
                            <th className="px-6 py-4">Mission Details</th>
                            <th className="px-6 py-4">Founder</th>
                            <th className="px-6 py-4">Requested Coins</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f0efed]">
                          {pendingMissions.map((mission) => (
                            <tr key={mission.id} className="text-sm">
                              <td className="px-6 py-4">
                                <div className="flex flex-col">
                                  <span className="font-bold">{mission.title}</span>
                                  <span className="text-xs text-[#8b8797] line-clamp-1">{mission.description}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col">
                                  <span className="font-bold">{mission.founder?.companyName || 'Unknown Corp'}</span>
                                  <span className="text-xs text-[#8b8797]">{mission.founder?.displayName}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 font-bold text-[#d77a57]">
                                {mission.totalRewardCoins} Coins
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-end gap-2">
                                  <button 
                                    className="rounded-full bg-emerald-100 px-4 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-200"
                                    onClick={() => handleApproveMission(mission.id, mission.title)}
                                    disabled={isActionLoading}
                                  >
                                    Approve
                                  </button>
                                  <button 
                                    className="rounded-full bg-orange-100 px-4 py-1 text-xs font-bold text-orange-700 hover:bg-orange-200"
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
                      icon={<ClipboardList className="h-16 w-16 text-[#9b98a8] dark:text-gray-400" />}
                    />
                  )}
                </div>
              )}

              {activeTab === 'users' && (
                <div className="rounded-panel border border-[#e5e4e0] bg-white overflow-hidden text-[#1a1625]">
                  <div className="border-b border-[#e5e4e0] p-6">
                    <h3 className="text-xl font-bold">All Users ({userList.length})</h3>
                  </div>
                  {userList.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-[#faf9f7] text-xs font-bold uppercase tracking-wider text-[#8b8797]">
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Joined On</th>
                            <th className="px-6 py-4">Profile Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f0efed]">
                          {userList.map((userItem) => (
                            <tr key={userItem.id} className="text-sm">
                              <td className="px-6 py-4">
                                <div className="flex flex-col">
                                  <span className="font-bold">{userItem.name || 'Anonymous'}</span>
                                  <span className="text-xs text-[#8b8797]">{userItem.email}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 uppercase">
                                <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                                  userItem.role === 'FOUNDER' ? 'bg-blue-100 text-blue-700' :
                                  userItem.role === 'TESTER' ? 'bg-purple-100 text-purple-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {userItem.role || 'PENDING'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-[#6b687a]">
                                {format(new Date(userItem.createdAt), 'MMM d, yyyy')}
                              </td>
                              <td className="px-6 py-4">
                                {userItem.founderProfile || userItem.testerProfile ? (
                                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    Completed
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-xs font-bold text-orange-600">
                                    <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                                    Incomplete
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button className="text-xs font-bold text-[#d77a57] hover:underline">
                                  Manage Access
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <EmptyStatePanel
                      title="No users found"
                      description="Platform has no registered users."
                      icon={<Users className="h-16 w-16 text-[#9b98a8] dark:text-gray-400" />}
                    />
                  )}
                </div>
              )}

              {activeTab === 'flags' && (
                <div className="rounded-panel border border-[#e5e4e0] bg-white overflow-hidden text-[#1a1625]">
                  <div className="border-b border-[#e5e4e0] p-6">
                    <h3 className="text-xl font-bold">Reports Needing Attention ({flaggedItems.length})</h3>
                  </div>
                  {flaggedItems.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-[#faf9f7] text-xs font-bold uppercase tracking-wider text-[#8b8797]">
                            <th className="px-6 py-4">Reported Mission</th>
                            <th className="px-6 py-4">Reason</th>
                            <th className="px-6 py-4">Reporter</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f0efed]">
                          {flaggedItems.map((item) => (
                            <tr key={item.id} className="text-sm">
                              <td className="px-6 py-4">
                                <Link 
                                  href={`/mission/status/${item.missionId}`}
                                  className="font-bold text-[#d77a57] hover:underline"
                                >
                                  {item.missionTitle}
                                </Link>
                              </td>
                              <td className="px-6 py-4 italic text-[#6b687a]">
                                &quot;{item.reason}&quot;
                              </td>
                              <td className="px-6 py-4 font-medium">
                                {item.reporterName}
                              </td>
                              <td className="px-6 py-4 text-[#8b8797]">
                                {format(new Date(item.createdAt), 'MMM d, HH:mm')}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2 text-xs font-bold">
                                  <button className="text-[#d77a57] hover:underline">Dismiss</button>
                                  <span className="text-[#e5e4e0]">|</span>
                                  <button className="text-red-600 hover:underline">Take Action</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <EmptyStatePanel
                      title="Clear of reports"
                      description="No content has been flagged by users recently."
                      icon={<Flag className="h-16 w-16 text-[#9b98a8] dark:text-gray-400" />}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </main>

        <nav className="fixed bottom-4 left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center justify-between rounded-panel border border-[#e5e4e0] bg-white/95 px-2 py-2 shadow-[0_24px_60px_-46px_rgba(26,22,37,0.28)] backdrop-blur md:hidden">
          {adminNavItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex min-w-0 flex-1 flex-col items-center gap-2 rounded-card px-2 py-2 transition ${
                  isActive
                    ? 'bg-[#f5ede7] text-[#D97757]'
                    : 'text-[#6e6882] hover:bg-[#f8f3ef]'
                }`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                    isActive ? 'bg-[#f3ddd3] text-[#D97757]' : 'bg-[#f3efe8] text-[#6b6477]'
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
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#1a1625]">
                  Rejection Reason
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(event) => setRejectionReason(event.target.value)}
                  rows={4}
                  autoFocus
                  className={`${textFieldClass} resize-none`}
                  placeholder="Explain why this mission is being rejected."
                />
                <p className="mt-2 text-xs text-[#9b98a8]">Minimum 10 characters</p>
              </div>
            ) : null}
          </ConfirmationDialog>
        ) : null}
      </div>
    </RequireAuth>
  )
}
