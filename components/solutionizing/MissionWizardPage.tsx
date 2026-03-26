"use client"

import { CheckCircle, XCircle } from 'lucide-react'
import posthog from 'posthog-js'
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from '@/components/ui/sonner'
import { apiFetch, isApiClientError } from '@/lib/api/client'
import { RequireAuth } from '@/components/RequireAuth'
import { ApiMissionDetail, WizardAsset, WizardQuestion } from '@/types/api'
import { ModalShell, SpinnerIcon, StarRow, WizardStepSkeleton, formatCoins, outlineButtonClass, primaryButtonClass, textFieldClass } from '@/components/solutionizing/ui'

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

const questionTypeDescriptions: Record<WizardQuestion['type'], string> = {
  TEXT_SHORT: 'Testers type a short answer (up to 500 characters)',
  TEXT_LONG: 'Testers write a detailed response (up to 1,000 characters)',
  RATING_1_5: 'Testers pick a star rating from 1 to 5',
  MULTIPLE_CHOICE: 'Testers pick one option from your list',
  YES_NO: 'Testers answer yes or no',
}

const questionTypeUseCases: Record<WizardQuestion['type'], string> = {
  TEXT_SHORT: "Good for: 'What was your first reaction when you landed on the page?'",
  TEXT_LONG: "Good for: 'Walk us through what you tried to do and where you got stuck.'",
  RATING_1_5: "Good for: 'How trustworthy did the pricing page feel?'",
  MULTIPLE_CHOICE: "Good for: 'Which of these best describes why you wouldn't sign up?'",
  YES_NO: "Good for: 'Did you understand what this product does within 10 seconds?'",
}

const questionTemplates: Array<{
  title: string
  description: string
  question: Omit<WizardQuestion, 'order'>
}> = [
  {
    title: 'First impression',
    description: 'Capture the earliest reaction before testers overthink it.',
    question: {
      text: 'What stood out to you first when you opened this experience?',
      type: 'TEXT_SHORT',
      required: true,
    },
  },
  {
    title: 'Confusion check',
    description: 'Find the exact moment where the flow stopped making sense.',
    question: {
      text: 'What felt confusing, unclear, or harder than you expected?',
      type: 'TEXT_LONG',
      required: true,
    },
  },
  {
    title: 'Trust pulse',
    description: 'Measure whether the experience feels credible enough to continue.',
    question: {
      text: 'How trustworthy did this feel overall?',
      type: 'RATING_1_5',
      required: true,
    },
  },
  {
    title: 'Next-step intent',
    description: 'Understand whether the product motivates action.',
    question: {
      text: 'Which best describes your willingness to take the next step?',
      type: 'MULTIPLE_CHOICE',
      options: ['Ready to continue', 'Maybe, but I need more clarity', 'Not likely to continue'],
      required: true,
    },
  },
]

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
      <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div className="h-full rounded-full bg-[#d77a57]" style={{ width: `${(step / 4) * 100}%` }} />
      </div>
      <div className="flex items-center justify-between text-sm">
        <div className={step >= 1 ? 'font-bold text-[#d77a57]' : 'text-[#9b98a8] dark:text-gray-500'}>Brief</div>
        <div className={step >= 2 ? 'font-black text-[#1a1625] dark:text-white' : 'text-[#9b98a8] dark:text-gray-500'}>Setup</div>
        <div className={step >= 3 ? 'font-black text-[#1a1625] dark:text-white' : 'text-[#9b98a8] dark:text-gray-500'}>Questions</div>
        <div className={step >= 4 ? 'font-black text-[#1a1625] dark:text-white' : 'text-[#9b98a8] dark:text-gray-500'}>Review</div>
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
  const editParam = searchParams.get('edit')
  const missionIdParam = searchParams.get('missionId')
  const legacyEditMissionId = editParam && editParam !== 'true' ? editParam : null
  const editMissionId = missionIdParam ?? legacyEditMissionId
  const isEditMode = editParam === 'true' ? Boolean(missionIdParam) : Boolean(editMissionId)
  const [step, setStep] = useState(1)
  const [state, setState] = useState<WizardState>(initialState)
  const [showDraftBanner, setShowDraftBanner] = useState(false)
  const [showRejectedBanner, setShowRejectedBanner] = useState(false)
  const [rejectedReviewNote, setRejectedReviewNote] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [goalWarning, setGoalWarning] = useState('')
  const [assetChecks, setAssetChecks] = useState<Record<number, 'checking' | 'reachable' | 'unreachable'>>({})
  const [coinBalance, setCoinBalance] = useState(0)
  const [isBalanceLoading, setIsBalanceLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [pendingAction, setPendingAction] = useState<'draft' | 'submit' | null>(null)
  const [submitError, setSubmitError] = useState('')
  const [exitAction, setExitAction] = useState<'draft' | 'delete' | null>(null)
  const dirtyRef = useRef(false)
  const [exitDialogOpen, setExitDialogOpen] = useState(false)
  const [exitError, setExitError] = useState('')
  const hydratedStateRef = useRef<WizardState>(initialState)
  const draftStorageKey = useMemo(
    () => (editMissionId ? `mission-wizard-draft:${editMissionId}` : 'mission-wizard-draft'),
    [editMissionId]
  )
  const refreshFlagKey = useMemo(
    () => (editMissionId ? `solutionizing-draft-refresh:${editMissionId}` : 'solutionizing-draft-refresh'),
    [editMissionId]
  )

  const subtotal = coinRates[state.difficulty] * state.testersRequired
  const fee = Math.ceil(subtotal * 0.2)
  const total = subtotal + fee

  const clearLocalDraft = useCallback(() => {
    sessionStorage.removeItem(draftStorageKey)
    sessionStorage.removeItem(refreshFlagKey)
  }, [draftStorageKey, refreshFlagKey])

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
      hydratedStateRef.current = initialState

      if (!isEditMode || !editMissionId) {
        try {
          const draftJson = sessionStorage.getItem(draftStorageKey)
          if (draftJson) {
            const draft = JSON.parse(draftJson)
            setState(draft)
            setShowDraftBanner(true)
          } else {
            setState(initialState)
            setShowDraftBanner(false)
          }
        } catch {
          // ignore
        }
        dirtyRef.current = false
        setIsLoading(false)
        return
      }

      try {
        const mission = await apiFetch<ApiMissionDetail>(`/api/v1/missions/${editMissionId}`)
        if (mission.status !== 'DRAFT' && mission.status !== 'REJECTED') {
          toast.info('This mission can no longer be edited.')
          router.replace('/dashboard/founder')
          return
        }
        const baseState = toFrontendMission(mission)
        hydratedStateRef.current = baseState
        const draftJson = sessionStorage.getItem(draftStorageKey)
        if (draftJson) {
          try {
            setState(JSON.parse(draftJson))
            setShowDraftBanner(true)
          } catch {
            setState(baseState)
            setShowDraftBanner(false)
          }
        } else {
          setState(baseState)
          setShowDraftBanner(false)
        }
        if (mission.status === 'REJECTED') {
          setRejectedReviewNote(
            mission.reviewNote ?? 'Your mission was rejected. Review the feedback and update it before resubmitting.'
          )
          setShowRejectedBanner(true)
        } else {
          setRejectedReviewNote(null)
          setShowRejectedBanner(false)
        }
      } catch {
        router.replace('/dashboard/founder')
      } finally {
        dirtyRef.current = false
        setIsLoading(false)
      }
    }

    void initialize()
  }, [draftStorageKey, editMissionId, isEditMode, router])

  useEffect(() => {
    if (sessionStorage.getItem(refreshFlagKey) === '1') {
      toast.info("Your draft wasn't saved yet.")
      sessionStorage.removeItem(refreshFlagKey)
    }
  }, [refreshFlagKey])

  useEffect(() => {
    if (step !== 2) {
      return
    }

    async function refreshBalance() {
      setIsBalanceLoading(true)

      try {
        await loadBalance()
      } finally {
        setIsBalanceLoading(false)
      }
    }

    void refreshBalance()
  }, [loadBalance, step])

  useEffect(() => {
    const onBeforeUnload = () => {
      if (dirtyRef.current) {
        sessionStorage.setItem(refreshFlagKey, '1')
      }
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [refreshFlagKey])

  const updateState = useCallback((updater: (current: WizardState) => WizardState) => {
    dirtyRef.current = true
    setState((current) => {
      const nextState = updater(current)
      sessionStorage.setItem(draftStorageKey, JSON.stringify(nextState))
      return nextState
    })
  }, [draftStorageKey])

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

    setAssetChecks((current) => ({ ...current, [index]: 'checking' }))

    try {
      await fetch(asset.url, { method: 'HEAD', mode: 'no-cors' })
      setAssetChecks((current) => ({ ...current, [index]: 'reachable' }))
    } catch {
      setAssetChecks((current) => ({ ...current, [index]: 'unreachable' }))
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

      if (!isEditMode) {
        posthog.capture('mission_created', {
          difficulty: mission.difficulty,
          testersRequired: mission.testersRequired,
        })
      }

      clearLocalDraft()
      dirtyRef.current = false
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
        <div key={`${asset.type}-${index}`} className="rounded-card border border-[#e5e4e0] bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-2 text-sm font-bold text-[#d77a57]">ASSET {index + 1}</div>
          <div className="mb-2 text-lg font-black text-[#1a1625] dark:text-white">{asset.type}</div>
          <p className="break-words text-sm text-[#6b687a] dark:text-gray-400">
            {asset.type === 'TEXT' ? asset.text : asset.url}
          </p>
          {asset.label?.trim() ? (
            <p className="mt-3 text-sm font-semibold text-[#1a1625] dark:text-white">Label: {asset.label.trim()}</p>
          ) : null}
        </div>
      )),
    [state.assets]
  )

  const reviewQuestions = useMemo(
    () =>
      state.questions.map((question, index) => (
        <div key={index} className="rounded-card border border-[#e5e4e0] bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-2 text-sm font-bold text-[#d77a57]">QUESTION {index + 1}</div>
          <div className="mb-2 text-lg font-black text-[#1a1625] dark:text-white">{question.text}</div>
          <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-[#9b98a8] dark:text-gray-500">Tester will see</div>
          {question.type === 'TEXT_SHORT' ? (
            <input
              type="text"
              disabled
              placeholder="Tester's answer..."
              className={`${textFieldClass} opacity-50 cursor-not-allowed mt-3`}
            />
          ) : null}
          {question.type === 'TEXT_LONG' ? (
            <textarea
              disabled
              rows={3}
              placeholder="Tester's detailed response..."
              className={`${textFieldClass} opacity-50 cursor-not-allowed resize-none mt-3`}
            />
          ) : null}
          {question.type === 'RATING_1_5' ? (
            <div className="mt-3">
              <StarRow value={0} readonly={true} size={28} />
            </div>
          ) : null}
          {question.type === 'YES_NO' ? (
            <div className="mt-3 flex gap-3">
              <button disabled className="rounded-2xl border-2 border-[#e5e4e0] px-6 py-2 text-sm font-bold text-[#9b98a8] dark:border-gray-700 dark:text-gray-500">
                Yes
              </button>
              <button disabled className="rounded-2xl border-2 border-[#e5e4e0] px-6 py-2 text-sm font-bold text-[#9b98a8] dark:border-gray-700 dark:text-gray-500">
                No
              </button>
            </div>
          ) : null}
          {question.type === 'MULTIPLE_CHOICE' ? (
            <div className="mt-3 space-y-2">
              {(question.options ?? []).map((opt, optionIndex) => (
                <div
                  key={optionIndex}
                  className="rounded-2xl border-2 border-[#e5e4e0] px-4 py-2 text-sm text-[#9b98a8] dark:border-gray-700 dark:text-gray-500"
                >
                  {opt || `Option ${optionIndex + 1}`}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )),
    [state.questions]
  )

  function handleBack() {
    if (step === 1) {
      return
    }

    setStep((current) => current - 1)
  }

  async function handleExitSaveDraft() {
    setExitAction('draft')
    setExitError('')
    const validationErrors = getMissionValidationErrors(state)

    if (Object.keys(validationErrors).length === 0) {
      setExitDialogOpen(false)
      await handleSave('draft')
      setExitAction(null)
      return
    }

    try {
      sessionStorage.setItem(draftStorageKey, JSON.stringify(state))
      sessionStorage.removeItem(refreshFlagKey)
      dirtyRef.current = false
      setExitDialogOpen(false)
      toast.success('Draft saved locally. You can continue it later.')
      router.push('/dashboard/founder')
    } catch {
      setExitError('We could not save this draft. Try again.')
    } finally {
      setExitAction(null)
    }
  }

  async function handleExitDelete() {
    setExitAction('delete')
    setExitError('')

    try {
      clearLocalDraft()
      dirtyRef.current = false

      if (isEditMode && editMissionId) {
        await apiFetch(`/api/v1/missions/${editMissionId}`, { method: 'DELETE' })
        toast.success('Mission deleted.')
      } else {
        toast.success('Draft discarded.')
      }

      setExitDialogOpen(false)
      router.push('/dashboard/founder')
    } catch (error) {
      if (isApiClientError(error)) {
        setExitError(error.message)
      } else {
        setExitError('We could not delete this mission. Try again.')
      }
    } finally {
      setExitAction(null)
    }
  }

  function insertQuestionTemplate(template: typeof questionTemplates[number]) {
    updateState((current) => {
      const nextQuestion: WizardQuestion = {
        ...template.question,
        options: template.question.options ? [...template.question.options] : undefined,
        order: current.questions.length,
      }
      const shouldReplaceStarter =
        current.questions.length === 1 &&
        !current.questions[0].text.trim() &&
        current.questions[0].type === 'TEXT_SHORT' &&
        current.questions[0].required

      const nextQuestions = shouldReplaceStarter
        ? [{ ...nextQuestion, order: 0 }]
        : [...current.questions, nextQuestion].slice(0, 6)

      return {
        ...current,
        questions: nextQuestions.map((question, index) => ({
          ...question,
          options: question.options ? [...question.options] : undefined,
          order: index,
        })),
      }
    })
  }

  function renderStepNavigation(position: 'top' | 'bottom') {
    const containerClass =
      position === 'top'
        ? 'mb-8 flex items-center justify-between border-b border-[#e5e4e0] pb-4 dark:border-gray-700'
        : 'mt-5 flex items-center justify-between border-t border-[#e5e4e0] pt-4 dark:border-gray-700'
    const canGoBack = step > 1

    return (
      <div className={containerClass}>
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="font-semibold text-[#d77a57] hover:text-[#c4673f] dark:text-[#f0a98c] dark:hover:text-white"
            onClick={() => {
              setExitError('')
              setExitDialogOpen(true)
            }}
          >
            EXIT
          </button>
          <button
            type="button"
            disabled={!canGoBack}
            className="font-semibold text-[#6b687a] hover:text-[#1a1625] disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-400 dark:hover:text-white"
            onClick={handleBack}
          >
            {'<- Back'}
          </button>
        </div>
        {step < 4 ? (
          <button type="button" className={`px-8 py-3.5 ${primaryButtonClass}`} onClick={handleNext}>
            {'CONTINUE ->'}
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
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#faf9f7] p-8 dark:bg-gray-900">
        <div className="mx-auto max-w-4xl space-y-6">
          <WizardStepSkeleton step={1} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#faf9f7] p-8 dark:bg-gray-900">
      <div className="mx-auto max-w-4xl rounded-panel bg-[#faf9f7] p-12 dark:bg-gray-900/60">
        {showDraftBanner ? (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/70 dark:bg-amber-950/40">
            <span className="text-sm font-semibold text-amber-800 dark:text-amber-100">You have an unsaved draft. Continue where you left off?</span>
            <button
              type="button"
              onClick={() => {
                clearLocalDraft()
                dirtyRef.current = false
                setState(hydratedStateRef.current)
                setShowDraftBanner(false)
              }}
              className="text-sm font-bold text-amber-700 underline hover:text-amber-900 dark:text-amber-200 dark:hover:text-amber-100"
            >
              Clear draft
            </button>
          </div>
        ) : null}
        {showRejectedBanner ? (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/70 dark:bg-amber-950/40">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                  This mission was rejected. Review the feedback below, make your changes, and resubmit for review.
                </p>
                <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">{rejectedReviewNote}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowRejectedBanner(false)}
                className="text-sm font-bold text-amber-700 underline hover:text-amber-900 dark:text-amber-200 dark:hover:text-amber-100"
              >
                Dismiss
              </button>
            </div>
          </div>
        ) : null}
        <StepIndicator step={step} />

        <div className="mb-8 inline-flex rounded-full bg-[#d77a57]/10 px-4 py-2 text-sm font-bold text-[#d77a57]">
          {state.difficulty} — {formatCoins(coinRates[state.difficulty])} coins per tester
        </div>

        <h2 className="mb-8 text-3xl font-black text-[#1a1625] dark:text-white">
          {step === 1 ? 'Mission Brief' : step === 2 ? 'Mission Setup' : step === 3 ? 'Questions' : 'Review'}
        </h2>

        {renderStepNavigation('top')}

        {step === 1 ? (
          <div className="space-y-8">
            <div data-field-key="title">
              <label className="mb-3 block text-xs font-semibold uppercase tracking-wide text-[#9b98a8] dark:text-gray-400">GIVE YOUR MISSION A TITLE</label>
              <input
                value={state.title}
                onChange={(event) => updateState((current) => ({ ...current, title: event.target.value }))}
                placeholder="e.g. First impression test for our onboarding flow"
                className={textFieldClass}
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-red-600 dark:text-red-400">{errors.title}</span>
                <span className="text-sm text-[#9b98a8] dark:text-gray-400">{state.title.length}/100</span>
              </div>
            </div>

            <div data-field-key="goal">
              <label className="mb-3 block text-xs font-semibold uppercase tracking-wide text-[#9b98a8] dark:text-gray-400">WHAT DO YOU WANT TO LEARN?</label>
              <textarea
                value={state.goal}
                onBlur={handleGoalBlur}
                onChange={(event) => updateState((current) => ({ ...current, goal: event.target.value }))}
                placeholder="e.g. I want to know if first-time visitors understand what we do within 10 seconds, and whether the pricing page feels trustworthy."
                rows={5}
                className={`${textFieldClass} resize-none`}
              />
              <div className="mt-2 flex items-center justify-between">
                <span className={`text-sm ${errors.goal ? 'text-red-600 dark:text-red-400' : 'text-amber-700 dark:text-amber-300'}`}>{errors.goal || goalWarning}</span>
                <span className="text-sm text-[#9b98a8] dark:text-gray-400">{state.goal.length}/300</span>
              </div>
              <div className="mt-3 rounded-2xl border border-[#e5e4e0] bg-[#faf9f7] p-4 dark:border-gray-700 dark:bg-gray-800">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#9b98a8] dark:text-gray-500">What makes a good goal?</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 text-green-500">✓</span>
                    <span className="text-[#1a1625] dark:text-white">&quot;Do visitors understand what this product does in under 30 seconds?&quot;</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 text-green-500">✓</span>
                    <span className="text-[#1a1625] dark:text-white">&quot;Does the checkout flow feel confusing or trustworthy?&quot;</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 text-red-400">✗</span>
                    <span className="text-[#9b98a8] dark:text-gray-400">&quot;Give me feedback on my website.&quot; — too vague, testers won&apos;t know what to focus on</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-3 block text-xs font-semibold uppercase tracking-wide text-[#9b98a8] dark:text-gray-400">DIFFICULTY</label>
              <div className="grid gap-4 md:grid-cols-3">
                {([
                  {
                    value: 'EASY',
                    price: '500 coins per tester',
                    note: 'Quick impressions',
                    detail:
                      'Testers spend 2 minutes, visit your link, and answer a few quick questions. Best for first impressions and top-of-funnel clarity.',
                  },
                  {
                    value: 'MEDIUM',
                    price: '1,500 coins per tester',
                    note: 'Detailed feedback',
                    detail:
                      'Testers spend up to 4 minutes, explore key flows, and give structured written feedback. Best for UX and messaging.',
                  },
                  {
                    value: 'HARD',
                    price: '3,000 coins per tester',
                    note: 'Complex analysis',
                    detail:
                      'Testers spend up to 6 minutes, dig into specific features, and write detailed analysis. Best for product decisions and conversion problems.',
                  },
                ] as const).map((difficulty) => (
                  <button
                    key={difficulty.value}
                    type="button"
                    onClick={() => updateState((current) => ({ ...current, difficulty: difficulty.value }))}
                    className={`rounded-card p-6 text-left transition-all ${state.difficulty === difficulty.value ? 'border-2 border-[#d77a57] bg-[#fdf8f6] dark:bg-[#d77a57]/10' : 'border-2 border-[#e5e4e0] bg-white dark:border-gray-700 dark:bg-gray-800'}`}
                    >
                    <div className="mb-2 text-xl font-black text-[#1a1625] dark:text-white">{difficulty.value}</div>
                    <div className="text-sm font-bold text-[#d77a57]">{difficulty.price}</div>
                    <div className="mt-2 text-sm text-[#6b687a] dark:text-gray-400">{difficulty.note}</div>
                    <div className="mt-2 text-xs leading-relaxed text-[#9b98a8] dark:text-gray-500">{difficulty.detail}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-8">
            <div className="rounded-card border border-[#e5e4e0] bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <label className="mb-3 block text-xs font-semibold uppercase tracking-wide text-[#9b98a8] dark:text-gray-400">ESTIMATED MINUTES</label>
              <input type="range" min={2} max={4} step={1} value={state.estimatedMinutes} onChange={(event) => updateState((current) => ({ ...current, estimatedMinutes: Number(event.target.value) }))} className="w-full accent-[#d77a57]" />
              <div className="mt-4 text-center">
                <div className="text-2xl font-black text-[#1a1625] dark:text-white">{state.estimatedMinutes} minutes</div>
                <p className="mt-1 text-sm text-[#9b98a8] dark:text-gray-400">Missions must be 2–4 minutes</p>
              </div>
            </div>

            <div className="rounded-card border border-[#e5e4e0] bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <label className="mb-3 block text-xs font-semibold uppercase tracking-wide text-[#9b98a8] dark:text-gray-400">NUMBER OF TESTERS</label>
              <input type="range" min={5} max={50} step={1} value={state.testersRequired} onChange={(event) => updateState((current) => ({ ...current, testersRequired: Number(event.target.value) }))} className="w-full accent-[#d77a57]" />
              <div className="mt-4 text-center text-2xl font-black text-[#1a1625] dark:text-white">{state.testersRequired} testers</div>
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

            {!isBalanceLoading && coinBalance < total ? <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-100">You need {formatCoins(total - coinBalance)} more coins (≈ ₹{((total - coinBalance) / 100).toFixed(0)}). Buy coins before launching.</div> : null}

            <div className="space-y-4">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-100">
                <p>How to make your mission work: use links that testers can open without logging in, confirm they still work in an incognito window, and if the product needs login, add a TEXT asset with a demo account and password.</p>
              </div>
              {state.assets.map((asset, index) => (
                <div key={index} className="rounded-card border border-[#e5e4e0] bg-white p-6 dark:border-gray-700 dark:bg-gray-800" data-field-key={`asset-${index}`}>
                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    {(['LINK', 'SCREENSHOT', 'VIDEO', 'TEXT'] as const).map((type) => (
                      <button key={type} type="button" onClick={() => updateState((current) => ({ ...current, assets: current.assets.map((currentAsset, assetIndex) => assetIndex === index ? { type, url: '', text: '', label: currentAsset.label ?? '' } : currentAsset) }))} className={`rounded-full px-3 py-1 text-xs font-bold ${asset.type === type ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-[#f3f3f5] text-[#6b687a] dark:bg-gray-700 dark:text-gray-300'}`}>{type}</button>
                    ))}
                    {state.assets.length > 1 ? <button type="button" className="ml-auto text-[#9b98a8] dark:text-gray-400" onClick={() => updateState((current) => ({ ...current, assets: current.assets.filter((_, assetIndex) => assetIndex !== index) }))}>×</button> : null}
                  </div>

                  {asset.type === 'TEXT' ? (
                    <textarea value={asset.text ?? ''} onChange={(event) => updateState((current) => ({ ...current, assets: current.assets.map((currentAsset, assetIndex) => assetIndex === index ? { ...currentAsset, text: event.target.value } : currentAsset) }))} rows={3} className={`${textFieldClass} resize-none`} />
                  ) : (
                    <div className="relative">
                      <input value={asset.url ?? ''} onBlur={() => void handleAssetReachability(index)} onChange={(event) => updateState((current) => ({ ...current, assets: current.assets.map((currentAsset, assetIndex) => assetIndex === index ? { ...currentAsset, url: event.target.value } : currentAsset) }))} placeholder="https://example.com" className={textFieldClass} />
                      {assetChecks[index] === 'checking' ? <SpinnerIcon className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9b98a8]" /> : null}
                      {assetChecks[index] === 'reachable' ? <CheckCircle className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-green-600 dark:text-green-400" /> : null}
                      {assetChecks[index] === 'unreachable' ? <XCircle className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-red-600 dark:text-red-400" /> : null}
                    </div>
                  )}

                  <input value={asset.label ?? ''} onChange={(event) => updateState((current) => ({ ...current, assets: current.assets.map((currentAsset, assetIndex) => assetIndex === index ? { ...currentAsset, label: event.target.value } : currentAsset) }))} placeholder="Optional label" className={`${textFieldClass} mt-3`} />
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors[`asset-${index}`]}</p>
                </div>
              ))}

              {state.assets.length < 3 ? <button type="button" className="text-sm font-semibold text-[#d77a57] hover:underline" onClick={() => updateState((current) => ({ ...current, assets: [...current.assets, { type: 'LINK', url: '', label: '' }] }))}>+ Add another asset</button> : null}
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-6">
            <div className="rounded-card border border-[#e5e4e0] bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#9b98a8] dark:text-gray-400">Suggested templates</p>
                  <h3 className="mt-2 text-xl font-black text-[#1a1625] dark:text-white">Start with proven questions</h3>
                  <p className="mt-2 text-sm text-[#6b687a] dark:text-gray-400">Insert a template, then rewrite it to match your mission. These are generic prompts that work across most tests.</p>
                </div>
                <span className="text-sm font-semibold text-[#d77a57]">{state.questions.length}/6 questions</span>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {questionTemplates.map((template) => (
                  <div key={template.title} className="rounded-2xl border border-[#ece8e1] bg-[#faf9f7] p-4 dark:border-gray-700 dark:bg-gray-900/60">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-[#1a1625] dark:text-white">{template.title}</p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[#d77a57]">{template.question.type.replaceAll('_', ' ')}</p>
                      </div>
                      <button
                        type="button"
                        disabled={state.questions.length >= 6}
                        className="rounded-full border border-[#d77a57]/30 px-3 py-1 text-xs font-bold text-[#d77a57] transition-colors hover:bg-[#d77a57]/10 disabled:cursor-not-allowed disabled:opacity-40 dark:border-[#f0a98c]/30 dark:text-[#f0a98c]"
                        onClick={() => insertQuestionTemplate(template)}
                      >
                        INSERT
                      </button>
                    </div>
                    <p className="mt-3 text-sm text-[#1a1625] dark:text-white">{template.question.text}</p>
                    <p className="mt-2 text-xs text-[#6b687a] dark:text-gray-400">{template.description}</p>
                  </div>
                ))}
              </div>
            </div>
            {state.questions.map((question, index) => (
              <div key={index} className="rounded-card border border-[#e5e4e0] bg-white p-6 dark:border-gray-700 dark:bg-gray-800" data-field-key={`question-${index}`}>
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-sm font-bold text-[#d77a57]">QUESTION {index + 1}</div>
                  {state.questions.length > 1 ? <button type="button" className="text-[#9b98a8] dark:text-gray-400" onClick={() => updateState((current) => ({ ...current, questions: current.questions.filter((_, questionIndex) => questionIndex !== index) }))}>×</button> : null}
                </div>
                <input value={question.text} onChange={(event) => updateState((current) => ({ ...current, questions: current.questions.map((currentQuestion, questionIndex) => questionIndex === index ? { ...currentQuestion, text: event.target.value } : currentQuestion) }))} placeholder="e.g. What was your first impression?" className={textFieldClass} />
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors[`question-${index}`]}</p>
                <p className="mt-2 text-xs text-[#9b98a8] dark:text-gray-500">Ask one specific thing. Vague questions like &quot;What do you think?&quot; produce vague answers. Better: &quot;Did the pricing feel too high, too low, or about right?&quot;</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {([
                    ['TEXT_SHORT', 'Short text'],
                    ['TEXT_LONG', 'Long text'],
                    ['RATING_1_5', 'Rating'],
                    ['MULTIPLE_CHOICE', 'Multiple choice'],
                    ['YES_NO', 'Yes/No'],
                  ] as const).map(([type, label]) => (
                    <button key={type} type="button" onClick={() => updateState((current) => ({ ...current, questions: current.questions.map((currentQuestion, questionIndex) => questionIndex === index ? { ...currentQuestion, type, options: type === 'MULTIPLE_CHOICE' ? currentQuestion.options && currentQuestion.options.length >= 2 ? currentQuestion.options : ['', ''] : undefined } : currentQuestion) }))} className={`rounded-full px-3 py-1 text-sm font-semibold ${question.type === type ? 'bg-[#d77a57]/10 text-[#d77a57] dark:bg-[#d77a57]/20 dark:text-[#f0a98c]' : 'bg-[#f3f3f5] text-[#6b687a] dark:bg-gray-700 dark:text-gray-300'}`}>{label}</button>
                  ))}
                </div>
                {question.type ? <p className="mt-2 text-xs text-[#9b98a8] dark:text-gray-400">{questionTypeDescriptions[question.type]}</p> : null}
                {question.type ? <p className="mt-1 text-xs text-[#d77a57]/80 dark:text-[#f0a98c]/70">{questionTypeUseCases[question.type]}</p> : null}

                {question.type === 'MULTIPLE_CHOICE' ? (
                  <div className="mt-4 space-y-3">
                    {(question.options ?? []).map((option, optionIndex) => (
                      <div key={optionIndex} className="flex items-center gap-3">
                        <input value={option} onChange={(event) => updateState((current) => ({ ...current, questions: current.questions.map((currentQuestion, questionIndex) => questionIndex === index ? { ...currentQuestion, options: (currentQuestion.options ?? []).map((currentOption, currentOptionIndex) => currentOptionIndex === optionIndex ? event.target.value : currentOption) } : currentQuestion) }))} className={textFieldClass} />
                        {(question.options?.length ?? 0) > 2 ? <button type="button" className="text-[#9b98a8] dark:text-gray-400" onClick={() => updateState((current) => ({ ...current, questions: current.questions.map((currentQuestion, questionIndex) => questionIndex === index ? { ...currentQuestion, options: (currentQuestion.options ?? []).filter((_, currentOptionIndex) => currentOptionIndex !== optionIndex) } : currentQuestion) }))}>×</button> : null}
                      </div>
                    ))}
                    <p className="text-sm text-red-600 dark:text-red-400">{errors[`question-options-${index}`]}</p>
                    {(question.options?.length ?? 0) < 5 ? <button type="button" className="text-sm font-semibold text-[#d77a57] hover:underline" onClick={() => updateState((current) => ({ ...current, questions: current.questions.map((currentQuestion, questionIndex) => questionIndex === index ? { ...currentQuestion, options: [...(currentQuestion.options ?? []), ''] } : currentQuestion) }))}>+ Add option</button> : null}
                  </div>
                ) : null}

                <div className="mt-4 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-[#6b687a] dark:text-gray-400"><input type="checkbox" checked={question.required} onChange={(event) => updateState((current) => ({ ...current, questions: current.questions.map((currentQuestion, questionIndex) => questionIndex === index ? { ...currentQuestion, required: event.target.checked } : currentQuestion) }))} />Required</label>
                  <div className="flex items-center gap-2">
                    <button type="button" disabled={index === 0} className="text-sm text-[#6b687a] disabled:opacity-40 dark:text-gray-400" onClick={() => updateState((current) => { const questions = [...current.questions];[questions[index - 1], questions[index]] = [questions[index], questions[index - 1]]; return { ...current, questions } })}>↑</button>
                    <button type="button" disabled={index === state.questions.length - 1} className="text-sm text-[#6b687a] disabled:opacity-40 dark:text-gray-400" onClick={() => updateState((current) => { const questions = [...current.questions];[questions[index], questions[index + 1]] = [questions[index + 1], questions[index]]; return { ...current, questions } })}>↓</button>
                  </div>
                </div>
              </div>
            ))}

            {state.questions.length < 6 ? <button type="button" className={`px-6 py-3 ${primaryButtonClass}`} onClick={() => updateState((current) => ({ ...current, questions: [...current.questions, { text: '', type: 'TEXT_SHORT', required: true, order: current.questions.length }] }))}>+ ADD QUESTION</button> : null}
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-6">
            <div className="rounded-card border border-[#e5e4e0] bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-2 text-sm font-bold text-[#d77a57]">TITLE</div>
              <div className="text-xl font-black text-[#1a1625] dark:text-white">{state.title}</div>
            </div>
            <div className="rounded-card border border-[#e5e4e0] bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-2 text-sm font-bold text-[#d77a57]">GOAL</div>
              <p className="text-[#1a1625] dark:text-white">{state.goal}</p>
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
            {submitError ? <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p> : null}
          </div>
        ) : null}

        {renderStepNavigation('bottom')}
      </div>
      {exitDialogOpen ? (
        <ModalShell
          onClose={() => {
            if (exitAction === null) {
              setExitDialogOpen(false)
              setExitError('')
            }
          }}
        >
          <div className="mx-auto max-w-xl rounded-card border border-[#e5e4e0] bg-white p-8 shadow-2xl dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-6">
              <h3 className="text-2xl font-black text-[#1a1625] dark:text-white">Exit mission wizard?</h3>
              <p className="mt-2 text-sm text-[#6b687a] dark:text-gray-400">
                Save your progress as a draft, delete this mission, or stay here and keep editing.
              </p>
            </div>
            {exitError ? <p className="mb-4 text-sm text-red-600 dark:text-red-400">{exitError}</p> : null}
            <div className="space-y-3">
              <button
                type="button"
                disabled={exitAction !== null}
                className={`flex w-full items-center justify-center gap-2 rounded-[2rem] px-6 py-3.5 ${primaryButtonClass} disabled:pointer-events-none disabled:opacity-70`}
                onClick={() => void handleExitSaveDraft()}
              >
                {exitAction === 'draft' ? <SpinnerIcon className="h-5 w-5" /> : null}
                SAVE AS DRAFT
              </button>
              <button
                type="button"
                disabled={exitAction !== null}
                className="flex w-full items-center justify-center gap-2 rounded-[2rem] bg-gradient-to-r from-red-500 to-red-600 px-6 py-3.5 font-black text-white transition-all hover:scale-[1.02] hover:shadow-lg disabled:pointer-events-none disabled:opacity-70"
                onClick={() => void handleExitDelete()}
              >
                {exitAction === 'delete' ? <SpinnerIcon className="h-5 w-5" /> : null}
                DELETE MISSION
              </button>
              <button
                type="button"
                disabled={exitAction !== null}
                className="w-full rounded-[2rem] border-2 border-[#e5e4e0] bg-[#f3f3f5] px-6 py-3.5 font-black text-[#1a1625] transition-all hover:bg-[#e5e4e0] disabled:pointer-events-none disabled:opacity-70 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                onClick={() => {
                  setExitDialogOpen(false)
                  setExitError('')
                }}
              >
                CANCEL
              </button>
            </div>
          </div>
        </ModalShell>
      ) : null}
    </div>
  )
}

export function MissionWizardPage() {
  return (
    <RequireAuth role="FOUNDER">
      <Suspense fallback={<MissionWizardPageLoading />}>
        <MissionWizardContent />
      </Suspense>
    </RequireAuth>
  )
}

function MissionWizardPageLoading() {
  return (
    <div className="min-h-screen bg-[#faf9f7] p-8 dark:bg-gray-900">
      <div className="mx-auto max-w-4xl rounded-panel bg-[#faf9f7] p-12 dark:bg-gray-900/60">
        <div className="mb-8">
          <div className="mb-4 inline-flex rounded-full bg-[#d77a57]/10 px-4 py-1 text-sm font-bold text-[#d77a57]">
            Step 1 of 4
          </div>
          <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div className="h-full w-1/4 rounded-full bg-[#d77a57]" />
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="font-bold text-[#d77a57]">Brief</div>
            <div className="text-[#9b98a8] dark:text-gray-500">Setup</div>
            <div className="text-[#9b98a8] dark:text-gray-500">Questions</div>
            <div className="text-[#9b98a8] dark:text-gray-500">Review</div>
          </div>
        </div>

        <div className="mb-8 inline-flex rounded-full bg-[#d77a57]/10 px-4 py-2 text-sm font-bold text-[#d77a57]">
          MEDIUM · loading coin rate
        </div>

        <div className="mb-8 h-10 w-60 animate-pulse rounded-full bg-[#e5e4e0] dark:bg-gray-700" />
        <div className="mb-8 flex items-center justify-between border-b border-[#e5e4e0] pb-4 dark:border-gray-700">
          <div className="h-5 w-20 animate-pulse rounded-full bg-[#e5e4e0] dark:bg-gray-700" />
          <div className="h-12 w-36 animate-pulse rounded-[2rem] bg-[#e5e4e0] dark:bg-gray-700" />
        </div>

        <WizardStepSkeleton step={1} />

        <div className="mt-5 flex items-center justify-between border-t border-[#e5e4e0] pt-4 dark:border-gray-700">
          <div className="h-5 w-20 animate-pulse rounded-full bg-[#e5e4e0] dark:bg-gray-700" />
          <div className="h-12 w-36 animate-pulse rounded-[2rem] bg-[#e5e4e0] dark:bg-gray-700" />
        </div>
      </div>
    </div>
  )
}
