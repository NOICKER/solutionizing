"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from '@/components/ui/sonner'
import { apiFetch, isApiClientError } from '@/lib/api/client'
import { RequireAuth } from '@/components/RequireAuth'
import { ApiMissionDetail, WizardAsset, WizardQuestion } from '@/types/api'
import { SpinnerIcon, formatCoins, outlineButtonClass, primaryButtonClass, textFieldClass } from '@/components/solutionizing/ui'

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD'

interface WizardState {
  title: string
  goal: string
  difficulty: Difficulty
  estimatedMinutes: number
  testersRequired: number
  assets: WizardAsset[]
  questions: WizardQuestion[]
}

interface BalanceResponse {
  balance?: number
  coinBalance?: number
}

const initialState: WizardState = {
  title: '',
  goal: '',
  difficulty: 'MEDIUM',
  estimatedMinutes: 3,
  testersRequired: 10,
  assets: [{ type: 'LINK', url: '', label: '' }],
  questions: [{ text: '', type: 'TEXT_SHORT', required: true, order: 0 }],
}

const coinRates: Record<Difficulty, number> = {
  EASY: 500,
  MEDIUM: 1500,
  HARD: 3000,
}

function isValidUrl(value: string) {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <div className="inline-flex rounded-full bg-[#d77a57]/10 px-4 py-1 text-sm font-bold text-[#d77a57]">
          Step {step} of 4
        </div>
      </div>
      <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div className="h-full rounded-full bg-[#d77a57]" style={{ width: `${(step / 4) * 100}%` }} />
      </div>
      <div className="flex items-center justify-between text-sm">
        <div className={step >= 1 ? 'font-bold text-[#d77a57]' : 'text-[#9b98a8]'}>Brief</div>
        <div className={step >= 2 ? 'font-black text-[#1a1625]' : 'text-[#9b98a8]'}>Setup</div>
        <div className={step >= 3 ? 'font-black text-[#1a1625]' : 'text-[#9b98a8]'}>Questions</div>
        <div className={step >= 4 ? 'font-black text-[#1a1625]' : 'text-[#9b98a8]'}>Review</div>
      </div>
    </div>
  )
}

function toFrontendMission(mission: ApiMissionDetail): WizardState {
  return {
    title: mission.title,
    goal: mission.goal,
    difficulty: mission.difficulty,
    estimatedMinutes: mission.estimatedMinutes,
    testersRequired: mission.testersRequired,
    assets: mission.assets.map((asset) =>
      asset.type === 'TEXT_DESCRIPTION'
        ? { type: 'TEXT', text: asset.url, label: asset.label ?? '' }
        : { type: asset.type === 'SHORT_VIDEO' ? 'VIDEO' : asset.type, url: asset.url, label: asset.label ?? '' }
    ),
    questions: mission.questions.map((question) => ({
      text: question.text,
      type: question.type,
      required: question.isRequired,
      options: question.options,
      order: question.order - 1,
    })),
  }
}

function validateStep(step: number, state: WizardState) {
  const errors: Record<string, string> = {}

  if (step === 1) {
    if (state.title.trim().length < 5 || state.title.trim().length > 100) {
      errors.title = 'Title must be between 5 and 100 characters'
    }
    if (state.goal.trim().length < 10 || state.goal.trim().length > 300) {
      errors.goal = 'Goal must be between 10 and 300 characters'
    }
  }

  if (step === 2) {
    state.assets.forEach((asset, index) => {
      if (asset.type === 'TEXT') {
        const text = asset.text?.trim() ?? ''
        if (!text) {
          errors[`asset-${index}`] = 'Add text for this asset'
        } else if (text.length > 500) {
          errors[`asset-${index}`] = 'Text assets must be 500 characters or fewer'
        }
      } else {
        const url = asset.url?.trim() ?? ''
        if (!url) {
          errors[`asset-${index}`] = 'Add a valid URL'
        } else if (!isValidUrl(url)) {
          errors[`asset-${index}`] = 'Enter a full URL, including https://'
        }
      }

      if ((asset.label?.trim().length ?? 0) > 100) {
        errors[`asset-${index}`] = 'Asset labels must be 100 characters or fewer'
      }
    })
  }

  if (step === 3) {
    state.questions.forEach((question, index) => {
      if (question.text.trim().length < 5 || question.text.trim().length > 300) {
        errors[`question-${index}`] = 'Question text must be between 5 and 300 characters'
      }
      if (question.type === 'MULTIPLE_CHOICE') {
        const count = (question.options ?? []).map((option) => option.trim()).filter(Boolean).length
        if (count < 2) {
          errors[`question-options-${index}`] = 'Add at least two answer choices'
        } else if (count > 5) {
          errors[`question-options-${index}`] = 'Use at most five answer choices'
        }
      }
    })
  }

  return errors
}

function getStepForFieldKey(fieldKey: string) {
  if (fieldKey === 'title' || fieldKey === 'goal') {
    return 1
  }

  if (fieldKey.startsWith('asset-')) {
    return 2
  }

  return 3
}

function getValidationMessage(details: unknown) {
  if (!details || typeof details !== 'object') {
    return null
  }

  const candidate = details as {
    formErrors?: unknown
    fieldErrors?: Record<string, unknown>
  }

  if (Array.isArray(candidate.formErrors) && typeof candidate.formErrors[0] === 'string') {
    return candidate.formErrors[0]
  }

  if (!candidate.fieldErrors || typeof candidate.fieldErrors !== 'object') {
    return null
  }

  for (const value of Object.values(candidate.fieldErrors)) {
    if (Array.isArray(value) && typeof value[0] === 'string') {
      return value[0]
    }
  }

  return null
}

function getMissionValidationErrors(state: WizardState) {
  return {
    ...validateStep(1, state),
    ...validateStep(2, state),
    ...validateStep(3, state),
  }
}

function scrollToField(fieldKey: string) {
  document.querySelector<HTMLElement>(`[data-field-key="${fieldKey}"]`)?.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
  })
}

function MissionWizardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editMissionId = searchParams.get('edit')
  const isEditMode = Boolean(editMissionId)
  const [step, setStep] = useState(1)
  const [state, setState] = useState<WizardState>(initialState)
  const [showDraftBanner, setShowDraftBanner] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [goalWarning, setGoalWarning] = useState('')
  const [assetChecks, setAssetChecks] = useState<Record<number, 'ok' | 'warning'>>({})
  const [coinBalance, setCoinBalance] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [pendingAction, setPendingAction] = useState<'draft' | 'submit' | null>(null)
  const [submitError, setSubmitError] = useState('')
  const dirtyRef = useRef(false)

  const subtotal = coinRates[state.difficulty] * state.testersRequired
  const fee = Math.ceil(subtotal * 0.2)
  const total = subtotal + fee

  const loadBalance = useCallback(async () => {
    try {
      const response = await apiFetch<BalanceResponse>('/api/v1/coins/balance')
      setCoinBalance(response.balance ?? response.coinBalance ?? 0)
    } catch {
      setCoinBalance(0)
    }
  }, [])

  useEffect(() => {
    async function initialize() {
      if (!isEditMode || !editMissionId) {
        try {
          const draftJson = sessionStorage.getItem('mission-wizard-draft')
          if (draftJson) {
            const draft = JSON.parse(draftJson)
            setState(draft)
            setShowDraftBanner(true)
          }
        } catch {
          // ignore
        }
        setIsLoading(false)
        return
      }

      try {
        const mission = await apiFetch<ApiMissionDetail>(`/api/v1/missions/${editMissionId}`)
        if (mission.status !== 'DRAFT') {
          toast.info('This mission can no longer be edited.')
          router.replace('/dashboard/founder')
          return
        }
        setState(toFrontendMission(mission))
      } catch {
        router.replace('/dashboard/founder')
      } finally {
        setIsLoading(false)
      }
    }

    void initialize()
  }, [editMissionId, isEditMode, router])

  useEffect(() => {
    if (!isEditMode && sessionStorage.getItem('solutionizing-draft-refresh') === '1') {
      toast.info("Your draft wasn't saved yet.")
      sessionStorage.removeItem('solutionizing-draft-refresh')
    }
  }, [isEditMode])

  useEffect(() => {
    if (step === 2) {
      void loadBalance()
    }
  }, [loadBalance, step])

  useEffect(() => {
    const onBeforeUnload = () => {
      if (!isEditMode && dirtyRef.current) {
        sessionStorage.setItem('solutionizing-draft-refresh', '1')
      }
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [isEditMode])

  const updateState = useCallback((updater: (current: WizardState) => WizardState) => {
    dirtyRef.current = true
    setState((current) => {
      const nextState = updater(current)
      if (!isEditMode) {
        sessionStorage.setItem('mission-wizard-draft', JSON.stringify(nextState))
      }
      return nextState
    })
  }, [isEditMode])

  function handleNext() {
    const nextErrors = validateStep(step, state)
    setErrors(nextErrors)

    const firstError = Object.keys(nextErrors)[0]
    if (firstError) {
      scrollToField(firstError)
      return
    }

    setStep((current) => Math.min(4, current + 1))
  }

  function handleGoalBlur() {
    const containsEmail = /[^\s@]+@[^\s@]+\.[^\s@]+/.test(state.goal)
    const containsPhone = /(?:\+?\d[\d\s-]{7,}\d)/.test(state.goal)
    setGoalWarning(
      containsEmail || containsPhone ? 'Tip: Avoid including personal contact info in your goal.' : ''
    )
  }

  async function handleAssetReachability(index: number) {
    const asset = state.assets[index]
    if (!asset || asset.type === 'TEXT' || !asset.url?.trim()) {
      return
    }

    try {
      await fetch(asset.url, { method: 'HEAD', mode: 'no-cors' })
      setAssetChecks((current) => ({ ...current, [index]: 'ok' }))
    } catch {
      setAssetChecks((current) => ({ ...current, [index]: 'warning' }))
    }
  }

  async function handleSave(action: 'draft' | 'submit') {
    setSubmitError('')
    const validationErrors = getMissionValidationErrors(state)
    const firstErrorKey = Object.keys(validationErrors)[0]
    if (firstErrorKey) {
      setErrors(validationErrors)
      setStep(getStepForFieldKey(firstErrorKey))
      window.setTimeout(() => scrollToField(firstErrorKey), 0)
      return
    }

    setPendingAction(action)

    try {
      const payload = {
        title: state.title.trim(),
        goal: state.goal.trim(),
        difficulty: state.difficulty,
        estimatedMinutes: state.estimatedMinutes,
        testersRequired: state.testersRequired,
        assets: state.assets.map((asset, index) => ({
          type: asset.type === 'TEXT' ? 'TEXT_DESCRIPTION' : asset.type === 'VIDEO' ? 'SHORT_VIDEO' : asset.type,
          url: asset.type === 'TEXT' ? undefined : asset.url?.trim(),
          text: asset.type === 'TEXT' ? asset.text?.trim() : undefined,
          label: asset.label?.trim() || undefined,
          order: index,
        })),
        questions: state.questions.map((question, index) => ({
          order: index + 1,
          type: question.type,
          text: question.text.trim(),
          options: question.type === 'MULTIPLE_CHOICE' ? (question.options ?? []).map((option) => option.trim()).filter(Boolean) : undefined,
          isRequired: question.required,
        })),
      }

      let mission: ApiMissionDetail

      if (isEditMode && editMissionId) {
        mission = await apiFetch<ApiMissionDetail>(`/api/v1/missions/${editMissionId}`, { method: 'PATCH', body: payload })
      } else {
        mission = await apiFetch<ApiMissionDetail>('/api/v1/missions', { method: 'POST', body: payload })
      }

      if (action === 'submit') {
        await apiFetch(`/api/v1/missions/${mission.id}/submit`, { method: 'POST' })
      }

      sessionStorage.removeItem('solutionizing-draft-refresh')
      sessionStorage.removeItem('mission-wizard-draft')
      toast.success(
        action === 'submit'
          ? 'Mission submitted for review!'
          : isEditMode
            ? 'Mission changes saved.'
            : 'Mission saved as draft!'
      )
      router.push('/dashboard/founder')
    } catch (error) {
      if (isApiClientError(error)) {
        if (error.code === 'INSUFFICIENT_COINS') {
          setSubmitError("You don't have enough coins. Buy coins from your dashboard.")
        } else if (error.status === 400) {
          setSubmitError(getValidationMessage(error.details) ?? error.message)
        } else if (error.code === 'NETWORK_ERROR') {
          setSubmitError('Check your internet connection')
        } else {
          setSubmitError('Something went wrong. Try again.')
        }
      } else {
        setSubmitError('Something went wrong. Try again.')
      }
    } finally {
      setPendingAction(null)
    }
  }

  const reviewAssets = useMemo(
    () =>
      state.assets.map((asset, index) => (
        <div key={`${asset.type}-${index}`} className="rounded-3xl border border-[#e5e4e0] bg-white p-6">
          <div className="mb-2 text-sm font-bold text-[#d77a57]">ASSET {index + 1}</div>
          <div className="mb-2 text-lg font-black text-[#1a1625]">{asset.type}</div>
          <p className="break-words text-sm text-[#6b687a]">
            {asset.type === 'TEXT' ? asset.text : asset.url}
          </p>
          {asset.label?.trim() ? (
            <p className="mt-3 text-sm font-semibold text-[#1a1625]">Label: {asset.label.trim()}</p>
          ) : null}
        </div>
      )),
    [state.assets]
  )

  const reviewQuestions = useMemo(
    () =>
      state.questions.map((question, index) => (
        <div key={index} className="rounded-3xl border border-[#e5e4e0] bg-white p-6">
          <div className="mb-2 text-sm font-bold text-[#d77a57]">QUESTION {index + 1}</div>
          <div className="mb-2 text-lg font-black text-[#1a1625]">{question.text}</div>
          <div className="text-sm text-[#6b687a]">{question.type.replaceAll('_', ' ')}</div>
        </div>
      )),
    [state.questions]
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#faf9f7] p-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="h-64 animate-pulse rounded-3xl bg-white" />
          <div className="h-64 animate-pulse rounded-3xl bg-white" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#faf9f7] p-8">
      <div className="mx-auto max-w-4xl rounded-2xl bg-[#faf9f7] p-12">
        {showDraftBanner ? (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-4">
            <span className="text-sm font-semibold text-amber-800">You have an unsaved draft. Continue where you left off?</span>
            <button
              type="button"
              onClick={() => {
                sessionStorage.removeItem('mission-wizard-draft')
                setState(initialState)
                setShowDraftBanner(false)
              }}
              className="text-sm font-bold text-amber-700 hover:text-amber-900 underline"
            >
              Clear draft
            </button>
          </div>
        ) : null}
        <StepIndicator step={step} />

        <div className="mb-8 inline-flex rounded-full bg-[#d77a57]/10 px-4 py-2 text-sm font-bold text-[#d77a57]">
          {state.difficulty} — {formatCoins(coinRates[state.difficulty])} coins per tester
        </div>

        <h2 className="mb-8 text-3xl font-black text-[#1a1625]">
          {step === 1 ? 'Mission Brief' : step === 2 ? 'Mission Setup' : step === 3 ? 'Questions' : 'Review'}
        </h2>

        {step === 1 ? (
          <div className="space-y-8">
            <div data-field-key="title">
              <label className="mb-3 block text-xs font-semibold uppercase tracking-wide text-[#9b98a8]">GIVE YOUR MISSION A TITLE</label>
              <input
                value={state.title}
                onChange={(event) => updateState((current) => ({ ...current, title: event.target.value }))}
                placeholder="e.g. First impression test for our onboarding flow"
                className={textFieldClass}
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-red-600">{errors.title}</span>
                <span className="text-sm text-[#9b98a8]">{state.title.length}/100</span>
              </div>
            </div>

            <div data-field-key="goal">
              <label className="mb-3 block text-xs font-semibold uppercase tracking-wide text-[#9b98a8]">WHAT DO YOU WANT TO LEARN?</label>
              <textarea
                value={state.goal}
                onBlur={handleGoalBlur}
                onChange={(event) => updateState((current) => ({ ...current, goal: event.target.value }))}
                rows={5}
                className={`${textFieldClass} resize-none`}
              />
              <div className="mt-2 flex items-center justify-between">
                <span className={`text-sm ${errors.goal ? 'text-red-600' : 'text-amber-700'}`}>{errors.goal || goalWarning}</span>
                <span className="text-sm text-[#9b98a8]">{state.goal.length}/300</span>
              </div>
            </div>

            <div>
              <label className="mb-3 block text-xs font-semibold uppercase tracking-wide text-[#9b98a8]">DIFFICULTY</label>
              <div className="grid gap-4 md:grid-cols-3">
                {([
                  { value: 'EASY', price: '500 coins per tester', note: 'Quick impressions' },
                  { value: 'MEDIUM', price: '1,500 coins per tester', note: 'Detailed feedback' },
                  { value: 'HARD', price: '3,000 coins per tester', note: 'Complex analysis' },
                ] as const).map((difficulty) => (
                  <button
                    key={difficulty.value}
                    type="button"
                    onClick={() => updateState((current) => ({ ...current, difficulty: difficulty.value }))}
                    className={`rounded-3xl p-6 text-left transition-all ${state.difficulty === difficulty.value ? 'border-2 border-[#d77a57] bg-[#fdf8f6]' : 'border-2 border-[#e5e4e0] bg-white'}`}
                  >
                    <div className="mb-2 text-xl font-black text-[#1a1625]">{difficulty.value}</div>
                    <div className="text-sm font-bold text-[#d77a57]">{difficulty.price}</div>
                    <div className="mt-2 text-sm text-[#6b687a]">{difficulty.note}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-8">
            <div className="rounded-3xl border border-[#e5e4e0] bg-white p-6">
              <label className="mb-3 block text-xs font-semibold uppercase tracking-wide text-[#9b98a8]">ESTIMATED MINUTES</label>
              <input type="range" min={2} max={4} step={1} value={state.estimatedMinutes} onChange={(event) => updateState((current) => ({ ...current, estimatedMinutes: Number(event.target.value) }))} className="w-full accent-[#d77a57]" />
              <div className="mt-4 text-center">
                <div className="text-2xl font-black text-[#1a1625]">{state.estimatedMinutes} minutes</div>
                <p className="mt-1 text-sm text-[#9b98a8]">Missions must be 2–4 minutes</p>
              </div>
            </div>

            <div className="rounded-3xl border border-[#e5e4e0] bg-white p-6">
              <label className="mb-3 block text-xs font-semibold uppercase tracking-wide text-[#9b98a8]">NUMBER OF TESTERS</label>
              <input type="range" min={5} max={50} step={1} value={state.testersRequired} onChange={(event) => updateState((current) => ({ ...current, testersRequired: Number(event.target.value) }))} className="w-full accent-[#d77a57]" />
              <div className="mt-4 text-center text-2xl font-black text-[#1a1625]">{state.testersRequired} testers</div>
            </div>

            <div className="rounded-3xl bg-gradient-to-br from-[#1a1625] to-[#2d2840] p-6 text-white">
              <div className="mb-4 text-xs font-bold uppercase tracking-wide text-white/50">LIVE COST ESTIMATE</div>
              <div className="space-y-3">
                <div className="flex items-center justify-between"><span>{formatCoins(coinRates[state.difficulty])} × {state.testersRequired} testers</span><span className="font-bold">{formatCoins(subtotal)} coins</span></div>
                <div className="flex items-center justify-between"><span>Platform fee (20%)</span><span className="font-bold">+ {formatCoins(fee)} coins</span></div>
                <div className="my-3 border-t border-white/20" />
                <div className="flex items-center justify-between"><span className="text-xl font-black">TOTAL</span><div className="text-right"><div className="text-xl font-black">{formatCoins(total)} coins</div><div className="text-sm text-white/70">≈ ₹{(total / 100).toFixed(0)}</div></div></div>
              </div>
            </div>

            {coinBalance < total ? <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">You need {formatCoins(total - coinBalance)} more coins (≈ ₹{((total - coinBalance) / 100).toFixed(0)}). Buy coins before launching.</div> : null}

            <div className="space-y-4">
              {state.assets.map((asset, index) => (
                <div key={index} className="rounded-3xl border border-[#e5e4e0] bg-white p-6" data-field-key={`asset-${index}`}>
                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    {(['LINK', 'SCREENSHOT', 'VIDEO', 'TEXT'] as const).map((type) => (
                      <button key={type} type="button" onClick={() => updateState((current) => ({ ...current, assets: current.assets.map((currentAsset, assetIndex) => assetIndex === index ? { type, url: '', text: '', label: currentAsset.label ?? '' } : currentAsset) }))} className={`rounded-full px-3 py-1 text-xs font-bold ${asset.type === type ? 'bg-blue-100 text-blue-700' : 'bg-[#f3f3f5] text-[#6b687a]'}`}>{type}</button>
                    ))}
                    {state.assets.length > 1 ? <button type="button" className="ml-auto text-[#9b98a8]" onClick={() => updateState((current) => ({ ...current, assets: current.assets.filter((_, assetIndex) => assetIndex !== index) }))}>×</button> : null}
                  </div>

                  {asset.type === 'TEXT' ? (
                    <textarea value={asset.text ?? ''} onChange={(event) => updateState((current) => ({ ...current, assets: current.assets.map((currentAsset, assetIndex) => assetIndex === index ? { ...currentAsset, text: event.target.value } : currentAsset) }))} rows={3} className={`${textFieldClass} resize-none`} />
                  ) : (
                    <div className="relative">
                      <input value={asset.url ?? ''} onBlur={() => void handleAssetReachability(index)} onChange={(event) => updateState((current) => ({ ...current, assets: current.assets.map((currentAsset, assetIndex) => assetIndex === index ? { ...currentAsset, url: event.target.value } : currentAsset) }))} placeholder="https://example.com" className={textFieldClass} />
                      {assetChecks[index] === 'ok' ? <span className="absolute right-4 top-1/2 -translate-y-1/2 text-green-600">✓</span> : null}
                      {assetChecks[index] === 'warning' ? <span className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-600">!</span> : null}
                    </div>
                  )}

                  <input value={asset.label ?? ''} onChange={(event) => updateState((current) => ({ ...current, assets: current.assets.map((currentAsset, assetIndex) => assetIndex === index ? { ...currentAsset, label: event.target.value } : currentAsset) }))} placeholder="Optional label" className={`${textFieldClass} mt-3`} />
                  <p className="mt-1 text-sm text-red-600">{errors[`asset-${index}`]}</p>
                </div>
              ))}

              {state.assets.length < 3 ? <button type="button" className="text-sm font-semibold text-[#d77a57] hover:underline" onClick={() => updateState((current) => ({ ...current, assets: [...current.assets, { type: 'LINK', url: '', label: '' }] }))}>+ Add another asset</button> : null}
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-6">
            {state.questions.map((question, index) => (
              <div key={index} className="rounded-3xl border border-[#e5e4e0] bg-white p-6" data-field-key={`question-${index}`}>
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-sm font-bold text-[#d77a57]">QUESTION {index + 1}</div>
                  {state.questions.length > 1 ? <button type="button" className="text-[#9b98a8]" onClick={() => updateState((current) => ({ ...current, questions: current.questions.filter((_, questionIndex) => questionIndex !== index) }))}>×</button> : null}
                </div>
                <input value={question.text} onChange={(event) => updateState((current) => ({ ...current, questions: current.questions.map((currentQuestion, questionIndex) => questionIndex === index ? { ...currentQuestion, text: event.target.value } : currentQuestion) }))} placeholder="e.g. What was your first impression?" className={textFieldClass} />
                <p className="mt-1 text-sm text-red-600">{errors[`question-${index}`]}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {([
                    ['TEXT_SHORT', 'Short text'],
                    ['TEXT_LONG', 'Long text'],
                    ['RATING_1_5', 'Rating'],
                    ['MULTIPLE_CHOICE', 'Multiple choice'],
                    ['YES_NO', 'Yes/No'],
                  ] as const).map(([type, label]) => (
                    <button key={type} type="button" onClick={() => updateState((current) => ({ ...current, questions: current.questions.map((currentQuestion, questionIndex) => questionIndex === index ? { ...currentQuestion, type, options: type === 'MULTIPLE_CHOICE' ? currentQuestion.options && currentQuestion.options.length >= 2 ? currentQuestion.options : ['', ''] : undefined } : currentQuestion) }))} className={`rounded-full px-3 py-1 text-sm font-semibold ${question.type === type ? 'bg-[#d77a57]/10 text-[#d77a57]' : 'bg-[#f3f3f5] text-[#6b687a]'}`}>{label}</button>
                  ))}
                </div>

                {question.type === 'MULTIPLE_CHOICE' ? (
                  <div className="mt-4 space-y-3">
                    {(question.options ?? []).map((option, optionIndex) => (
                      <div key={optionIndex} className="flex items-center gap-3">
                        <input value={option} onChange={(event) => updateState((current) => ({ ...current, questions: current.questions.map((currentQuestion, questionIndex) => questionIndex === index ? { ...currentQuestion, options: (currentQuestion.options ?? []).map((currentOption, currentOptionIndex) => currentOptionIndex === optionIndex ? event.target.value : currentOption) } : currentQuestion) }))} className={textFieldClass} />
                        {(question.options?.length ?? 0) > 2 ? <button type="button" className="text-[#9b98a8]" onClick={() => updateState((current) => ({ ...current, questions: current.questions.map((currentQuestion, questionIndex) => questionIndex === index ? { ...currentQuestion, options: (currentQuestion.options ?? []).filter((_, currentOptionIndex) => currentOptionIndex !== optionIndex) } : currentQuestion) }))}>×</button> : null}
                      </div>
                    ))}
                    <p className="text-sm text-red-600">{errors[`question-options-${index}`]}</p>
                    {(question.options?.length ?? 0) < 5 ? <button type="button" className="text-sm font-semibold text-[#d77a57] hover:underline" onClick={() => updateState((current) => ({ ...current, questions: current.questions.map((currentQuestion, questionIndex) => questionIndex === index ? { ...currentQuestion, options: [...(currentQuestion.options ?? []), ''] } : currentQuestion) }))}>+ Add option</button> : null}
                  </div>
                ) : null}

                <div className="mt-4 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-[#6b687a]"><input type="checkbox" checked={question.required} onChange={(event) => updateState((current) => ({ ...current, questions: current.questions.map((currentQuestion, questionIndex) => questionIndex === index ? { ...currentQuestion, required: event.target.checked } : currentQuestion) }))} />Required</label>
                  <div className="flex items-center gap-2">
                    <button type="button" disabled={index === 0} className="text-sm text-[#6b687a] disabled:opacity-40" onClick={() => updateState((current) => { const questions = [...current.questions];[questions[index - 1], questions[index]] = [questions[index], questions[index - 1]]; return { ...current, questions } })}>↑</button>
                    <button type="button" disabled={index === state.questions.length - 1} className="text-sm text-[#6b687a] disabled:opacity-40" onClick={() => updateState((current) => { const questions = [...current.questions];[questions[index], questions[index + 1]] = [questions[index + 1], questions[index]]; return { ...current, questions } })}>↓</button>
                  </div>
                </div>
              </div>
            ))}

            {state.questions.length < 6 ? <button type="button" className={`px-6 py-3 ${primaryButtonClass}`} onClick={() => updateState((current) => ({ ...current, questions: [...current.questions, { text: '', type: 'TEXT_SHORT', required: true, order: current.questions.length }] }))}>+ ADD QUESTION</button> : null}
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-6">
            <div className="rounded-3xl border border-[#e5e4e0] bg-white p-6">
              <div className="mb-2 text-sm font-bold text-[#d77a57]">TITLE</div>
              <div className="text-xl font-black text-[#1a1625]">{state.title}</div>
            </div>
            <div className="rounded-3xl border border-[#e5e4e0] bg-white p-6">
              <div className="mb-2 text-sm font-bold text-[#d77a57]">GOAL</div>
              <p className="text-[#1a1625]">{state.goal}</p>
            </div>
            <div className="rounded-3xl bg-gradient-to-br from-[#1a1625] to-[#2d2840] p-6 text-white">
              <div className="mb-4 text-xs font-bold uppercase tracking-wide text-white/50">COST BREAKDOWN</div>
              <div className="space-y-3">
                <div className="flex items-center justify-between"><span>{formatCoins(coinRates[state.difficulty])} × {state.testersRequired} testers</span><span className="font-bold">{formatCoins(subtotal)} coins</span></div>
                <div className="flex items-center justify-between"><span>Platform fee (20%)</span><span className="font-bold">+ {formatCoins(fee)} coins</span></div>
                <div className="my-3 border-t border-white/20" />
                <div className="flex items-center justify-between"><span className="text-xl font-black">TOTAL</span><span className="text-xl font-black">{formatCoins(total)} coins</span></div>
              </div>
            </div>
            {reviewAssets}
            {reviewQuestions}
            {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}
          </div>
        ) : null}

        <div className="mt-8 flex items-center justify-between border-t border-[#e5e4e0] pt-6">
          <button
            type="button"
            className="font-semibold text-[#6b687a] hover:text-[#1a1625]"
            onClick={() => {
              if (step === 1) {
                router.push('/dashboard/founder')
              } else {
                setStep((current) => current - 1)
              }
            }}
          >
            ← Back
          </button>
          {step < 4 ? (
            <button type="button" className={`px-8 py-3.5 ${primaryButtonClass}`} onClick={handleNext}>
              CONTINUE →
            </button>
          ) : (
            <div className="flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                disabled={pendingAction !== null}
                className={`flex items-center gap-2 px-6 py-3.5 ${outlineButtonClass}`}
                onClick={() => void handleSave('draft')}
              >
                {pendingAction === 'draft' ? <SpinnerIcon className="w-5 h-5" /> : null}
                {isEditMode ? 'SAVE CHANGES' : 'SAVE AS DRAFT'}
              </button>
              <button
                type="button"
                disabled={pendingAction !== null}
                className={`flex items-center gap-2 px-8 py-3.5 ${primaryButtonClass}`}
                onClick={() => void handleSave('submit')}
              >
                {pendingAction === 'submit' ? <SpinnerIcon className="w-5 h-5" /> : null}
                {isEditMode ? 'SUBMIT FOR REVIEW' : 'SAVE & SUBMIT FOR REVIEW'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function MissionWizardPage() {
  return (
    <RequireAuth role="FOUNDER">
      <MissionWizardContent />
    </RequireAuth>
  )
}
