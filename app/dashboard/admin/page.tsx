"use client"

import Link from 'next/link'
import { ReactNode, useCallback, useEffect, useState } from 'react'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { apiFetch, isApiClientError } from '@/lib/api/client'
import { RequireAuth } from '@/components/RequireAuth'
import { useAuth } from '@/context/AuthContext'
import {
  BrandMark,
  DashboardCardSkeleton,
  EmptyStatePanel,
  ErrorStatePanel,
  StatCard,
  SidebarNavItem,
  PageHeader,
  primaryButtonClass,
  outlineButtonClass,
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

export default function AdminDashboardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentUsers, setRecentUsers] = useState<User[]>([])
  const [pendingMissions, setPendingMissions] = useState<any[]>([])
  const [flaggedItems, setFlaggedItems] = useState<FlaggedItem[]>([])
  const [userList, setUserList] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'missions' | 'users' | 'flags'>('overview')

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

  const handleApproveMission = async (missionId: string) => {
    if (!confirm('Are you sure you want to approve this mission?')) return
    try {
      setIsActionLoading(true)
      await apiFetch(`/api/v1/admin/missions/${missionId}/approve`, { method: 'POST' })
      await fetchPendingMissions()
    } catch (err) {
      alert('Failed to approve mission')
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleRejectMission = async (missionId: string) => {
    const reason = prompt('Please enter the reason for rejection (min 10 chars):')
    if (!reason || reason.length < 10) {
      alert('Rejection reason must be at least 10 characters')
      return
    }
    
    try {
      setIsActionLoading(true)
      await apiFetch(`/api/v1/admin/missions/${missionId}/reject`, { 
        method: 'POST',
        body: JSON.stringify({ reason })
      })
      await fetchPendingMissions()
    } catch (err) {
      alert('Failed to reject mission')
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
        <aside className="fixed bottom-0 left-0 top-0 hidden w-72 border-r border-[#e5e4e0] bg-white p-6 lg:block">
          <div className="mb-10 flex items-center gap-3">
            <BrandMark className="w-8 h-8 text-[#d77a57]" />
            <span className="text-xl font-black tracking-tight text-[#1a1625]">Admin Panel</span>
          </div>

          <nav className="flex flex-col gap-2">
            <SidebarNavItem
              glyph="📊"
              label="Overview"
              active={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
            />
            <SidebarNavItem
              glyph="🚀"
              label="Mission Control"
              active={activeTab === 'missions'}
              onClick={() => setActiveTab('missions')}
            />
            <SidebarNavItem
              glyph="👥"
              label="User Management"
              active={activeTab === 'users'}
              onClick={() => setActiveTab('users')}
            />
            <SidebarNavItem
              glyph="🚩"
              label="Flagged Content"
              active={activeTab === 'flags'}
              onClick={() => setActiveTab('flags')}
            />
            <div className="my-4 border-t border-[#f0efed]" />
            <SidebarNavItem
              glyph="⚙️"
              label="Platform Settings"
              onClick={() => {}}
            />
          </nav>

          <div className="absolute bottom-6 left-6 right-6">
            <div className="rounded-2xl bg-[#f6f1ec] p-4 text-center">
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
        <main className="flex-1 p-6 lg:ml-72 lg:p-10">
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
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <DashboardCardSkeleton key={i} count={1} />
              ))}
            </div>
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
                  <div className="rounded-3xl border border-[#e5e4e0] bg-white overflow-hidden">
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
                      <EmptyStatePanel title="No users found" description="Wait for new platform registrations." />
                    )}
                  </div>
                </>
              )}

              {activeTab === 'missions' && (
                <div className="rounded-3xl border border-[#e5e4e0] bg-white overflow-hidden text-[#1a1625]">
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
                                    onClick={() => handleApproveMission(mission.id)}
                                    disabled={isActionLoading}
                                  >
                                    Approve
                                  </button>
                                  <button 
                                    className="rounded-full bg-orange-100 px-4 py-1 text-xs font-bold text-orange-700 hover:bg-orange-200"
                                    onClick={() => handleRejectMission(mission.id)}
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
                    <EmptyStatePanel title="All missions reviewed" description="No missions are currently pending review." />
                  )}
                </div>
              )}

              {activeTab === 'users' && (
                <div className="rounded-3xl border border-[#e5e4e0] bg-white overflow-hidden text-[#1a1625]">
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
                    <EmptyStatePanel title="No users found" description="Platform has no registered users." />
                  )}
                </div>
              )}

              {activeTab === 'flags' && (
                <div className="rounded-3xl border border-[#e5e4e0] bg-white overflow-hidden text-[#1a1625]">
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
                                  href={`/missions/${item.missionId}`}
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
                    <EmptyStatePanel title="Clear of reports" description="No content has been flagged by users recently." />
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </RequireAuth>
  )
}
