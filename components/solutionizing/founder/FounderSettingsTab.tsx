"use client"

import { ReactNode, useEffect, useState } from 'react'
import { ArrowRightLeft } from 'lucide-react'
import { toast } from '@/components/ui/sonner'
import { useAuth } from '@/context/AuthContext'
import { apiFetch, isApiClientError } from '@/lib/api/client'
import { formatCoins } from '@/components/solutionizing/ui'

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
    <span className="inline-flex rounded-full border border-[var(--border-strong)] bg-[var(--bg-light)] px-3 py-1 text-[0.65rem] font-[family-name:var(--font-dm-mono)] uppercase tracking-[0.18em] text-[var(--ink-soft)]">
      COMING SOON
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
    <section className={`rounded-[14px] border border-[var(--border)] bg-[var(--bg-light)] p-6 ${className}`}>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-col">
            <h3 className="text-lg font-[family-name:var(--font-fraunces)] italic font-normal text-[var(--ink)] mb-1 mt-0">{title}</h3>
            <div className="w-8 h-[3px] rounded-full bg-[var(--electric)] mt-1" />
          </div>
          <p className="text-sm text-[var(--ink-soft)] max-w-[36rem] m-0">{description}</p>
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
        <span className="text-[0.68rem] font-[family-name:var(--font-dm-mono)] uppercase tracking-[0.15em] text-[var(--ink-soft)]">{label}</span>
        {comingSoon ? <ComingSoonBadge /> : null}
      </div>
      {children}
      {hint ? <span className="block text-sm text-[var(--ink-soft)]">{hint}</span> : null}
    </label>
  )
}

function NotificationToggleRow({ title, description, checked, disabled = false, onToggle, ariaLabel }: { title: string; description: string; checked: boolean; disabled?: boolean; onToggle: () => void; ariaLabel?: string }) {
  return (
    <div className="rounded-[10px] border border-[var(--border)] bg-[var(--cream)] px-4 py-4 flex items-center justify-between gap-4">
      <div>
        <div className="text-sm font-semibold text-[var(--ink)]">{title}</div>
        <div className="mt-1 text-sm text-[var(--ink-soft)]">{description}</div>
      </div>
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        aria-pressed={checked}
        aria-label={ariaLabel ?? `Toggle ${title} notifications`}
        className={`cursor-none flex items-center p-0 transition-[background,border-color] duration-200 rounded-full h-6 w-11 ${checked ? 'border border-[var(--electric)] bg-[var(--electric-dim)]' : 'border border-[var(--border-strong)] bg-[var(--bg-light)]'}`}
        style={{ opacity: disabled ? 0.6 : 1 }}
      >
        <span
          style={{
            height: '16px', width: '16px', borderRadius: '50%',
            background: checked ? 'var(--electric)' : 'var(--ink-soft)',
            transition: 'transform 0.2s, background 0.2s',
            transform: checked ? 'translateX(20px)' : 'translateX(2px)'
          }}
        />
      </button>
    </div>
  )
}

interface FounderSettingsTabProps {
  userName: string
  userEmail: string
  onOpenDeleteModal: () => void
  onSwitchToTester?: () => void
  isSwitchingToTester?: boolean
}

export function FounderSettingsTab({
  userName,
  userEmail,
  onOpenDeleteModal,
  onSwitchToTester,
  isSwitchingToTester = false,
}: FounderSettingsTabProps) {
  const { user, signOut } = useAuth()
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
    <div className="animate-[tabEnter_0.22s_ease_forwards]" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        <SettingsSectionCard title="Profile" description="Update the public details attached to your founder account.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <SettingsField label="Display Name">
              <input className="cursor-none"
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                disabled={isLoadingProfile || isSavingProfile}
                style={{ background: 'var(--bg-light)', border: '1.5px solid var(--border)', borderRadius: '8px', padding: '0.7rem 1rem', fontFamily: 'Satoshi, sans-serif', fontSize: '0.9rem', color: 'var(--ink)', outline: 'none', width: '100%', cursor: 'none', transition: 'border-color 0.2s', opacity: (isLoadingProfile || isSavingProfile || isSavingMissionDefaults || !hasLoadedProfile || false) ? 0.5 : 1 }}
              />
            </SettingsField>
            <SettingsField
              label="Company Name"
              hint="Update the company name attached to your founder account."
            >
              <input className="cursor-none"
                type="text"
                value={companyName}
                placeholder="Enter your company name"
                onChange={(event) => setCompanyName(event.target.value)}
                disabled={isLoadingProfile || isSavingProfile}
                style={{ background: 'var(--bg-light)', border: '1.5px solid var(--border)', borderRadius: '8px', padding: '0.7rem 1rem', fontFamily: 'Satoshi, sans-serif', fontSize: '0.9rem', color: 'var(--ink)', outline: 'none', width: '100%', cursor: 'none', transition: 'border-color 0.2s', opacity: (isLoadingProfile || isSavingProfile || isSavingMissionDefaults || !hasLoadedProfile || false) ? 0.5 : 1 }}
              />
            </SettingsField>
            {profileError ? <p className="text-sm text-red-400">{profileError}</p> : null}
            <button className="cursor-none"
              type="button"
              onClick={handleSaveProfile}
              disabled={isLoadingProfile || isSavingProfile}
              style={{ background: 'var(--electric)', color: 'var(--cream)', border: 'none', borderRadius: '100px', padding: '0.65rem 1.6rem', fontFamily: 'Satoshi, sans-serif', fontWeight: 700, fontSize: '0.9rem', cursor: 'none', opacity: (isLoadingProfile || isSavingProfile || isSavingMissionDefaults || !hasLoadedProfile) ? 0.6 : 1 }}
            >
              {isSavingProfile ? 'Saving Changes...' : isLoadingProfile ? 'Loading Profile...' : 'Save Changes'}
            </button>
          </div>
        </SettingsSectionCard>

        <SettingsSectionCard
          title="Account Security"
          description="Monitor account access and prepare upcoming security controls."
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <SettingsField label="Email Address" hint="To change your email contact support.">
              <input className="cursor-none" type="email" value={founderEmail} readOnly style={{ background: 'var(--bg-light)', border: '1.5px solid var(--border)', borderRadius: '8px', padding: '0.7rem 1rem', fontFamily: 'Satoshi, sans-serif', fontSize: '0.9rem', color: 'var(--ink)', outline: 'none', width: '100%', cursor: 'none', transition: 'border-color 0.2s' }} />
            </SettingsField>
            <SettingsField label="Last Login" comingSoon>
              <input className="cursor-none"
                type="text"
                value="Last login details will appear here."
                readOnly
                disabled
                style={{ background: 'var(--bg-light)', border: '1.5px solid var(--border)', borderRadius: '8px', padding: '0.7rem 1rem', fontFamily: 'Satoshi, sans-serif', fontSize: '0.9rem', color: 'var(--ink)', outline: 'none', width: '100%', cursor: 'none', transition: 'border-color 0.2s', opacity: 0.5 }}
              />
            </SettingsField>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button className="cursor-none"
                type="button"
                onClick={handleChangePassword}
                disabled={!founderEmail || isSendingResetLink}
                style={{ background: 'transparent', border: '1px solid var(--border-strong)', color: 'var(--ink)', borderRadius: '100px', padding: '0.5rem 1.1rem', fontFamily: 'Satoshi, sans-serif', fontWeight: 600, fontSize: '0.82rem', cursor: 'none', opacity: (!founderEmail || isSendingResetLink) ? 0.6 : 1 }}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <SettingsField label="Default Difficulty">
              <select className="cursor-none"
                value={defaultDifficulty}
                onChange={(event) => setDefaultDifficulty(event.target.value as FounderDifficulty)}
                disabled={isLoadingProfile || isSavingMissionDefaults || !hasLoadedProfile}
                style={{ background: 'var(--bg-light)', border: '1.5px solid var(--border)', borderRadius: '8px', padding: '0.7rem 1rem', fontFamily: 'Satoshi, sans-serif', fontSize: '0.9rem', color: 'var(--ink)', outline: 'none', width: '100%', cursor: 'none', transition: 'border-color 0.2s', opacity: (isLoadingProfile || isSavingProfile || isSavingMissionDefaults || !hasLoadedProfile || false) ? 0.5 : 1 }}
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </SettingsField>
            <SettingsField label="Default Number Of Testers" hint="Choose how many testers should be pre-filled by default.">
              <div style={{ background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Satoshi, sans-serif', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{defaultTestersRequired} testers</span>
                  <span style={{ color: 'var(--ink-soft)' }}>5 to 50</span>
                </div>
                <input className="cursor-none"
                  type="range"
                  min="5"
                  max="50"
                  value={defaultTestersRequired}
                  onChange={(event) => setDefaultTestersRequired(Number(event.target.value))}
                  disabled={isLoadingProfile || isSavingMissionDefaults || !hasLoadedProfile}
                  style={{ background: 'var(--bg-light)', border: '1.5px solid var(--border)', borderRadius: '8px', padding: '0.7rem 1rem', fontFamily: 'Satoshi, sans-serif', fontSize: '0.9rem', color: 'var(--ink)', outline: 'none', width: '100%', cursor: 'none', transition: 'border-color 0.2s' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', fontFamily: 'DM Mono, monospace', fontSize: '0.65rem', color: 'var(--ink-soft)', letterSpacing: '0.14em' }}>
                  <span>Lean</span>
                  <span>Balanced</span>
                  <span>Broad</span>
                </div>
              </div>
            </SettingsField>
            {missionDefaultsError ? <p className="text-sm text-red-400">{missionDefaultsError}</p> : null}
            <button className="cursor-none"
              type="button"
              onClick={handleSaveMissionDefaults}
              disabled={isLoadingProfile || isSavingMissionDefaults || !hasLoadedProfile}
              style={{ background: 'var(--electric)', color: 'var(--cream)', border: 'none', borderRadius: '100px', padding: '0.65rem 1.6rem', fontFamily: 'Satoshi, sans-serif', fontWeight: 700, fontSize: '0.9rem', cursor: 'none', opacity: (isLoadingProfile || isSavingProfile || isSavingMissionDefaults || !hasLoadedProfile) ? 0.6 : 1 }}
            >
              {isSavingMissionDefaults ? 'Saving Defaults...' : isLoadingProfile ? 'Loading Defaults...' : 'Save Defaults'}
            </button>
          </div>
        </SettingsSectionCard>

        <SettingsSectionCard
          title="Billing"
          description="Review coin purchases and future billing activity for your founder account."
        >
          <div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.68rem', color: 'var(--ink-soft)', letterSpacing: '0.1em' }}>COIN PURCHASE HISTORY</div>
            <div style={{ background: 'var(--bg)', borderRadius: '10px', overflow: 'hidden' }}>
              {isLoadingTransactions ? (
                <div className="px-4 py-8 text-center text-sm text-text-muted">Loading purchase history...</div>
              ) : transactionsError ? (
                <div className="px-4 py-8 text-center text-sm text-red-400">{transactionsError}</div>
              ) : transactions.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-text-muted">
                  Your purchase history will appear here
                </div>
              ) : (
                <ul>
                  {transactions.map((transaction) => (
                    <li key={transaction.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', fontFamily: 'Satoshi, sans-serif', fontSize: '0.85rem', color: 'var(--ink)' }}>
                      <div>
                        <div>{transaction.description}</div>
                        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.72rem', color: 'var(--ink-soft)' }}>{transactionDateFormatter.format(new Date(transaction.createdAt))}</div>
                      </div>
                      <div
                        style={{ color: transaction.amount >= 0 ? 'var(--electric)' : 'var(--ink-soft)', fontWeight: transaction.amount >= 0 ? 600 : 400 }}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
          title="Session"
          description="Manage your current session and role switching."
          className="md:hidden xl:col-span-2"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {onSwitchToTester && (
              <button
                type="button"
                onClick={onSwitchToTester}
                disabled={isSwitchingToTester}
                className="cursor-none w-full rounded-full bg-[var(--electric-dim)] border border-[var(--electric-mid)] py-3 font-['Satoshi'] text-[0.95rem] font-bold text-[var(--electric)] transition-all hover:opacity-90 text-center flex items-center justify-center gap-2"
              >
                <ArrowRightLeft style={{ width: 14, height: 14 }} />
                {isSwitchingToTester ? 'Switching to tester...' : 'Switch to tester'}
              </button>
            )}
            <button
              type="button"
              onClick={() => void signOut()}
              className="cursor-none w-full rounded-full bg-[var(--electric)] py-3 font-['Satoshi'] text-[0.95rem] font-bold text-[var(--cream)] transition-all hover:opacity-90 text-center"
            >
              Sign Out
            </button>
          </div>
        </SettingsSectionCard>

        <SettingsSectionCard
          title="Danger Zone"
          description="Once you delete your account, there is no going back. Please be certain."
          className="border-[rgba(192,57,43,0.18)] bg-[rgba(192,57,43,0.04)] xl:col-span-2"
        >
          <button
            onClick={onOpenDeleteModal}
            className="text-sm font-[family-name:var(--font-dm-mono)] uppercase tracking-[0.1em] text-[#c0392b] underline underline-offset-4 transition-opacity hover:opacity-70 cursor-none"
          >
            DELETE ACCOUNT
          </button>
        </SettingsSectionCard>
      </div>
    </div>
  )
}
