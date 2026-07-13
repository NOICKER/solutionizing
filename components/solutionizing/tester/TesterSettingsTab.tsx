"use client"

import { Landmark, Monitor, QrCode, Smartphone, TabletSmartphone } from 'lucide-react'
import { ReactNode, startTransition, useCallback, useEffect, useState } from 'react'
import { toast } from '@/components/ui/sonner'
import { useAuth } from '@/context/AuthContext'
import { apiFetch, isApiClientError } from '@/lib/api/client'
import {
  getInitialPayoutDetails,
  hasPayoutFieldErrors,
  serializePayoutDetails,
  validatePayoutDetails,
  type PayoutField,
  type PayoutMethod,
} from '@/lib/payout-details'
import {
  formatCoins,
  ReputationTierBadge,
} from '@/components/solutionizing/ui'
import {
  expertiseTagOptions,
  preferredDeviceOptions,
  type ExpertiseTag,
  type PreferredDevice,
} from '@/components/solutionizing/tester/profileOptions'

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

type PayoutTouchedState = Partial<Record<PayoutField, boolean>>

function ComingSoonBadge() {
  return (
    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.65rem', letterSpacing: '0.1em', color: 'var(--ink-soft)', background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '100px', padding: '0.2rem 0.7rem', whiteSpace: 'nowrap' }}>
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
    <section
      className={`rounded-[1.25rem] border border-[var(--border)] bg-[var(--bg-light)] p-6 ${className}`}
    >
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-col">
            <h3 className="font-[family-name:var(--font-fraunces)] italic font-normal text-lg text-[var(--ink)]">{title}</h3>
            <div className="w-8 h-[3px] rounded-full bg-[var(--electric)] mt-1" />
          </div>
          <p className="mt-2 max-w-2xl text-sm text-[var(--ink-soft)]">{description}</p>
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
        <span className="font-[family-name:var(--font-dm-mono)] text-[0.68rem] uppercase tracking-[0.1em] text-[var(--ink-soft)]">{label}</span>
        {comingSoon ? <ComingSoonBadge /> : null}
      </div>
      {children}
      {hint ? <span className="block text-sm text-[var(--ink-soft)]">{hint}</span> : null}
    </label>
  )
}

function NotificationToggleRow({ title, description, checked, disabled = false, onToggle, ariaLabel }: { title: string; description: string; checked: boolean; disabled?: boolean; onToggle: () => void; ariaLabel?: string }) {
  return (
    <div style={{ background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.9rem 1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
      <div>
        <div style={{ fontFamily: 'Satoshi, sans-serif', fontWeight: 600, fontSize: '0.9rem', color: 'var(--ink)' }}>{title}</div>
        <div style={{ fontFamily: 'Satoshi, sans-serif', fontSize: '0.82rem', color: 'var(--ink-soft)', marginTop: '0.2rem' }}>{description}</div>
      </div>
      <button className="cursor-none"
        type="button"
        onClick={onToggle}
        disabled={disabled}
        aria-pressed={checked}
        aria-label={ariaLabel ?? `Toggle ${title} notifications`}
        style={{
          padding: 0,
          display: 'flex', alignItems: 'center',
          height: '24px', width: '44px', borderRadius: '100px', 
          border: checked ? '1px solid var(--electric)' : '1px solid var(--border-strong)', 
          background: checked ? 'rgba(255,107,26,0.15)' : 'var(--bg)', 
          cursor: 'none', transition: 'background 0.2s, border-color 0.2s',
          opacity: disabled ? 0.6 : 1
        }}
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
  const [displayName, setDisplayName] = useState(user?.testerProfile?.displayName ?? initialDisplayName)
  const [coinBalance, setCoinBalance] = useState(user?.testerProfile?.coinBalance ?? 0)
  const [reputationScore, setReputationScore] = useState(user?.testerProfile?.reputationScore ?? 50)
  const [reputationTier, setReputationTier] = useState<TesterReputationTier>(
    user?.testerProfile?.reputationTier ?? 'RELIABLE'
  )
  const [notifyNewMission, setNotifyNewMission] = useState(true)
  const [expertiseTags, setExpertiseTags] = useState<string[]>([])
  const [preferredDevice, setPreferredDevice] = useState<PreferredDevice | null>(null)
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethod>('UPI')
  const [upiId, setUpiId] = useState('')
  const [accountHolderName, setAccountHolderName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [ifscCode, setIfscCode] = useState('')
  const [payoutTouched, setPayoutTouched] = useState<PayoutTouchedState>({})
  const [payoutError, setPayoutError] = useState('')
  const [isSavingPayout, setIsSavingPayout] = useState(false)
  const [hasAttemptedPayoutSave, setHasAttemptedPayoutSave] = useState(false)
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
  const payoutDetailsDraft =
    payoutMethod === 'UPI'
      ? {
          method: 'UPI' as const,
          upiId,
        }
      : {
          method: 'BANK_TRANSFER' as const,
          accountHolderName,
          accountNumber,
          ifscCode,
        }
  const payoutFieldErrors = validatePayoutDetails(payoutDetailsDraft)

  const applyTesterProfile = useCallback((profile: TesterProfileResponse) => {
    setDisplayName(profile.displayName)
    setCoinBalance(profile.coinBalance)
    setReputationScore(profile.reputationScore)
    setReputationTier(profile.reputationTier)
    setNotifyNewMission(profile.notifyNewMission)
    setExpertiseTags(profile.expertiseTags)
    setPreferredDevice(profile.preferredDevice)
    const initialPayoutDetails = getInitialPayoutDetails(profile.payoutDetails)
    setPayoutMethod(initialPayoutDetails.method)
    setUpiId(initialPayoutDetails.method === 'UPI' ? initialPayoutDetails.upiId : '')
    setAccountHolderName(
      initialPayoutDetails.method === 'BANK_TRANSFER' ? initialPayoutDetails.accountHolderName : ''
    )
    setAccountNumber(
      initialPayoutDetails.method === 'BANK_TRANSFER' ? initialPayoutDetails.accountNumber : ''
    )
    setIfscCode(initialPayoutDetails.method === 'BANK_TRANSFER' ? initialPayoutDetails.ifscCode : '')
    setPayoutTouched({})
    setPayoutError('')
    setHasAttemptedPayoutSave(false)
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

  function handlePayoutFieldChange(field: PayoutField, value: string) {
    setPayoutTouched((current) => ({
      ...current,
      [field]: true,
    }))
    setPayoutError('')

    switch (field) {
      case 'upiId':
        setUpiId(value)
        break
      case 'accountHolderName':
        setAccountHolderName(value)
        break
      case 'accountNumber':
        setAccountNumber(value.replace(/\D/g, ''))
        break
      case 'ifscCode':
        setIfscCode(value.toUpperCase())
        break
      default:
        break
    }
  }

  function handlePayoutMethodChange(method: PayoutMethod) {
    setPayoutMethod(method)
    setPayoutTouched({})
    setPayoutError('')
    setHasAttemptedPayoutSave(false)
  }

  function getVisiblePayoutFieldError(field: PayoutField) {
    if (!hasAttemptedPayoutSave && !payoutTouched[field]) {
      return null
    }

    return payoutFieldErrors[field] ?? null
  }

  async function handleSavePayout() {
    if (isLoadingProfile || isSavingPayout || !hasLoadedProfile) {
      return
    }

    setHasAttemptedPayoutSave(true)
    setPayoutError('')

    if (hasPayoutFieldErrors(payoutFieldErrors)) {
      setPayoutError('Fix the highlighted payout details and try again.')
      return
    }

    setIsSavingPayout(true)

    try {
      const response = await patchTesterProfile({
        payoutDetails: serializePayoutDetails(payoutDetailsDraft),
      })

      applyTesterProfile(response)
      toast.success('Payout details updated successfully.')
    } catch (error) {
      setPayoutError(getRequestErrorMessage(error))
    } finally {
      setIsSavingPayout(false)
    }
  }

  return (
    <div className="animate-[tabEnter_0.22s_ease_forwards]" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      <div style={{ display: 'none' }}>
        <div>
          <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-bold text-[var(--ink)]">Account Settings</h2>
          <p className="mt-2 max-w-2xl text-sm text-[var(--ink-soft)]">
            Tune your tester profile, mission alerts, and device preferences from one place.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-3">
          <div className="hidden rounded-[12px] border border-[var(--border)] bg-[var(--bg-light)] px-3 py-2.5 sm:px-4 sm:py-3">
            <div className="font-[family-name:var(--font-dm-mono)] text-[0.68rem] uppercase tracking-[0.1em] text-[var(--ink-soft)]">Coin Balance</div>
            <div className="mt-1 font-[family-name:var(--font-fraunces)] text-base font-bold text-[var(--ink)] sm:mt-2 sm:text-lg">{formatCoins(coinBalance)} coins</div>
          </div>
          <div className="rounded-[12px] border border-[var(--border)] bg-[var(--bg-light)] px-3 py-2.5 sm:px-4 sm:py-3">
            <div className="font-[family-name:var(--font-dm-mono)] text-[0.68rem] uppercase tracking-[0.1em] text-[var(--ink-soft)]">Reputation</div>
            <div className="mt-1 font-[family-name:var(--font-fraunces)] text-base font-bold text-[var(--ink)] sm:mt-2 sm:text-lg">{reputationScore.toFixed(1)}</div>
          </div>
          <div className="rounded-[12px] border border-[var(--border)] bg-[var(--bg-light)] px-3 py-2.5 sm:px-4 sm:py-3">
            <div className="font-[family-name:var(--font-dm-mono)] text-[0.68rem] uppercase tracking-[0.1em] text-[var(--ink-soft)]">Tier</div>
            <div className="mt-1 sm:mt-2">
              <ReputationTierBadge tier={reputationTier} />
            </div>
          </div>
        </div>
      </div>

      {profileLoadError ? (
        <div className="mb-6 rounded-[12px] border border-[var(--border-strong)] bg-[var(--bg-light)] px-4 py-3 text-sm text-[#c0392b]">
          {profileLoadError}
        </div>
      ) : null}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        <SettingsSectionCard
          title="Profile"
          description="Update the display name founders see when you complete missions and share feedback."
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <SettingsField label="Display Name" hint="Use the name you want attached to your tester profile.">
              <input className="cursor-none"
                type="text"
                value={displayName}
                minLength={2}
                maxLength={50}
                onChange={(event) => setDisplayName(event.target.value)}
                disabled={isLoadingProfile || isSavingProfile || !hasLoadedProfile}
                style={{ background: 'var(--bg-light)', border: '1.5px solid var(--border)', borderRadius: '8px', padding: '0.7rem 1rem', fontFamily: 'Satoshi, sans-serif', fontSize: '0.9rem', color: 'var(--ink)', outline: 'none', width: '100%', cursor: 'none', transition: 'border-color 0.2s', opacity: (isLoadingProfile || isSavingProfile || !hasLoadedProfile || false) ? 0.5 : 1 }}
              />
            </SettingsField>
            {profileError ? <p className="text-sm text-[#c0392b]">{profileError}</p> : null}
            <button className="cursor-none"
              type="button"
              onClick={() => void handleSaveProfile()}
              disabled={isLoadingProfile || isSavingProfile || !hasLoadedProfile}
              style={{ background: 'var(--electric)', color: 'var(--cream)', border: 'none', borderRadius: '100px', padding: '0.65rem 1.6rem', fontFamily: 'Satoshi, sans-serif', fontWeight: 700, fontSize: '0.9rem', cursor: 'none', opacity: (isLoadingProfile || isSavingProfile || !hasLoadedProfile) ? 0.6 : 1 }}
            >
              {isSavingProfile ? 'Saving Changes...' : isLoadingProfile ? 'Loading Profile...' : 'Save Changes'}
            </button>
          </div>
        </SettingsSectionCard>

        <SettingsSectionCard
          title="Account Security"
          description="Monitor account access and trigger a password reset whenever you need one."
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <SettingsField label="Email Address" hint="To change your email contact support.">
              <input className="cursor-none" type="email" value={testerEmail} readOnly style={{ background: 'var(--bg-light)', border: '1.5px solid var(--border)', borderRadius: '8px', padding: '0.7rem 1rem', fontFamily: 'Satoshi, sans-serif', fontSize: '0.9rem', color: 'var(--ink)', outline: 'none', width: '100%', cursor: 'none', transition: 'border-color 0.2s' }} />
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
                onClick={() => void handleChangePassword()}
                disabled={!testerEmail || isSendingResetLink}
                style={{ background: 'transparent', border: '1px solid var(--border-strong)', color: 'var(--ink)', borderRadius: '100px', padding: '0.5rem 1.1rem', fontFamily: 'Satoshi, sans-serif', fontWeight: 600, fontSize: '0.82rem', cursor: 'none', opacity: (!testerEmail || isSendingResetLink) ? 0.6 : 1 }}
              >
                {isSendingResetLink ? 'Sending Reset Link...' : 'Change Password'}
              </button>
              {passwordResetMessage ? <p className="text-sm text-[#1e7a47]">{passwordResetMessage}</p> : null}
              {passwordResetError ? <p className="text-sm text-[#c0392b]">{passwordResetError}</p> : null}
            </div>
          </div>
        </SettingsSectionCard>

        <SettingsSectionCard
          title="Device Profile"
          description="Choose the setup you use most often so new missions can be matched to the right context."
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '1rem' }}>
              {preferredDeviceOptions.map((option) => {
                const active = preferredDevice === option.value

                return (
                  <button className="cursor-none"
                    key={option.value}
                    type="button"
                    onClick={() => void handlePreferredDeviceSelect(option.value)}
                    disabled={isLoadingProfile || isSavingDevice || !hasLoadedProfile}
                    aria-pressed={active}
                    style={{
                      borderRadius: '12px', border: active ? '2px solid var(--electric)' : '1px solid var(--border-strong)',
                      background: active ? 'rgba(255,107,26,0.05)' : 'var(--bg-light)', padding: '1.2rem', textAlign: 'left',
                      cursor: 'none', transition: 'border-color 0.2s, background 0.2s',
                      opacity: (isLoadingProfile || isSavingDevice || !hasLoadedProfile) ? 0.6 : 1
                    }}
                  >
                    {(() => {
                      const iconClass = active ? "var(--electric)" : "var(--ink-soft)"; const iconStyle = { marginBottom: '1rem', width: '24px', height: '24px', color: iconClass }
                      if (option.glyphName === 'Monitor') return <Monitor style={iconStyle} />
                      if (option.glyphName === 'Smartphone') return <Smartphone style={iconStyle} />
                      return <TabletSmartphone style={iconStyle} />
                    })()}
                    <div style={{ fontFamily: 'Satoshi, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: 'var(--ink)' }}>{option.label}</div>
                    <div style={{ marginTop: '0.4rem', fontFamily: 'Satoshi, sans-serif', fontSize: '0.85rem', color: 'var(--ink-soft)' }}>{option.description}</div>
                  </button>
                )
              })}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--ink-soft)]">
              <span>Your selection saves automatically.</span>
              {isSavingDevice ? <span className="font-semibold text-[var(--electric)]">Saving...</span> : null}
            </div>
            {deviceError ? <p className="text-sm text-[#c0392b]">{deviceError}</p> : null}
          </div>
        </SettingsSectionCard>

        <SettingsSectionCard
          title="Expertise Tags"
          description="Highlight the kinds of products and spaces where your feedback is strongest."
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {expertiseTagOptions.map((tag) => {
                const active = expertiseTags.includes(tag)

                return (
                  <button className="cursor-none"
                    key={tag}
                    type="button"
                    onClick={() => void handleExpertiseTagToggle(tag)}
                    disabled={isLoadingProfile || isSavingExpertise || !hasLoadedProfile}
                    aria-pressed={active}
                    style={{
                      borderRadius: '100px', border: active ? '1px solid var(--electric)' : '1px solid var(--border-strong)',
                      background: active ? 'rgba(255,107,26,0.1)' : 'var(--bg-light)', padding: '0.6rem 1rem', textAlign: 'left',
                      fontFamily: 'Satoshi, sans-serif', fontWeight: 600, fontSize: '0.85rem', color: active ? 'var(--electric)' : 'var(--ink)',
                      cursor: 'none', transition: 'border-color 0.2s, background 0.2s',
                      opacity: (isLoadingProfile || isSavingExpertise || !hasLoadedProfile) ? 0.6 : 1
                    }}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--ink-soft)]">
              <span>{expertiseTags.length}/10 tags selected. Changes save immediately.</span>
              {isSavingExpertise ? <span className="font-semibold text-[var(--electric)]">Saving...</span> : null}
            </div>
            {expertiseError ? <p className="text-sm text-[#c0392b]">{expertiseError}</p> : null}
          </div>
        </SettingsSectionCard>

        <SettingsSectionCard
          title="Payout Details"
          description="Choose how you want to receive payouts so withdrawals can be processed without extra setup."
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '1rem' }}>
              {(['UPI', 'BANK_TRANSFER'] as const).map((method) => {
                const active = payoutMethod === method

                return (
                  <button className="cursor-none"
                    key={method}
                    type="button"
                    onClick={() => handlePayoutMethodChange(method)}
                    disabled={isLoadingProfile || isSavingPayout || !hasLoadedProfile}
                    aria-pressed={active}
                    style={{
                      borderRadius: '12px', border: active ? '2px solid var(--electric)' : '1px solid var(--border-strong)',
                      background: active ? 'rgba(255,107,26,0.05)' : 'var(--bg-light)', padding: '1.2rem', textAlign: 'left',
                      cursor: 'none', transition: 'border-color 0.2s, background 0.2s',
                      opacity: (isLoadingProfile || isSavingPayout || !hasLoadedProfile) ? 0.6 : 1
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {(() => {
                        const iconClass = active ? "var(--electric)" : "var(--ink-soft)"; const iconStyle = { width: '24px', height: '24px', color: iconClass }
                        return method === 'UPI' ? <QrCode style={iconStyle} /> : <Landmark style={iconStyle} />
                      })()}
                      <div>
                        <div style={{ fontFamily: 'Satoshi, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: 'var(--ink)' }}>
                          {method === 'UPI' ? 'UPI' : 'Bank Transfer'}
                        </div>
                        <div style={{ marginTop: '0.2rem', fontFamily: 'Satoshi, sans-serif', fontSize: '0.85rem', color: 'var(--ink-soft)' }}>
                          {method === 'UPI'
                            ? 'Use your UPI ID for fast payouts.'
                            : 'Provide your bank account details for direct transfers.'}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {payoutMethod === 'UPI' ? (
              <SettingsField
                label="UPI ID"
                hint="Format: name@bank. This is validated before it can be saved."
              >
                <input className="cursor-none"
                  type="text"
                  value={upiId}
                  onChange={(event) => handlePayoutFieldChange('upiId', event.target.value)}
                  placeholder="yourname@bank"
                  autoComplete="off"
                  disabled={isLoadingProfile || isSavingPayout || !hasLoadedProfile}
                  style={{ background: 'var(--bg-light)', border: '1.5px solid var(--border)', borderRadius: '8px', padding: '0.7rem 1rem', fontFamily: 'Satoshi, sans-serif', fontSize: '0.9rem', color: 'var(--ink)', outline: 'none', width: '100%', cursor: 'none', transition: 'border-color 0.2s' }}
                />
                {getVisiblePayoutFieldError('upiId') ? (
                  <p className="text-sm text-[#c0392b]">{getVisiblePayoutFieldError('upiId')}</p>
                ) : null}
              </SettingsField>
            ) : (
              <div className="grid gap-4">
                <SettingsField
                  label="Account Holder Name"
                  hint="Enter the full account holder name exactly as registered with your bank."
                >
                  <input className="cursor-none"
                    type="text"
                    value={accountHolderName}
                    onChange={(event) => handlePayoutFieldChange('accountHolderName', event.target.value)}
                    placeholder="Aarav Sharma"
                    autoComplete="name"
                    disabled={isLoadingProfile || isSavingPayout || !hasLoadedProfile}
                    style={{ background: 'var(--bg-light)', border: '1.5px solid var(--border)', borderRadius: '8px', padding: '0.7rem 1rem', fontFamily: 'Satoshi, sans-serif', fontSize: '0.9rem', color: 'var(--ink)', outline: 'none', width: '100%', cursor: 'none', transition: 'border-color 0.2s' }}
                  />
                  {getVisiblePayoutFieldError('accountHolderName') ? (
                    <p className="text-sm text-[#c0392b]">
                      {getVisiblePayoutFieldError('accountHolderName')}
                    </p>
                  ) : null}
                </SettingsField>

                <div className="grid gap-4 md:grid-cols-2">
                  <SettingsField label="Account Number" hint="Only digits are allowed, between 9 and 18 characters.">
                    <input className="cursor-none"
                      type="text"
                      inputMode="numeric"
                      value={accountNumber}
                      onChange={(event) => handlePayoutFieldChange('accountNumber', event.target.value)}
                      placeholder="123456789012"
                      autoComplete="off"
                      disabled={isLoadingProfile || isSavingPayout || !hasLoadedProfile}
                      style={{ background: 'var(--bg-light)', border: '1.5px solid var(--border)', borderRadius: '8px', padding: '0.7rem 1rem', fontFamily: 'Satoshi, sans-serif', fontSize: '0.9rem', color: 'var(--ink)', outline: 'none', width: '100%', cursor: 'none', transition: 'border-color 0.2s' }}
                    />
                    {getVisiblePayoutFieldError('accountNumber') ? (
                      <p className="text-sm text-[#c0392b]">{getVisiblePayoutFieldError('accountNumber')}</p>
                    ) : null}
                  </SettingsField>

                  <SettingsField label="IFSC Code" hint="Example: HDFC0123456">
                    <input className="cursor-none"
                      type="text"
                      value={ifscCode}
                      onChange={(event) => handlePayoutFieldChange('ifscCode', event.target.value)}
                      placeholder="HDFC0123456"
                      autoComplete="off"
                      disabled={isLoadingProfile || isSavingPayout || !hasLoadedProfile}
                      style={{ background: 'var(--bg-light)', border: '1.5px solid var(--border)', borderRadius: '8px', padding: '0.7rem 1rem', fontFamily: 'Satoshi, sans-serif', fontSize: '0.9rem', color: 'var(--ink)', outline: 'none', width: '100%', cursor: 'none', transition: 'border-color 0.2s' }}
                    />
                    {getVisiblePayoutFieldError('ifscCode') ? (
                      <p className="text-sm text-[#c0392b]">{getVisiblePayoutFieldError('ifscCode')}</p>
                    ) : null}
                  </SettingsField>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-[var(--ink-soft)]">
                Your payout details are saved securely and used when withdrawals are processed.
              </p>
              <button className="cursor-none"
                type="button"
                onClick={() => void handleSavePayout()}
                disabled={isLoadingProfile || isSavingPayout || !hasLoadedProfile}
                style={{ background: 'var(--electric)', color: 'var(--cream)', border: 'none', borderRadius: '100px', padding: '0.65rem 1.6rem', fontFamily: 'Satoshi, sans-serif', fontWeight: 700, fontSize: '0.9rem', cursor: 'none', opacity: (isLoadingProfile || isSavingProfile || !hasLoadedProfile) ? 0.6 : 1 }}
              >
                {isSavingPayout ? 'Saving Payout Details...' : 'Save Payout Details'}
              </button>
            </div>
            {payoutError ? <p className="text-sm text-[#c0392b]">{payoutError}</p> : null}
          </div>
        </SettingsSectionCard>

        <SettingsSectionCard
          title="Notifications"
          description="Stay in the loop when new tester missions land that match your profile."
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {notificationError ? <p className="text-sm text-[#c0392b]">{notificationError}</p> : null}
            <NotificationToggleRow
              title="New mission notifications"
              description="Receive an alert when a fresh mission is available for testers."
              checked={notifyNewMission}
              disabled={isLoadingProfile || isSavingNotification || !hasLoadedProfile}
              onToggle={() => void handleNotificationToggle()}
            />
            {isSavingNotification ? (
              <p className="text-sm font-semibold text-[var(--electric)]">Saving your notification preference...</p>
            ) : null}
          </div>
        </SettingsSectionCard>

        <div style={{ background: 'rgba(192, 57, 43, 0.04)', border: '1px solid rgba(192, 57, 43, 0.18)', borderRadius: '10px', padding: '1.2rem 1.4rem', marginTop: '1.5rem', gridColumn: '1 / -1' }}>
    <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.68rem', color: '#c0392b', letterSpacing: '0.12em' }}>DANGER ZONE</div>
    <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: '0.85rem', color: 'var(--ink-soft)', margin: '0.5rem 0 0.75rem' }}>Once you delete your account, there is no going back. Please be certain.</p>
    <button className="cursor-none" onClick={onOpenDeleteModal} style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.75rem', color: '#c0392b', background: 'none', border: 'none', cursor: 'none', textDecoration: 'underline' }}>
      DELETE ACCOUNT
    </button>
  </div>
      </div>
    </div>
  )
}
