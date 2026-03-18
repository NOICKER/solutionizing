"use client"

import { ReactNode, startTransition, useCallback, useEffect, useState } from 'react'
import { toast } from '@/components/ui/sonner'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { apiFetch, isApiClientError } from '@/lib/api/client'
import {
  formatCoins,
  outlineButtonClass,
  primaryButtonClass,
  ReputationTierBadge,
  textFieldClass,
} from '@/components/solutionizing/ui'
import {
  expertiseTagOptions,
  preferredDeviceOptions,
  type ExpertiseTag,
  type PreferredDevice,
} from '@/components/solutionizing/tester/profileOptions'

const settingsFieldClass = `${textFieldClass} disabled:cursor-not-allowed disabled:border-[#ece6df] disabled:bg-[#f6f1ec] disabled:text-[#8a8693] disabled:opacity-100 dark:disabled:border-gray-700 dark:disabled:bg-gray-800 dark:disabled:text-gray-400`
type TesterReputationTier = 'NEWCOMER' | 'RELIABLE' | 'TRUSTED' | 'ELITE'

interface TesterProfileResponse {
  displayName: string
  coinBalance: number
  reputationScore: number
  reputationTier: TesterReputationTier
  notifyNewMission: boolean
  expertiseTags: string[]
  preferredDevice: PreferredDevice | null
  payoutDetails: string | null
}

type TesterProfileUpdateBody = Partial<
  Pick<
    TesterProfileResponse,
    'displayName' | 'notifyNewMission' | 'expertiseTags' | 'preferredDevice' | 'payoutDetails'
  >
>

function ComingSoonBadge() {
  return (
    <span className="inline-flex rounded-full border border-[#ddd7d0] bg-[#f5f2ee] px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#7f7986] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
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
      className={`rounded-3xl border border-[#ece6df] bg-white/95 p-6 shadow-[0_20px_50px_-40px_rgba(26,22,37,0.22)] dark:border-gray-700 dark:bg-gray-800 ${className}`}
    >
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-[#1a1625] dark:text-white">{title}</h3>
          <p className="mt-2 max-w-2xl text-sm text-[#6b687a] dark:text-gray-400">{description}</p>
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
        <span className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#9b98a8] dark:text-gray-400">{label}</span>
        {comingSoon ? <ComingSoonBadge /> : null}
      </div>
      {children}
      {hint ? <span className="block text-sm text-[#8c8897] dark:text-gray-400">{hint}</span> : null}
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
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#efe8e1] bg-[#fffdfa] px-4 py-4 dark:border-gray-700 dark:bg-gray-900/60">
      <div>
        <div className="text-sm font-bold text-[#1a1625] dark:text-white">{title}</div>
        <div className="mt-1 text-sm text-[#6b687a] dark:text-gray-400">{description}</div>
      </div>
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        aria-pressed={checked}
        aria-label={ariaLabel ?? `Toggle ${title}`}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border px-1 transition-colors ${
          checked
            ? 'border-[#d77a57] bg-[#f2c8b6]'
            : 'border-[#e2dbd4] bg-[#efe9e2] dark:border-gray-600 dark:bg-gray-700'
        } ${disabled ? 'cursor-not-allowed opacity-70' : ''}`}
      >
        <span
          className={`h-5 w-5 rounded-full bg-white shadow-[0_6px_16px_-12px_rgba(26,22,37,0.55)] transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}

function getRequestErrorMessage(error: unknown, fallback = 'Something went wrong. Try again.') {
  if (isApiClientError(error) && error.code === 'NETWORK_ERROR') {
    return 'Check your internet connection'
  }

  if (isApiClientError(error)) {
    return error.message
  }

  return fallback
}

interface TesterSettingsTabProps {
  displayName: string
  email: string
  onOpenDeleteModal: () => void
}

export function TesterSettingsTab({
  displayName: initialDisplayName,
  email,
  onOpenDeleteModal,
}: TesterSettingsTabProps) {
  const { user, refetch } = useAuth()
  const { darkMode, toggleDarkMode } = useTheme()
  const [displayName, setDisplayName] = useState(user?.testerProfile?.displayName ?? initialDisplayName)
  const [coinBalance, setCoinBalance] = useState(user?.testerProfile?.coinBalance ?? 0)
  const [reputationScore, setReputationScore] = useState(user?.testerProfile?.reputationScore ?? 50)
  const [reputationTier, setReputationTier] = useState<TesterReputationTier>(
    user?.testerProfile?.reputationTier ?? 'RELIABLE'
  )
  const [notifyNewMission, setNotifyNewMission] = useState(true)
  const [expertiseTags, setExpertiseTags] = useState<string[]>([])
  const [preferredDevice, setPreferredDevice] = useState<PreferredDevice | null>(null)
  const [payoutDetails, setPayoutDetails] = useState('')
  const [hasLoadedProfile, setHasLoadedProfile] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [profileLoadError, setProfileLoadError] = useState('')
  const [profileError, setProfileError] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [deviceError, setDeviceError] = useState('')
  const [isSavingDevice, setIsSavingDevice] = useState(false)
  const [expertiseError, setExpertiseError] = useState('')
  const [isSavingExpertise, setIsSavingExpertise] = useState(false)
  const [notificationError, setNotificationError] = useState('')
  const [isSavingNotification, setIsSavingNotification] = useState(false)
  const [isSendingResetLink, setIsSendingResetLink] = useState(false)
  const [passwordResetMessage, setPasswordResetMessage] = useState('')
  const [passwordResetError, setPasswordResetError] = useState('')

  const testerEmail = user?.email ?? email

  const applyTesterProfile = useCallback((profile: TesterProfileResponse) => {
    setDisplayName(profile.displayName)
    setCoinBalance(profile.coinBalance)
    setReputationScore(profile.reputationScore)
    setReputationTier(profile.reputationTier)
    setNotifyNewMission(profile.notifyNewMission)
    setExpertiseTags(profile.expertiseTags)
    setPreferredDevice(profile.preferredDevice)
    setPayoutDetails(profile.payoutDetails ?? '')
  }, [])

  const patchTesterProfile = useCallback(async (body: TesterProfileUpdateBody) => {
    return apiFetch<TesterProfileResponse>('/api/v1/tester/profile', {
      method: 'PATCH',
      body,
    })
  }, [])

  const syncAuthState = useCallback(() => {
    startTransition(() => {
      void refetch()
    })
  }, [refetch])

  useEffect(() => {
    let isActive = true

    async function loadProfile() {
      setIsLoadingProfile(true)
      setProfileLoadError('')

      try {
        const response = await apiFetch<TesterProfileResponse>('/api/v1/tester/profile')

        if (!isActive) {
          return
        }

        applyTesterProfile(response)
        setHasLoadedProfile(true)
        setProfileError('')
        setDeviceError('')
        setExpertiseError('')
        setNotificationError('')
      } catch (error) {
        if (!isActive) {
          return
        }

        const message = getRequestErrorMessage(error, "Couldn't load your settings.")
        setProfileLoadError(message)
        setProfileError(message)
        setDeviceError(message)
        setExpertiseError(message)
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
  }, [applyTesterProfile])

  async function handleSaveProfile() {
    if (isLoadingProfile || isSavingProfile || !hasLoadedProfile) {
      return
    }

    setIsSavingProfile(true)
    setProfileError('')

    try {
      const response = await patchTesterProfile({
        displayName: displayName.trim(),
      })

      applyTesterProfile(response)
      syncAuthState()
      toast.success('Profile updated successfully.')
    } catch (error) {
      setProfileError(getRequestErrorMessage(error))
    } finally {
      setIsSavingProfile(false)
    }
  }

  async function handleChangePassword() {
    if (!testerEmail || isSendingResetLink) {
      return
    }

    setIsSendingResetLink(true)
    setPasswordResetMessage('')
    setPasswordResetError('')

    try {
      await apiFetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        body: { email: testerEmail },
        skipSessionHandling: true,
      })

      const message = 'A password reset link has been sent to your email.'
      setPasswordResetMessage(message)
      toast.success(message)
    } catch (error) {
      setPasswordResetError(getRequestErrorMessage(error))
    } finally {
      setIsSendingResetLink(false)
    }
  }

  async function handlePreferredDeviceSelect(nextDevice: PreferredDevice) {
    if (isLoadingProfile || isSavingDevice || !hasLoadedProfile || preferredDevice === nextDevice) {
      return
    }

    const previousDevice = preferredDevice

    setPreferredDevice(nextDevice)
    setDeviceError('')
    setIsSavingDevice(true)

    try {
      const response = await patchTesterProfile({
        preferredDevice: nextDevice,
      })

      applyTesterProfile(response)
    } catch (error) {
      setPreferredDevice(previousDevice)
      setDeviceError(getRequestErrorMessage(error))
    } finally {
      setIsSavingDevice(false)
    }
  }

  async function handleExpertiseTagToggle(tag: ExpertiseTag) {
    if (isLoadingProfile || isSavingExpertise || !hasLoadedProfile) {
      return
    }

    const nextSelection = expertiseTags.includes(tag)
      ? expertiseTagOptions.filter((option) => option !== tag && expertiseTags.includes(option))
      : expertiseTagOptions.filter((option) => option === tag || expertiseTags.includes(option))

    const previousSelection = expertiseTags

    setExpertiseTags(nextSelection)
    setExpertiseError('')
    setIsSavingExpertise(true)

    try {
      const response = await patchTesterProfile({
        expertiseTags: nextSelection,
      })

      applyTesterProfile(response)
    } catch (error) {
      setExpertiseTags(previousSelection)
      setExpertiseError(getRequestErrorMessage(error))
    } finally {
      setIsSavingExpertise(false)
    }
  }

  async function handleNotificationToggle() {
    if (isLoadingProfile || isSavingNotification || !hasLoadedProfile) {
      return
    }

    const currentValue = notifyNewMission
    const nextValue = !notifyNewMission

    setNotifyNewMission(nextValue)
    setNotificationError('')
    setIsSavingNotification(true)

    try {
      const response = await patchTesterProfile({
        notifyNewMission: nextValue,
      })

      applyTesterProfile(response)
    } catch (error) {
      setNotifyNewMission(currentValue)
      setNotificationError(getRequestErrorMessage(error))
    } finally {
      setIsSavingNotification(false)
    }
  }

  return (
    <section className="rounded-[1.9rem] border border-[#ece6df] bg-white/80 p-4 shadow-[0_24px_60px_-46px_rgba(26,22,37,0.26)] dark:border-gray-700 dark:bg-gray-800/90 sm:p-6">
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-black text-[#1a1625] dark:text-white">Account Settings</h2>
          <p className="mt-2 max-w-2xl text-sm text-[#6b687a] dark:text-gray-400">
            Tune your tester profile, mission alerts, and device preferences from one place.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="rounded-2xl border border-[#efe8e1] bg-[#fffdfa] px-4 py-3 dark:border-gray-700 dark:bg-gray-900/60">
            <div className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#9b98a8] dark:text-gray-400">Coin Balance</div>
            <div className="mt-2 text-lg font-black text-[#1a1625] dark:text-white">{formatCoins(coinBalance)} coins</div>
          </div>
          <div className="rounded-2xl border border-[#efe8e1] bg-[#fffdfa] px-4 py-3 dark:border-gray-700 dark:bg-gray-900/60">
            <div className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#9b98a8] dark:text-gray-400">Reputation</div>
            <div className="mt-2 text-lg font-black text-[#1a1625] dark:text-white">{reputationScore.toFixed(1)}</div>
          </div>
          <div className="rounded-2xl border border-[#efe8e1] bg-[#fffdfa] px-4 py-3 dark:border-gray-700 dark:bg-gray-900/60">
            <div className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#9b98a8] dark:text-gray-400">Tier</div>
            <div className="mt-2">
              <ReputationTierBadge tier={reputationTier} />
            </div>
          </div>
        </div>
      </div>

      {profileLoadError ? (
        <div className="mb-6 rounded-2xl border border-[#f1d3c7] bg-[#fff7f3] px-4 py-3 text-sm text-[#c4673f] dark:border-red-900/70 dark:bg-red-950/30">
          {profileLoadError}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <SettingsSectionCard
          title="Profile"
          description="Update the display name founders see when you complete missions and share feedback."
        >
          <div className="space-y-4">
            <SettingsField label="Display Name" hint="Use the name you want attached to your tester profile.">
              <input
                type="text"
                value={displayName}
                minLength={2}
                maxLength={50}
                onChange={(event) => setDisplayName(event.target.value)}
                disabled={isLoadingProfile || isSavingProfile || !hasLoadedProfile}
                className={
                  isLoadingProfile || isSavingProfile || !hasLoadedProfile ? settingsFieldClass : textFieldClass
                }
              />
            </SettingsField>
            {profileError ? <p className="text-sm text-[#c4673f]">{profileError}</p> : null}
            <button
              type="button"
              onClick={() => void handleSaveProfile()}
              disabled={isLoadingProfile || isSavingProfile || !hasLoadedProfile}
              className={`px-5 py-3 text-sm ${primaryButtonClass}`}
            >
              {isSavingProfile ? 'Saving Changes...' : isLoadingProfile ? 'Loading Profile...' : 'Save Changes'}
            </button>
          </div>
        </SettingsSectionCard>

        <SettingsSectionCard
          title="Account Security"
          description="Monitor account access and trigger a password reset whenever you need one."
        >
          <div className="space-y-4">
            <SettingsField label="Email Address" hint="To change your email contact support.">
              <input type="email" value={testerEmail} readOnly className={textFieldClass} />
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
                onClick={() => void handleChangePassword()}
                disabled={!testerEmail || isSendingResetLink}
                className={`px-5 py-3 text-sm ${outlineButtonClass}`}
              >
                {isSendingResetLink ? 'Sending Reset Link...' : 'Change Password'}
              </button>
              {passwordResetMessage ? <p className="text-sm text-[#2f7a4b]">{passwordResetMessage}</p> : null}
              {passwordResetError ? <p className="text-sm text-[#c4673f]">{passwordResetError}</p> : null}
            </div>
          </div>
        </SettingsSectionCard>

        <SettingsSectionCard
          title="Device Profile"
          description="Choose the setup you use most often so new missions can be matched to the right context."
        >
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              {preferredDeviceOptions.map((option) => {
                const active = preferredDevice === option.value

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => void handlePreferredDeviceSelect(option.value)}
                    disabled={isLoadingProfile || isSavingDevice || !hasLoadedProfile}
                    aria-pressed={active}
                    className={`rounded-2xl border px-4 py-4 text-left transition-all ${
                      active
                        ? 'border-[#d77a57] bg-[#fff4ef] shadow-[0_20px_40px_-34px_rgba(215,122,87,0.7)] dark:bg-[#d77a57]/10'
                        : 'border-[#efe8e1] bg-[#fffdfa] hover:border-[#dfcfc2] hover:bg-white dark:border-gray-700 dark:bg-gray-900/60 dark:hover:border-gray-600 dark:hover:bg-gray-800'
                    } ${isLoadingProfile || isSavingDevice || !hasLoadedProfile ? 'cursor-not-allowed opacity-70' : ''}`}
                  >
                    <span
                      className={`material-symbols-outlined !mb-4 !text-[1.65rem] ${
                        active ? 'text-[#d77a57]' : 'text-[#8b8797]'
                      }`}
                    >
                      {option.glyph}
                    </span>
                    <div className="text-sm font-black text-[#1a1625] dark:text-white">{option.label}</div>
                    <div className="mt-2 text-sm leading-6 text-[#6b687a] dark:text-gray-400">{option.description}</div>
                  </button>
                )
              })}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[#8c8897] dark:text-gray-400">
              <span>Your selection saves automatically.</span>
              {isSavingDevice ? <span className="font-semibold text-[#d77a57]">Saving...</span> : null}
            </div>
            {deviceError ? <p className="text-sm text-[#c4673f]">{deviceError}</p> : null}
          </div>
        </SettingsSectionCard>

        <SettingsSectionCard
          title="Expertise Tags"
          description="Highlight the kinds of products and spaces where your feedback is strongest."
        >
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {expertiseTagOptions.map((tag) => {
                const active = expertiseTags.includes(tag)

                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => void handleExpertiseTagToggle(tag)}
                    disabled={isLoadingProfile || isSavingExpertise || !hasLoadedProfile}
                    aria-pressed={active}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm font-bold transition-all ${
                      active
                        ? 'border-[#d77a57] bg-[#fff4ef] text-[#a85034] dark:bg-[#d77a57]/10'
                        : 'border-[#efe8e1] bg-[#fffdfa] text-[#6b687a] hover:border-[#dfcfc2] hover:text-[#1a1625] dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-white'
                    } ${isLoadingProfile || isSavingExpertise || !hasLoadedProfile ? 'cursor-not-allowed opacity-70' : ''}`}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[#8c8897] dark:text-gray-400">
              <span>{expertiseTags.length}/10 tags selected. Changes save immediately.</span>
              {isSavingExpertise ? <span className="font-semibold text-[#d77a57]">Saving...</span> : null}
            </div>
            {expertiseError ? <p className="text-sm text-[#c4673f]">{expertiseError}</p> : null}
          </div>
        </SettingsSectionCard>

        <SettingsSectionCard
          title="Payout Details"
          description="Keep your preferred payout destination ready for the moment withdrawals become available."
          comingSoon
        >
          <div className="space-y-4">
            <SettingsField
              label="UPI ID Or Bank Details"
              hint="Payout details will be configurable when withdrawals go live."
            >
              <input
                type="text"
                value={payoutDetails}
                placeholder="Enter your UPI ID or bank details"
                disabled
                className={settingsFieldClass}
              />
            </SettingsField>
          </div>
        </SettingsSectionCard>

        <SettingsSectionCard
          title="Notifications"
          description="Stay in the loop when new tester missions land that match your profile."
        >
          <div className="space-y-3">
            <NotificationToggleRow
              title="Dark Mode"
              description="Switch between light and dark interface"
              checked={darkMode}
              onToggle={toggleDarkMode}
              ariaLabel="Toggle dark mode"
            />
            {notificationError ? <p className="text-sm text-[#c4673f]">{notificationError}</p> : null}
            <NotificationToggleRow
              title="New mission notifications"
              description="Receive an alert when a fresh mission is available for testers."
              checked={notifyNewMission}
              disabled={isLoadingProfile || isSavingNotification || !hasLoadedProfile}
              onToggle={() => void handleNotificationToggle()}
            />
            {isSavingNotification ? (
              <p className="text-sm font-semibold text-[#d77a57]">Saving your notification preference...</p>
            ) : null}
          </div>
        </SettingsSectionCard>

        <SettingsSectionCard
          title="Danger Zone"
          description="Once you delete your account, there is no going back. Please be certain."
          className="border-red-100 bg-red-50/50 dark:border-red-900/70 dark:bg-red-950/30 xl:col-span-2"
        >
          <button
            onClick={onOpenDeleteModal}
            className="rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-red-700"
          >
            DELETE ACCOUNT
          </button>
        </SettingsSectionCard>
      </div>
    </section>
  )
}
