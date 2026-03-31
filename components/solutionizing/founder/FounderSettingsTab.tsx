"use client"

import { ReactNode, useEffect, useState } from 'react'
import { toast } from '@/components/ui/sonner'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { apiFetch, isApiClientError } from '@/lib/api/client'
import { formatCoins, outlineButtonClass, primaryButtonClass, textFieldClass } from '@/components/solutionizing/ui'

const settingsFieldClass = `${textFieldClass} disabled:cursor-not-allowed disabled:border-border-subtle disabled:bg-surface-elevated disabled:text-text-muted disabled:opacity-100`
const transactionDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

interface CoinTransaction {
  id: string
  amount: number
  description: string
  createdAt: string
}

type FounderDifficulty = 'EASY' | 'MEDIUM' | 'HARD'
type NotificationField =
  | 'notifyMissionApproved'
  | 'notifyMissionCompleted'
  | 'notifyTesterFeedback'

interface FounderProfileResponse {
  displayName: string
  companyName: string | null
  defaultDifficulty: FounderDifficulty
  defaultTestersRequired: number
  notifyMissionApproved: boolean
  notifyMissionCompleted: boolean
  notifyTesterFeedback: boolean
}

function ComingSoonBadge() {
  return (
    <span className="inline-flex rounded-full border border-border-subtle bg-surface-elevated px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-text-muted">
      Coming Soon
    </span>
  )
}

function SettingsSectionCard({
  title,
  description,
  comingSoon = false,
  className = '',
  children,
}: {
  title: string
  description: string
  comingSoon?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <section
      className={`rounded-card border border-border-subtle bg-surface p-6 ${className}`}
    >
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-white">{title}</h3>
          <p className="mt-2 max-w-2xl text-sm text-text-muted">{description}</p>
        </div>
        {comingSoon ? <ComingSoonBadge /> : null}
      </div>
      {children}
    </section>
  )
}

function SettingsField({
  label,
  hint,
  comingSoon = false,
  children,
}: {
  label: string
  hint?: string
  comingSoon?: boolean
  children: ReactNode
}) {
  return (
    <label className="block space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-text-muted">{label}</span>
        {comingSoon ? <ComingSoonBadge /> : null}
      </div>
      {children}
      {hint ? <span className="block text-sm text-text-muted">{hint}</span> : null}
    </label>
  )
}

function NotificationToggleRow({
  title,
  description,
  checked,
  disabled = false,
  onToggle,
  ariaLabel,
}: {
  title: string
  description: string
  checked: boolean
  disabled?: boolean
  onToggle: () => void
  ariaLabel?: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-card border border-border-subtle bg-surface-elevated px-4 py-4">
      <div>
        <div className="text-sm font-bold text-white">{title}</div>
        <div className="mt-1 text-sm text-text-muted">{description}</div>
      </div>
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        aria-pressed={checked}
        aria-label={ariaLabel ?? `Toggle ${title} notifications`}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border px-1 transition-colors ${
          checked
            ? 'border-primary bg-primary/30'
            : 'border-border-subtle bg-surface'
        } ${disabled ? 'cursor-not-allowed opacity-70' : ''}`}
      >
        <span
          className={`h-5 w-5 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.4)] transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}

interface FounderSettingsTabProps {
  userName: string
  userEmail: string
  onOpenDeleteModal: () => void
}

export function FounderSettingsTab({
  userName,
  userEmail,
  onOpenDeleteModal,
}: FounderSettingsTabProps) {
  const { user } = useAuth()
  const { darkMode, toggleDarkMode } = useTheme()
  const [displayName, setDisplayName] = useState(user?.founderProfile?.displayName ?? userName)
  const [companyName, setCompanyName] = useState('')
  const [defaultDifficulty, setDefaultDifficulty] = useState<FounderDifficulty>('MEDIUM')
  const [defaultTestersRequired, setDefaultTestersRequired] = useState(10)
  const [notifyMissionApproved, setNotifyMissionApproved] = useState(true)
  const [notifyMissionCompleted, setNotifyMissionCompleted] = useState(true)
  const [notifyTesterFeedback, setNotifyTesterFeedback] = useState(false)
  const [hasLoadedProfile, setHasLoadedProfile] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [profileError, setProfileError] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [missionDefaultsError, setMissionDefaultsError] = useState('')
  const [isSavingMissionDefaults, setIsSavingMissionDefaults] = useState(false)
  const [notificationError, setNotificationError] = useState('')
  const [savingNotificationField, setSavingNotificationField] = useState<NotificationField | null>(null)
  const [transactions, setTransactions] = useState<CoinTransaction[]>([])
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true)
  const [transactionsError, setTransactionsError] = useState('')
  const [isSendingResetLink, setIsSendingResetLink] = useState(false)
  const [passwordResetMessage, setPasswordResetMessage] = useState('')
  const [passwordResetError, setPasswordResetError] = useState('')

  const founderEmail = user?.email ?? userEmail

  function applyFounderProfile(profile: FounderProfileResponse) {
    setDisplayName(profile.displayName)
    setCompanyName(profile.companyName ?? '')
    setDefaultDifficulty(profile.defaultDifficulty)
    setDefaultTestersRequired(profile.defaultTestersRequired)
    setNotifyMissionApproved(profile.notifyMissionApproved)
    setNotifyMissionCompleted(profile.notifyMissionCompleted)
    setNotifyTesterFeedback(profile.notifyTesterFeedback)
  }

  async function patchFounderProfile(body: Partial<FounderProfileResponse>) {
    return apiFetch<FounderProfileResponse>('/api/v1/founder/profile', {
      method: 'PATCH',
      body,
    })
  }

  function setNotificationValue(field: NotificationField, value: boolean) {
    if (field === 'notifyMissionApproved') {
      setNotifyMissionApproved(value)
      return
    }

    if (field === 'notifyMissionCompleted') {
      setNotifyMissionCompleted(value)
      return
    }

    setNotifyTesterFeedback(value)
  }

  function getNotificationValue(field: NotificationField) {
    if (field === 'notifyMissionApproved') {
      return notifyMissionApproved
    }

    if (field === 'notifyMissionCompleted') {
      return notifyMissionCompleted
    }

    return notifyTesterFeedback
  }

  useEffect(() => {
    let isActive = true

    async function loadProfile() {
      setIsLoadingProfile(true)
      setProfileError('')

      try {
        const response = await apiFetch<FounderProfileResponse>('/api/v1/founder/profile')

        if (!isActive) {
          return
        }

        setDisplayName(response.displayName)
        setCompanyName(response.companyName ?? '')
        setDefaultDifficulty(response.defaultDifficulty)
        setDefaultTestersRequired(response.defaultTestersRequired)
        setNotifyMissionApproved(response.notifyMissionApproved)
        setNotifyMissionCompleted(response.notifyMissionCompleted)
        setNotifyTesterFeedback(response.notifyTesterFeedback)
        setMissionDefaultsError('')
        setNotificationError('')
        setHasLoadedProfile(true)
      } catch (error) {
        if (!isActive) {
          return
        }

        const message =
          isApiClientError(error) && error.code === 'NETWORK_ERROR'
            ? 'Check your internet connection'
            : "Couldn't load your profile."

        setProfileError(message)
        setMissionDefaultsError(message)
        setNotificationError(message)
        setHasLoadedProfile(false)
      } finally {
        if (isActive) {
          setIsLoadingProfile(false)
        }
      }
    }

    void loadProfile()

    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    let isActive = true

    async function loadTransactions() {
      setIsLoadingTransactions(true)
      setTransactionsError('')

      try {
        const response = await apiFetch<CoinTransaction[]>('/api/v1/coins/transactions')

        if (!isActive) {
          return
        }

        setTransactions(response)
      } catch (error) {
        if (!isActive) {
          return
        }

        const message =
          isApiClientError(error) && error.code === 'NETWORK_ERROR'
            ? 'Check your internet connection'
            : "Couldn't load your purchase history."

        setTransactionsError(message)
      } finally {
        if (isActive) {
          setIsLoadingTransactions(false)
        }
      }
    }

    void loadTransactions()

    return () => {
      isActive = false
    }
  }, [])

  async function handleChangePassword() {
    if (!founderEmail || isSendingResetLink) {
      return
    }

    setIsSendingResetLink(true)
    setPasswordResetMessage('')
    setPasswordResetError('')

    try {
      await apiFetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        body: {
          email: founderEmail,
        },
        skipSessionHandling: true,
      })

      const successMessage = 'A password reset link has been sent to your email.'
      setPasswordResetMessage(successMessage)
      toast.success(successMessage)
    } catch (error) {
      const message =
        isApiClientError(error) && error.code === 'NETWORK_ERROR'
          ? 'Check your internet connection'
          : 'Something went wrong. Try again.'

      setPasswordResetError(message)
    } finally {
      setIsSendingResetLink(false)
    }
  }

  async function handleSaveProfile() {
    if (isSavingProfile || isLoadingProfile) {
      return
    }

    setIsSavingProfile(true)
    setProfileError('')

    try {
      const response = await patchFounderProfile({
        displayName,
        companyName,
      })

      applyFounderProfile(response)
      setHasLoadedProfile(true)
      toast.success('Profile updated successfully.')
    } catch (error) {
      const message =
        isApiClientError(error) && error.code === 'NETWORK_ERROR'
          ? 'Check your internet connection'
          : isApiClientError(error)
            ? error.message
            : 'Something went wrong. Try again.'

      setProfileError(message)
    } finally {
      setIsSavingProfile(false)
    }
  }

  async function handleSaveMissionDefaults() {
    if (isLoadingProfile || isSavingMissionDefaults || !hasLoadedProfile) {
      return
    }

    setIsSavingMissionDefaults(true)
    setMissionDefaultsError('')

    try {
      const response = await patchFounderProfile({
        defaultDifficulty,
        defaultTestersRequired,
      })

      applyFounderProfile(response)
      setHasLoadedProfile(true)
      toast.success('Mission defaults updated successfully.')
    } catch (error) {
      const message =
        isApiClientError(error) && error.code === 'NETWORK_ERROR'
          ? 'Check your internet connection'
          : isApiClientError(error)
            ? error.message
            : 'Something went wrong. Try again.'

      setMissionDefaultsError(message)
    } finally {
      setIsSavingMissionDefaults(false)
    }
  }

  async function handleNotificationToggle(field: NotificationField) {
    if (isLoadingProfile || savingNotificationField || !hasLoadedProfile) {
      return
    }

    const currentValue = getNotificationValue(field)
    const nextValue = !currentValue

    setNotificationError('')
    setSavingNotificationField(field)
    setNotificationValue(field, nextValue)

    try {
      const response = await patchFounderProfile(
        field === 'notifyMissionApproved'
          ? { notifyMissionApproved: nextValue }
          : field === 'notifyMissionCompleted'
            ? { notifyMissionCompleted: nextValue }
            : { notifyTesterFeedback: nextValue }
      )

      applyFounderProfile(response)
      setHasLoadedProfile(true)
    } catch (error) {
      setNotificationValue(field, currentValue)

      const message =
        isApiClientError(error) && error.code === 'NETWORK_ERROR'
          ? 'Check your internet connection'
          : isApiClientError(error)
            ? error.message
            : 'Something went wrong. Try again.'

      setNotificationError(message)
    } finally {
      setSavingNotificationField(null)
    }
  }

  return (
    <section className="rounded-[1.9rem] border border-border-subtle bg-surface p-4 sm:p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-white">Account Settings</h2>
        <p className="mt-2 max-w-2xl text-sm text-text-muted">
          Manage your founder profile, mission defaults, billing, and notifications from one place.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SettingsSectionCard title="Profile" description="Update the public details attached to your founder account.">
          <div className="space-y-4">
            <SettingsField label="Display Name">
              <input
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                disabled={isLoadingProfile || isSavingProfile}
                className={isLoadingProfile || isSavingProfile ? settingsFieldClass : textFieldClass}
              />
            </SettingsField>
            <SettingsField
              label="Company Name"
              hint="Update the company name attached to your founder account."
            >
              <input
                type="text"
                value={companyName}
                placeholder="Enter your company name"
                onChange={(event) => setCompanyName(event.target.value)}
                disabled={isLoadingProfile || isSavingProfile}
                className={isLoadingProfile || isSavingProfile ? settingsFieldClass : textFieldClass}
              />
            </SettingsField>
            {profileError ? <p className="text-sm text-red-400">{profileError}</p> : null}
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={isLoadingProfile || isSavingProfile}
              className={`px-5 py-3 text-sm ${primaryButtonClass}`}
            >
              {isSavingProfile ? 'Saving Changes...' : isLoadingProfile ? 'Loading Profile...' : 'Save Changes'}
            </button>
          </div>
        </SettingsSectionCard>

        <SettingsSectionCard
          title="Account Security"
          description="Monitor account access and prepare upcoming security controls."
        >
          <div className="space-y-4">
            <SettingsField label="Email Address" hint="To change your email contact support.">
              <input type="email" value={founderEmail} readOnly className={textFieldClass} />
            </SettingsField>
            <SettingsField label="Last Login" comingSoon>
              <input
                type="text"
                value="Last login details will appear here."
                readOnly
                disabled
                className={settingsFieldClass}
              />
            </SettingsField>
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleChangePassword}
                disabled={!founderEmail || isSendingResetLink}
                className={`px-5 py-3 text-sm ${outlineButtonClass}`}
              >
                {isSendingResetLink ? 'Sending Reset Link...' : 'Change Password'}
              </button>
              {passwordResetMessage ? <p className="text-sm text-emerald-400">{passwordResetMessage}</p> : null}
              {passwordResetError ? (
                <p className="text-sm text-red-400">{passwordResetError}</p>
              ) : null}
            </div>
          </div>
        </SettingsSectionCard>

        <SettingsSectionCard
          title="Mission Defaults"
          description="Choose the defaults that should be pre-filled when you start a new mission."
        >
          <div className="space-y-5">
            <SettingsField label="Default Difficulty">
              <select
                value={defaultDifficulty}
                onChange={(event) => setDefaultDifficulty(event.target.value as FounderDifficulty)}
                disabled={isLoadingProfile || isSavingMissionDefaults || !hasLoadedProfile}
                className={isLoadingProfile || isSavingMissionDefaults || !hasLoadedProfile ? settingsFieldClass : textFieldClass}
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </SettingsField>
            <SettingsField label="Default Number Of Testers" hint="Choose how many testers should be pre-filled by default.">
              <div className="rounded-card border border-border-subtle bg-surface-elevated p-4">
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="font-bold text-white">{defaultTestersRequired} testers</span>
                  <span className="text-text-muted">5 to 50</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={defaultTestersRequired}
                  onChange={(event) => setDefaultTestersRequired(Number(event.target.value))}
                  disabled={isLoadingProfile || isSavingMissionDefaults || !hasLoadedProfile}
                  className="w-full accent-primary"
                />
                <div className="mt-3 flex justify-between text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                  <span>Lean</span>
                  <span>Balanced</span>
                  <span>Broad</span>
                </div>
              </div>
            </SettingsField>
            {missionDefaultsError ? <p className="text-sm text-red-400">{missionDefaultsError}</p> : null}
            <button
              type="button"
              onClick={handleSaveMissionDefaults}
              disabled={isLoadingProfile || isSavingMissionDefaults || !hasLoadedProfile}
              className={`px-5 py-3 text-sm ${primaryButtonClass}`}
            >
              {isSavingMissionDefaults ? 'Saving Defaults...' : isLoadingProfile ? 'Loading Defaults...' : 'Save Defaults'}
            </button>
          </div>
        </SettingsSectionCard>

        <SettingsSectionCard
          title="Billing"
          description="Review coin purchases and future billing activity for your founder account."
        >
          <div className="rounded-[1.75rem] border border-dashed border-border-subtle bg-surface-elevated p-6">
            <div className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-text-muted">Coin Purchase History</div>
            <div className="mt-4 rounded-card border border-border-subtle bg-surface">
              {isLoadingTransactions ? (
                <div className="px-4 py-8 text-center text-sm text-text-muted">Loading purchase history...</div>
              ) : transactionsError ? (
                <div className="px-4 py-8 text-center text-sm text-red-400">{transactionsError}</div>
              ) : transactions.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-text-muted">
                  Your purchase history will appear here
                </div>
              ) : (
                <ul className="divide-y divide-border-subtle">
                  {transactions.map((transaction) => (
                    <li
                      key={transaction.id}
                      className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="text-sm font-bold text-white">{transaction.description}</div>
                        <div className="mt-1 text-sm text-text-muted">
                          {transactionDateFormatter.format(new Date(transaction.createdAt))}
                        </div>
                      </div>
                      <div
                        className={`text-sm font-bold ${transaction.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                      >
                        {transaction.amount >= 0 ? '+' : '-'}
                        {formatCoins(Math.abs(transaction.amount))} coins
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </SettingsSectionCard>

        <SettingsSectionCard
          title="Notifications"
          description="Control the founder alerts you want to receive as missions move forward."
        >
          <div className="space-y-3">
            <NotificationToggleRow
              title="Dark Mode"
              description="Switch between light and dark interface"
              checked={darkMode}
              onToggle={toggleDarkMode}
              ariaLabel="Toggle dark mode"
            />
            {notificationError ? <p className="text-sm text-red-400">{notificationError}</p> : null}
            <NotificationToggleRow
              title="Mission approved"
              description="Receive a notification when your mission clears review."
              checked={notifyMissionApproved}
              disabled={isLoadingProfile || savingNotificationField !== null || !hasLoadedProfile}
              onToggle={() => void handleNotificationToggle('notifyMissionApproved')}
            />
            <NotificationToggleRow
              title="Mission completed"
              description="Receive a notification when all testers finish a mission."
              checked={notifyMissionCompleted}
              disabled={isLoadingProfile || savingNotificationField !== null || !hasLoadedProfile}
              onToggle={() => void handleNotificationToggle('notifyMissionCompleted')}
            />
            <NotificationToggleRow
              title="Tester submits feedback"
              description="Receive a notification when new tester feedback lands."
              checked={notifyTesterFeedback}
              disabled={isLoadingProfile || savingNotificationField !== null || !hasLoadedProfile}
              onToggle={() => void handleNotificationToggle('notifyTesterFeedback')}
            />
          </div>
        </SettingsSectionCard>

        <SettingsSectionCard
          title="Danger Zone"
          description="Once you delete your account, there is no going back. Please be certain."
          className="border-red-900/60 bg-red-950/20 xl:col-span-2"
        >
          <button
            onClick={onOpenDeleteModal}
            className="rounded-xl bg-red-700 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-red-600"
          >
            DELETE ACCOUNT
          </button>
        </SettingsSectionCard>
      </div>
    </section>
  )
}
