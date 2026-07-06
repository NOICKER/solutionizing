"use client"

import { createBrowserClient } from '@supabase/ssr'
import { CheckCircle, XCircle, Trash2, Library } from 'lucide-react'
import Image from 'next/image'
import posthog from 'posthog-js'
import { Fragment, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from '@/components/ui/sonner'
import { apiFetch, isApiClientError } from '@/lib/api/client'
import { RequireAuth } from '@/components/RequireAuth'
import { ApiMissionDetail, WizardAsset, WizardQuestion } from '@/types/api'
import { SpinnerIcon, StarRow, WizardStepSkeleton, formatCoins, outlineButtonClass, primaryButtonClass, textFieldClass } from '@/components/solutionizing/ui'
import { INTERNAL_TEST_ALLOWLIST } from '@/lib/internal-test-allowlist'

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD'

interface WizardState {
 title: string
 goal: string
 difficulty: Difficulty
 estimatedMinutes: number
 testersRequired: number
 timeoutDuration: number
 assets: WizardAsset[]
 questions: WizardQuestion[]
}

interface WizardTemplate {
  id: string
  founder_id: string
  name: string
  config: {
    difficulty: Difficulty
    estimatedMinutes: number
    testersRequired: number
    questions: WizardQuestion[]
  }
  created_at: string
}

/*
create table wizard_templates (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid references auth.users(id) on delete cascade,
  name text not null,
  config jsonb not null,
  created_at timestamptz default now()
);
alter table wizard_templates enable row level security;
create policy "Founders manage own templates" on wizard_templates
  for all using (auth.uid() = founder_id);
*/

interface BalanceResponse {
 balance?: number
 coinBalance?: number
}

interface MissionCostEstimate {
 coinPerTester: number
 coinPlatformFee: number
 coinCostTotal: number
}

interface SignedUploadResponse {
 signedUrl: string
 path: string
 token: string
 publicUrl: string
}

const initialState: WizardState = {
  title: '',
  goal: '',
  difficulty: 'MEDIUM',
  estimatedMinutes: 3,
  testersRequired: 1,
  timeoutDuration: 168,
  assets: [{ type: 'LINK', url: '', label: '' }],
  questions: [{ text: '', type: 'TEXT_SHORT', required: true, order: 0 }],
}

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false)
      return
    }
    if ((window as any).Razorpay) {
      resolve(true)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

const testerDeadlineOptions = [
 { value: 24, label: '24 hours' },
 { value: 72, label: '3 days' },
 { value: 168, label: '7 days' },
 { value: 336, label: '14 days' },
] as const

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

const questionPacks: Array<{
  id: string
  label: string
  questions: Array<Omit<WizardQuestion, 'order'>>
}> = [
  {
    id: 'general-ux',
    label: 'General UX',
    questions: [
      { text: 'What stood out to you first when you opened this experience?', type: 'TEXT_SHORT', required: true },
      { text: 'What felt confusing, unclear, or harder than you expected?', type: 'TEXT_LONG', required: true },
      { text: 'How trustworthy did this feel overall?', type: 'RATING_1_5', required: true },
      { text: 'Did you understand what this product does within 10 seconds?', type: 'YES_NO', required: true },
    ],
  },
  {
    id: 'checkout',
    label: 'Checkout / E-commerce',
    questions: [
      { text: 'Did the pricing feel too high, too low, or about right?', type: 'MULTIPLE_CHOICE', options: ['Too high', 'About right', 'Too low'], required: true },
      { text: 'Was there anything that made you hesitate before completing the purchase?', type: 'TEXT_LONG', required: true },
      { text: 'How confident did you feel that your payment would be handled securely?', type: 'RATING_1_5', required: true },
      { text: 'Did you find everything you needed to make a decision?', type: 'YES_NO', required: true },
    ],
  },
  {
    id: 'onboarding',
    label: 'Onboarding Flow',
    questions: [
      { text: 'At what point did the onboarding start to feel like work?', type: 'TEXT_SHORT', required: true },
      { text: 'Was there a step where you were unsure what to do next?', type: 'YES_NO', required: true },
      { text: 'How easy was it to complete the setup?', type: 'RATING_1_5', required: true },
      { text: 'What would have made the onboarding feel faster or clearer?', type: 'TEXT_LONG', required: true },
    ],
  },
  {
    id: 'landing-page',
    label: 'Landing Page',
    questions: [
      { text: 'What is this product, in your own words?', type: 'TEXT_SHORT', required: true },
      { text: 'Did you understand who this product is for?', type: 'YES_NO', required: true },
      { text: 'How compelling was the main value proposition?', type: 'RATING_1_5', required: true },
      { text: 'What would have made you more likely to sign up or take action?', type: 'TEXT_LONG', required: true },
    ],
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

function trimOptionalString(value?: string) {
 const trimmed = value?.trim()
 return trimmed ? trimmed : undefined
}

function isUploadAssetType(type: WizardAsset['type']): type is 'SCREENSHOT' | 'VIDEO' {
 return type === 'SCREENSHOT' || type === 'VIDEO'
}

function getUploadAssetAccept(type: 'SCREENSHOT' | 'VIDEO') {
 if (type === 'SCREENSHOT') {
 return 'image/*'
 }

 return '.mp4,.mov,.webm,video/mp4,video/quicktime,video/webm'
}

function getUploadAssetButtonLabel(type: 'SCREENSHOT' | 'VIDEO', hasUpload: boolean) {
 const assetName = type === 'SCREENSHOT' ? 'screenshot' : 'video'
 return hasUpload ? `Replace ${assetName}` : `Upload ${assetName}`
}

function getUploadAssetHelperText(type: 'SCREENSHOT' | 'VIDEO') {
 if (type === 'SCREENSHOT') {
 return 'Paste from clipboard or choose an image file'
 }

 return 'Accepted: MP4, MOV, or WEBM'
}

function getUploadAssetContentType(file: File) {
 if (file.type) {
 return file.type
 }

 const extension = file.name.split('.').pop()?.toLowerCase()

 if (extension === 'png') return 'image/png'
 if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg'
 if (extension === 'gif') return 'image/gif'
 if (extension === 'webp') return 'image/webp'
 if (extension === 'bmp') return 'image/bmp'
 if (extension === 'avif') return 'image/avif'
 if (extension === 'heic') return 'image/heic'
 if (extension === 'heif') return 'image/heif'
 if (extension === 'svg') return 'image/svg+xml'
 if (extension === 'mp4') return 'video/mp4'
 if (extension === 'mov') return 'video/quicktime'
 if (extension === 'webm') return 'video/webm'

 return ''
}

function getUploadAssetExtension(contentType: string) {
 if (contentType === 'image/png') return '.png'
 if (contentType === 'image/jpeg') return '.jpg'
 if (contentType === 'image/gif') return '.gif'
 if (contentType === 'image/webp') return '.webp'
 if (contentType === 'image/bmp') return '.bmp'
 if (contentType === 'image/avif') return '.avif'
 if (contentType === 'image/heic') return '.heic'
 if (contentType === 'image/heif') return '.heif'
 if (contentType === 'image/svg+xml') return '.svg'
 if (contentType === 'video/mp4') return '.mp4'
 if (contentType === 'video/quicktime') return '.mov'
 if (contentType === 'video/webm') return '.webm'

 return ''
}

function createUploadFilename(file: File, type: 'SCREENSHOT' | 'VIDEO', contentType: string) {
 const trimmedName = file.name.trim()
 if (trimmedName.includes('.')) {
 return trimmedName
 }

 const extension = getUploadAssetExtension(contentType)
 const baseName = type === 'SCREENSHOT' ? 'pasted-image' : 'pasted-video'
 return `${baseName}${extension}`
}

function getUploadedAssetName(url?: string) {
 if (!url) {
 return ''
 }

 try {
 const path = new URL(url).pathname
 return decodeURIComponent(path.split('/').pop() ?? '')
 } catch {
 return decodeURIComponent(url.split('/').pop() ?? url)
 }
}

function readFileAsDataUrl(file: File) {
 return new Promise<string>((resolve, reject) => {
 const reader = new FileReader()

 reader.onload = () => {
 if (typeof reader.result === 'string') {
 resolve(reader.result)
 return
 }

 reject(new Error('Could not read image preview'))
 }

 reader.onerror = () => {
 reject(reader.error ?? new Error('Could not read image preview'))
 }

 reader.readAsDataURL(file)
 })
}

function removeIndexedEntry<T>(record: Record<number, T>, indexToRemove: number) {
 const nextRecord: Record<number, T> = {}

 for (const [key, value] of Object.entries(record)) {
 const index = Number(key)

 if (index < indexToRemove) {
 nextRecord[index] = value
 } else if (index > indexToRemove) {
 nextRecord[index - 1] = value
 }
 }

 return nextRecord
}

function isAssetDraftBlank(asset: WizardAsset) {
 const label = trimOptionalString(asset.label)

 if (asset.type === 'TEXT') {
 return !trimOptionalString(asset.text) && !label
 }

 return !trimOptionalString(asset.url) && !label
}

function normalizeWizardAsset(asset: WizardAsset): WizardAsset {
 return {
 ...asset,
 url: trimOptionalString(asset.url),
 text: trimOptionalString(asset.text),
 label: trimOptionalString(asset.label),
 }
}

function getCommittedAssets(assets: WizardAsset[]) {
 return assets
 .map((asset, index) => ({
 asset: normalizeWizardAsset(asset),
 index,
 }))
 .filter(({ asset }) => !isAssetDraftBlank(asset))
}

function prepareAssetsForValidation(state: WizardState) {
 const committedAssets = getCommittedAssets(state.assets)

 if (committedAssets.length === 0) {
 return state
 }

 return {
 ...state,
 assets: committedAssets.map(({ asset }) => asset),
 }
}

function getMeaningfulQuestionCount(questions: WizardQuestion[]) {
 return questions.filter((question) => question.text.trim().length > 0).length
}

function getSafetyErrorMessage(code: string) {
 if (code === 'DOMAIN_NOT_ALLOWED') {
 return "This URL's domain isn't permitted on Solutionizing."
 }

 if (code === 'CONTENT_POLICY_VIOLATION') {
 return 'This content was flagged by our safety check. Please review your mission description.'
 }

 return 'Something looks off. Check your URL and mission details.'
}

function toFrontendMission(mission: ApiMissionDetail): WizardState {
 return {
 title: mission.title,
 goal: mission.goal,
 difficulty: mission.difficulty,
 estimatedMinutes: mission.estimatedMinutes,
 testersRequired: mission.testersRequired,
 timeoutDuration: mission.timeoutDuration,
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

function normalizeWizardState(value: unknown): WizardState {
 if (!value || typeof value !== 'object') {
 return initialState
 }

 const draft = value as Partial<WizardState>
 const timeoutDuration =
 typeof draft.timeoutDuration === 'number' &&
 testerDeadlineOptions.some((option) => option.value === draft.timeoutDuration)
 ? draft.timeoutDuration
 : initialState.timeoutDuration

 return {
 ...initialState,
 ...draft,
 timeoutDuration,
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
 const committedAssets = getCommittedAssets(state.assets)

 if (committedAssets.length === 0) {
 errors.assets = 'Add at least one asset before continuing'
 }

 committedAssets.forEach(({ asset, index }) => {
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
 errors[`asset-${index}`] = isUploadAssetType(asset.type)
 ? `Upload a ${asset.type === 'SCREENSHOT' ? 'screenshot' : 'video'}`
 : 'Add a valid URL'
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

 if (fieldKey === 'assets' || fieldKey.startsWith('asset-')) {
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
 const [supabase] = useState(() =>
 createBrowserClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
 )
 )
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
 const [assetPreviewUrls, setAssetPreviewUrls] = useState<Record<number, string>>({})
 const [uploadingAssetIndex, setUploadingAssetIndex] = useState<number | null>(null)
 const [isLoading, setIsLoading] = useState(true)
 const [showBillModal, setShowBillModal] = useState(false)
 const [pendingMissionPayload, setPendingMissionPayload] = useState<any>(null)
  const [pendingAction, setPendingAction] = useState<'draft' | 'submit' | null>(null)
  const [submitError, setSubmitError] = useState('')

  const [showTemplatesModal, setShowTemplatesModal] = useState(false)
  const [templates, setTemplates] = useState<WizardTemplate[]>([])
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [isAddingNewTemplate, setIsAddingNewTemplate] = useState(false)

  const dirtyRef = useRef(false)
 const assetFileInputRefs = useRef<Array<HTMLInputElement | null>>([])
 const hydratedStateRef = useRef<WizardState>(initialState)
 const draftStorageKey = useMemo(
 () => (editMissionId ? `mission-wizard-draft:${editMissionId}` : 'mission-wizard-draft'),
 [editMissionId]
 )
 const refreshFlagKey = useMemo(
 () => (editMissionId ? `solutionizing-draft-refresh:${editMissionId}` : 'solutionizing-draft-refresh'),
 [editMissionId]
 )
 const committedAssetCount = getCommittedAssets(state.assets).length
 const meaningfulQuestionCount = getMeaningfulQuestionCount(state.questions)
 const canReviewChecklistSubmit = committedAssetCount > 0 && meaningfulQuestionCount > 0

 const clearLocalDraft = useCallback(() => {
 sessionStorage.removeItem(draftStorageKey)
 sessionStorage.removeItem(refreshFlagKey)
 }, [draftStorageKey, refreshFlagKey])

 useEffect(() => {
 async function initialize() {
 hydratedStateRef.current = initialState

 if (!isEditMode || !editMissionId) {
 try {
 const draftJson = sessionStorage.getItem(draftStorageKey)
 if (draftJson) {
 const draft = normalizeWizardState(JSON.parse(draftJson))
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
 setState(normalizeWizardState(JSON.parse(draftJson)))
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
 mission.rejectionReason ?? mission.reviewNote ?? 'Your mission was rejected. Review the feedback and update it before resubmitting.'
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

 

 function handleGoalBlur() {
 const containsEmail = /[^\s@]+@[^\s@]+\.[^\s@]+/.test(state.goal)
 const containsPhone = /(?:\+?\d[\d\s-]{7,}\d)/.test(state.goal)
 setGoalWarning(
 containsEmail || containsPhone ? 'Tip: Avoid including personal contact info in your goal.' : ''
 )
 }

 async function handleAssetReachability(index: number) {
 const asset = state.assets[index]
 if (!asset || asset.type !== 'LINK' || !asset.url?.trim()) {
 return
 }

 if (!isValidUrl(asset.url)) {
 setAssetChecks((current) => {
 const copy = { ...current }
 delete copy[index]
 return copy
 })
 setErrors((current) => ({
 ...current,
 [`asset-${index}`]: 'Enter a full URL, including https://',
 }))
 return
 }

 setAssetChecks((current) => ({ ...current, [index]: 'checking' }))

 try {
 await fetch(asset.url, { method: 'HEAD', mode: 'no-cors' })
 setAssetChecks((current) => ({ ...current, [index]: 'reachable' }))
 setErrors((current) => {
 const copy = { ...current }
 delete copy[`asset-${index}`]
 return copy
 })
 } catch {
 setAssetChecks((current) => ({ ...current, [index]: 'unreachable' }))
 }
 }

 async function handleAssetFileSelected(index: number, file: File | null) {
 const asset = state.assets[index]
 const input = assetFileInputRefs.current[index]

 if (!file || !asset || !isUploadAssetType(asset.type)) {
 if (input) {
 input.value = ''
 }
 return
 }

 const contentType = getUploadAssetContentType(file)
 const uploadFilename = createUploadFilename(file, asset.type, contentType)

 if (!contentType) {
 setErrors((current) => ({
 ...current,
 [`asset-${index}`]: 'This file type is not supported. Please choose an image file or an MP4, MOV, or WEBM video.',
 }))
 if (input) {
 input.value = ''
 }
 return
 }

 if (asset.type === 'SCREENSHOT') {
 try {
 const previewUrl = await readFileAsDataUrl(file)
 setAssetPreviewUrls((current) => ({
 ...current,
 [index]: previewUrl,
 }))
 } catch {
 setAssetPreviewUrls((current) => {
 const next = { ...current }
 delete next[index]
 return next
 })
 }
 }

 setUploadingAssetIndex(index)
 setErrors((current) => {
 const next = { ...current }
 delete next.assets
 delete next[`asset-${index}`]
 return next
 })
 setAssetChecks((current) => {
 const next = { ...current }
 delete next[index]
 return next
 })

 try {
 const signedUpload = await apiFetch<SignedUploadResponse>(
 `/api/v1/uploads/sign?filename=${encodeURIComponent(uploadFilename)}&contentType=${encodeURIComponent(contentType)}`
 )

 const { error } = await supabase.storage
 .from('mission-assets')
 .uploadToSignedUrl(signedUpload.path, signedUpload.token, file, {
 contentType,
 })

 if (error) {
 throw new Error(error.message)
 }

 updateState((current) => ({
 ...current,
 assets: current.assets.map((currentAsset, assetIndex) =>
 assetIndex === index && isUploadAssetType(currentAsset.type)
 ? { ...currentAsset, url: signedUpload.publicUrl, text: '' }
 : currentAsset
 ),
 }))
 setAssetChecks((current) => ({ ...current, [index]: 'reachable' }))
 } catch (error) {
 const message = isApiClientError(error)
 ? error.message
 : error instanceof Error
 ? error.message
 : `Failed to upload this ${asset.type === 'SCREENSHOT' ? 'screenshot' : 'video'}.`

 setErrors((current) => ({
 ...current,
 [`asset-${index}`]: message,
 }))
 toast.error(message)
 } finally {
 setUploadingAssetIndex((current) => (current === index ? null : current))
 if (input) {
 input.value = ''
 }
 }
 }

 async function handleAssetPaste(index: number, event: React.ClipboardEvent<HTMLDivElement>) {
 const asset = state.assets[index]
 if (!asset || asset.type !== 'SCREENSHOT') {
 return
 }

 const imageItem = Array.from(event.clipboardData.items).find((item) =>
 item.type.startsWith('image/')
 )

 if (!imageItem) {
 return
 }

 const pastedImage = imageItem.getAsFile()
 if (!pastedImage) {
 return
 }

 event.preventDefault()
 event.stopPropagation()
 await handleAssetFileSelected(index, pastedImage)
 }


  async function handleSave(action: 'draft' | 'submit') {
    setSubmitError('')
    const preparedState = prepareAssetsForValidation(state)

    if (JSON.stringify(preparedState.assets) !== JSON.stringify(state.assets)) {
      updateState(() => preparedState)
    }

    const validationErrors = getMissionValidationErrors(preparedState)
    const firstErrorKey = Object.keys(validationErrors)[0]
    if (firstErrorKey) {
      setErrors(validationErrors)
      const targetStep = getStepForFieldKey(firstErrorKey)
      setStep(targetStep)
      window.setTimeout(() => scrollToField(firstErrorKey === 'assets' ? 'asset-0' : firstErrorKey), 0)
      return
    }

    setPendingAction(action)

    try {
      const payload = {
        title: preparedState.title.trim(),
        goal: preparedState.goal.trim(),
        difficulty: preparedState.difficulty,
        estimatedMinutes: preparedState.estimatedMinutes,
        testersRequired: preparedState.testersRequired,
        timeoutDuration: preparedState.timeoutDuration,
        assets: preparedState.assets.map((asset, index) => ({
          type: asset.type === 'TEXT' ? 'TEXT_DESCRIPTION' : asset.type === 'VIDEO' ? 'SHORT_VIDEO' : asset.type,
          url: asset.type === 'TEXT' ? undefined : asset.url?.trim(),
          text: asset.type === 'TEXT' ? asset.text?.trim() : undefined,
          label: asset.label?.trim() || undefined,
          order: index,
        })),
        questions: preparedState.questions.map((question, index) => ({
          order: index + 1,
          type: question.type,
          text: question.text.trim(),
          options: question.type === 'MULTIPLE_CHOICE' ? (question.options ?? []).map((option) => option.trim()).filter(Boolean) : undefined,
          isRequired: question.required,
        })),
      }

      if (action === 'draft') {
        if (isEditMode && editMissionId) {
          await apiFetch(`/api/v1/missions/${editMissionId}`, { method: 'PATCH', body: payload })
        } else {
          await apiFetch('/api/v1/missions', { method: 'POST', body: payload })
        }
        clearLocalDraft()
        dirtyRef.current = false
        toast.success(isEditMode ? 'Mission changes saved.' : 'Mission saved as draft!')
        router.push('/dashboard/founder')
        return
      }

      setPendingMissionPayload(payload)
      setShowBillModal(true)
      setPendingAction(null)

    } catch (error: any) {
      if (isApiClientError(error)) {
        if (error.status === 400) {
          if (
            error.code === 'DOMAIN_NOT_ALLOWED' ||
            error.code === 'CONTENT_POLICY_VIOLATION' ||
            error.code === 'URL_UNREACHABLE'
          ) {
            setSubmitError(getSafetyErrorMessage(error.code))
          } else {
            setSubmitError(getValidationMessage(error.details) ?? error.message)
          }
        } else if (error.code === 'NETWORK_ERROR') {
          setSubmitError('Check your internet connection')
        } else {
          setSubmitError('Something went wrong. Try again.')
        }
      } else {
        setSubmitError(error.message || 'Something went wrong. Try again.')
      }
      setPendingAction(null)
    }
  }

  async function handleConfirmPayment() {
    if (!pendingMissionPayload) return
    const payload = pendingMissionPayload
    setShowBillModal(false)
    setPendingAction('submit')
    setSubmitError('')

    try {
      // Temporary internal testing bypass gated by an environment variable.
      // MUST BE REMOVED before any public or paying founders use the platform.
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user?.id

      if (userId && INTERNAL_TEST_ALLOWLIST.includes(userId)) {
        const bypassRes = await fetch('/api/v1/test-bypass/create-mission', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            testersRequired: payload.testersRequired,
            missionData: payload,
          }),
        })

        if (bypassRes.ok) {
          if (!isEditMode) {
            posthog.capture('mission_created', {
              difficulty: payload.difficulty,
              testersRequired: payload.testersRequired,
              timeoutDuration: payload.timeoutDuration,
              isBypass: true,
            })
          }
          clearLocalDraft()
          dirtyRef.current = false
          toast.success('Test mission submitted for review (Bypass Active).')
          router.push('/dashboard/founder')
          return
        }

        if (bypassRes.status === 403) {
          setSubmitError('Bypass route forbidden. Is ENABLE_FOUNDER_TEST_BYPASS set to true?')
          setPendingAction(null)
          return
        }
      }

      const isRazorpayLoaded = await loadRazorpay()
      if (!isRazorpayLoaded) {
        setSubmitError('Failed to load payment gateway. Please check your internet connection.')
        setPendingAction(null)
        return
      }

      const orderRes = await fetch('/api/v1/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          testersRequired: payload.testersRequired,
          missionData: payload,
        }),
      })
      
      if (!orderRes.ok) {
        const errorData = await orderRes.json()
        throw new Error(errorData.error?.message || 'Failed to create payment order')
      }
      
      const orderData = await orderRes.json()
      const { orderId, amount, currency } = orderData.data

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount,
        currency,
        name: 'Solutionizing',
        description: `Mission with ${payload.testersRequired} tester(s)`,
        order_id: orderId,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch('/api/v1/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            })
            
            if (!verifyRes.ok) {
              const errorData = await verifyRes.json()
              throw new Error(errorData.error?.message || 'Payment verification failed')
            }
            
            if (!isEditMode) {
              posthog.capture('mission_created', {
                difficulty: payload.difficulty,
                testersRequired: payload.testersRequired,
                timeoutDuration: payload.timeoutDuration,
              })
            }

            clearLocalDraft()
            dirtyRef.current = false
            toast.success('Payment successful. Mission submitted for review.')
            router.push('/dashboard/founder')
          } catch (err: any) {
            console.error(err)
            toast.error(err.message || 'Verification failed. Contact support.')
            setPendingAction(null)
          }
        },
        modal: {
          ondismiss: function () {
            setPendingAction(null)
          },
        },
        theme: {
          color: '#3b82f6',
        },
      }
      
      const rzp = new (window as any).Razorpay(options)
      rzp.on('payment.failed', function (response: any) {
        toast.error(response.error.description || 'Payment failed')
        setPendingAction(null)
      })
      rzp.open()

    } catch (error: any) {
      setSubmitError(error.message || 'Something went wrong. Try again.')
      setPendingAction(null)
    }
  }

  const reviewAssets = useMemo(
    () =>
      getCommittedAssets(state.assets).map(({ asset }, index) => (
        <div key={`${asset.type}-${index}`} className="rounded-card border border-[var(--border)] bg-[var(--cream)] p-6 ">
          <div className="mb-2 text-sm font-bold text-[var(--electric)]">ASSET {index + 1}</div>
          <div className="mb-2 text-lg font-bold text-[var(--ink)] ">{asset.type}</div>
          <p className="break-words text-sm text-[var(--ink-soft)] ">
            {asset.type === 'TEXT' ? asset.text : asset.url}
          </p>
          {asset.label?.trim() ? (
            <p className="mt-3 text-sm font-semibold text-[var(--ink)] ">Label: {asset.label.trim()}</p>
          ) : null}
        </div>
      )),
    [state.assets]
  )

  const reviewQuestions = useMemo(
    () =>
      state.questions.map((question, index) => (
        <div key={index} className="rounded-card border border-[var(--border)] bg-[var(--cream)] p-6 ">
          <div className="mb-2 text-sm font-bold text-[var(--electric)]">QUESTION {index + 1}</div>
          <div className="mb-2 text-lg font-bold text-[var(--ink)] ">{question.text}</div>
          <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)] ">Tester will see</div>
          {question.type === 'TEXT_SHORT' ? (
            <input
              type="text"
              disabled
              placeholder="Tester's answer..."
              className={`${textFieldClass} opacity-50 cursor-not-allowed mt-3 cursor-none`}
            />
          ) : null}
          {question.type === 'TEXT_LONG' ? (
            <textarea
              disabled
              rows={3}
              placeholder="Tester's detailed response..."
              className={`${textFieldClass} opacity-50 cursor-not-allowed resize-none mt-3 cursor-none`}
            />
          ) : null}
          {question.type === 'RATING_1_5' ? (
            <div className="mt-3">
              <StarRow value={0} readonly={true} size={28} />
            </div>
          ) : null}
          {question.type === 'YES_NO' ? (
            <div className="mt-3 flex gap-3">
              <button disabled className="rounded-2xl border-2 border-[var(--border)] px-6 py-2 text-sm font-bold text-[var(--ink-soft)]  cursor-none">
                Yes
              </button>
              <button disabled className="rounded-2xl border-2 border-[var(--border)] px-6 py-2 text-sm font-bold text-[var(--ink-soft)]  cursor-none">
                No
              </button>
            </div>
          ) : null}
          {question.type === 'MULTIPLE_CHOICE' ? (
            <div className="mt-3 space-y-2">
              {(question.options ?? []).map((opt, optionIndex) => (
                <div
                  key={optionIndex}
                  className="rounded-2xl border-2 border-[var(--border)] px-4 py-2 text-sm text-[var(--ink-soft)] "
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

  function applyQuestionPack(packId: string) {
    const pack = questionPacks.find((p) => p.id === packId)
    if (!pack) return
    const questions = pack.questions.map((q, i) => ({ ...q, order: i }))
    updateState((current) => ({ ...current, questions }))
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

  const fetchTemplates = useCallback(async () => {
    setIsLoadingTemplates(true)
    const { data, error } = await supabase.from('wizard_templates').select('*').order('created_at', { ascending: false })
    setIsLoadingTemplates(false)
    if (error) {
      toast.error('Failed to load templates')
      return
    }
    setTemplates(data || [])
  }, [supabase])

  useEffect(() => {
    if (showTemplatesModal) {
      void fetchTemplates()
      setIsAddingNewTemplate(false)
      setNewTemplateName('')
    }
  }, [showTemplatesModal, fetchTemplates])

  async function handleSaveTemplate() {
    if (!newTemplateName.trim()) {
      toast.error('Please enter a template name')
      return
    }
    setIsSavingTemplate(true)
    const { data, error } = await supabase.from('wizard_templates').insert({
      name: newTemplateName.trim(),
      config: {
        difficulty: state.difficulty,
        estimatedMinutes: state.estimatedMinutes,
        testersRequired: state.testersRequired,
        questions: state.questions
      }
    }).select().single()
    setIsSavingTemplate(false)

    if (error) {
      toast.error('Failed to save template')
      return
    }
    setNewTemplateName('')
    setIsAddingNewTemplate(false)
    setTemplates([data, ...templates])
    toast.success('Template saved!')
  }

  async function handleDeleteTemplate(id: string) {
    const { error } = await supabase.from('wizard_templates').delete().eq('id', id)
    if (error) {
      toast.error('Failed to delete template')
      return
    }
    setTemplates(templates.filter(t => t.id !== id))
    toast.success('Template deleted')
  }

  function handleApplyTemplate(template: WizardTemplate) {
    updateState(current => ({
      ...current,
      difficulty: template.config.difficulty ?? current.difficulty,
      estimatedMinutes: template.config.estimatedMinutes ?? current.estimatedMinutes,
      testersRequired: template.config.testersRequired ?? current.testersRequired,
      questions: template.config.questions ?? current.questions,
    }))
    setShowTemplatesModal(false)
    toast.success('Template applied.')
  }

  if (isLoading) {
 return (
 <div className="min-h-screen bg-[var(--bg)]">
 <div className="mx-auto max-w-2xl px-4 sm:px-6 md:px-8 space-y-6 pt-6">
 <WizardStepSkeleton step={1} />
 </div>
 </div>
 )
 }

  return (
    <div className="h-screen flex flex-col bg-[var(--bg)] font-['Satoshi'] selection:bg-[var(--electric)] selection:text-white">

      {/* ── ZONE 1: Fixed top bar ── */}
      <div className="shrink-0 bg-[var(--cream)] border-b border-[var(--border)]">
        {showDraftBanner ? (
          <div className="mx-auto max-w-[720px] mt-4 px-4 sm:px-6 flex items-center justify-between rounded-xl border border-[rgba(251,191,36,0.2)] bg-[rgba(251,191,36,0.06)] p-4">
            <span className="text-sm font-semibold text-[#92400e]">You have an unsaved draft. Continue where you left off?</span>
            <button
              type="button"
              onClick={() => {
                clearLocalDraft()
                dirtyRef.current = false
                setState(hydratedStateRef.current)
                setShowDraftBanner(false)
              }}
              className="text-sm font-bold text-[#92400e] underline hover:text-amber-900 cursor-none"
            >
              Clear draft
            </button>
          </div>
        ) : null}
        {showRejectedBanner ? (
          <div className="mx-auto max-w-[720px] mt-4 px-4 sm:px-6 rounded-xl border border-[rgba(251,191,36,0.2)] bg-[rgba(251,191,36,0.06)] p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-amber-900">This mission was rejected. Review the feedback below, make your changes, and resubmit for review.</p>
                <p className="mt-2 text-sm text-[#92400e]">{rejectedReviewNote}</p>
              </div>
              <button type="button" onClick={() => setShowRejectedBanner(false)} className="text-sm font-bold text-[#92400e] underline hover:text-amber-900 cursor-none">Dismiss</button>
            </div>
          </div>
        ) : null}

        <div className="mx-auto max-w-[850px] px-4 sm:px-6 flex items-center justify-center py-5 gap-0 relative">
          {([
            { num: 1, label: 'Brief' },
            { num: 2, label: 'Setup' },
            { num: 3, label: 'Questions' },
            { num: 4, label: 'Review' },
          ] as const).map((s, i) => {
            const isActive = step === s.num
            const isCompleted = s.num < 4 && Object.keys(validateStep(s.num, state)).length === 0 && !isActive
            return (
              <Fragment key={s.num}>
                {i > 0 && <div className={`h-0.5 w-8 sm:w-12 transition-colors ${step > i ? 'bg-[var(--electric)]' : 'bg-[var(--border)]'}`} />}
                <button
                  type="button"
                  onClick={() => setStep(s.num)}
                  className={`flex items-center gap-2 rounded-full px-3 sm:px-4 py-2 text-sm font-semibold transition-all cursor-none ${
                    isActive
                      ? 'bg-[var(--electric)] text-white shadow-md'
                      : isCompleted
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-[var(--bg)] text-[var(--ink-soft)] border border-[var(--border)] hover:border-[var(--ink-soft)]'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-[var(--border)] text-[var(--ink-soft)]'
                    }`}>{s.num}</span>
                  )}
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
              </Fragment>
            )
          })}

          <button
            type="button"
            onClick={() => setShowTemplatesModal(true)}
            className="absolute right-4 sm:right-6 flex items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--ink-soft)] hover:border-[var(--ink-soft)] transition-colors cursor-none bg-white/50"
          >
            <Library className="h-4 w-4" />
            <span className="hidden sm:inline">Templates</span>
          </button>
        </div>
      </div>

      {/* ── ZONE 2: Scrollable middle ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[720px] px-4 sm:px-6 md:px-8 py-8 space-y-8">

          {step === 1 && (
            <>
<div className="space-y-8 rounded-[12px] border border-[var(--border)] bg-[var(--cream)] p-4">
 <div data-field-key="title">
 <label className="mb-3 block text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)] ">GIVE YOUR MISSION A TITLE</label>
 <input
 value={state.title}
 onChange={(event) => updateState((current) => ({ ...current, title: event.target.value }))}
 placeholder="e.g. First impression test for our onboarding flow"
 className={`${textFieldClass} focus:border-[var(--electric)] focus:ring-2 focus:ring-[var(--electric-dim)] cursor-none`}
 />
 <div className="mt-2 flex items-center justify-between">
 <span className="text-sm text-[#c0392b] ">{errors.title}</span>
 <span className="text-sm text-[var(--ink-soft)] ">{state.title.length}/100</span>
 </div>
 </div>

 <div data-field-key="goal">
 <label className="mb-3 block text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)] ">WHAT DO YOU WANT TO LEARN?</label>
 <textarea
 value={state.goal}
 onBlur={handleGoalBlur}
 onChange={(event) => updateState((current) => ({ ...current, goal: event.target.value }))}
 placeholder="e.g. I want to know if first-time visitors understand what we do within 10 seconds, and whether the pricing page feels trustworthy."
 rows={5}
 className={`${textFieldClass} resize-none focus:border-[var(--electric)] focus:ring-2 focus:ring-[var(--electric-dim)] cursor-none`}
 />
 <div className="mt-2 flex items-center justify-between">
 <span className={`text-sm ${errors.goal ? 'text-[#c0392b] ' : 'text-[#92400e] '}`}>{errors.goal || goalWarning}</span>
 <span className="text-sm text-[var(--ink-soft)] ">{state.goal.length}/300</span>
 </div>
 <div className="mt-3 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4 ">
 <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--ink-soft)] ">What makes a good goal?</p>
 <div className="space-y-2 text-sm">
 <div className="flex items-start gap-2">
 <span className="mt-0.5 text-green-500">✓</span>
 <span className="text-[var(--ink)] ">&quot;Do visitors understand what this product does in under 30 seconds?&quot;</span>
 </div>
 <div className="flex items-start gap-2">
 <span className="mt-0.5 text-green-500">✓</span>
 <span className="text-[var(--ink)] ">&quot;Does the checkout flow feel confusing or trustworthy?&quot;</span>
 </div>
 <div className="flex items-start gap-2">
 <span className="mt-0.5 text-red-400">✗</span>
 <span className="text-[var(--ink-soft)] ">&quot;Give me feedback on my website.&quot; — too vague, testers won&apos;t know what to focus on</span>
 </div>
 </div>
 </div>
 </div>
 </div>
            </>
          )}

          {step === 2 && (
            <>
<div className="space-y-8">
 <div className="pt-6">
 <label className="mb-6 block text-sm font-bold uppercase tracking-wider text-[var(--ink-soft)] ">DIFFICULTY</label>
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
 {([
 {
 value: 'EASY',
 note: 'Quick impressions',
 detail:
 'Testers spend 2 minutes, visit your link, and answer a few quick questions. Best for first impressions and top-of-funnel clarity.',
 },
 {
 value: 'MEDIUM',
 note: 'Detailed feedback',
 detail:
 'Testers spend up to 4 minutes, explore key flows, and give structured written feedback. Best for UX and messaging.',
 },
 {
 value: 'HARD',
 note: 'Complex analysis',
 detail:
 'Testers spend up to 6 minutes, dig into specific features, and write detailed analysis. Best for product decisions and conversion problems.',
 },
 ] as const).map((difficulty) => (
 <button
 key={difficulty.value}
 type="button"
 onClick={() => updateState((current) => ({ ...current, difficulty: difficulty.value }))}
 className={`rounded-card p-6 text-left transition-all ${state.difficulty === difficulty.value ? 'border-2 border-[var(--electric)] bg-[#fdf8f6] rounded-[12px] border-2 border-[var(--electric)] bg-[rgba(255,107,26,0.04)] p-4 cursor-none' : 'border-2 border-[var(--border)] bg-[var(--cream)] rounded-[12px] border border-[var(--border)] bg-transparent p-4 cursor-none opacity-80 hover:border-[var(--border-strong)] transition-colors'}`}
 >
 <div className="mb-2 text-xl font-bold text-[var(--ink)] ">{difficulty.value}</div>
 <div className="mt-2 text-sm text-[var(--ink-soft)] ">{difficulty.note}</div>
 <div className="mt-2 text-xs leading-relaxed text-[var(--ink-soft)] ">{difficulty.detail}</div>
 </button>
 ))}
 </div>
 </div>

 <div className="pt-6 border-t border-[var(--border)] ">
 <label className="mb-6 block text-sm font-bold uppercase tracking-wider text-[var(--ink-soft)] ">ESTIMATED MINUTES</label>
 <div className="rounded-card border border-[var(--border)] bg-[var(--cream)] p-6 ">
 <input type="range" min={2} max={4} step={1} value={state.estimatedMinutes} onChange={(event) => updateState((current) => ({ ...current, estimatedMinutes: Number(event.target.value) }))} className="w-full accent-[var(--electric)] cursor-none" />
 <div className="mt-4 text-center">
 <div className="text-2xl font-[family-name:var(--font-fraunces)] italic font-normal text-[var(--ink)] ">{state.estimatedMinutes} minutes</div>
 <p className="mt-1 text-sm text-[var(--ink-soft)] ">Missions must be 2–4 minutes</p>
 </div>
 </div>
 </div>

 <div className="pt-6 border-t border-[var(--border)] ">
  <label className="mb-6 block text-sm font-bold uppercase tracking-wider text-[var(--ink-soft)] ">NUMBER OF TESTERS</label>
  <div className="rounded-card border border-[var(--border)] bg-[var(--cream)] p-6 ">
  <input
  type="range"
  min={1}
  max={4}
  step={1}
  value={state.testersRequired > 4 ? 1 : state.testersRequired}
  onChange={(event) => updateState((current) => ({ ...current, testersRequired: Number(event.target.value) }))}
  className="w-full accent-[var(--electric)] cursor-none"
  />
  <div className="mt-4 text-center">
  <div className="text-2xl font-[family-name:var(--font-fraunces)] italic font-normal text-[var(--ink)] ">{state.testersRequired > 4 ? 1 : state.testersRequired} testers</div>
  <p className="mt-1 text-sm text-[var(--ink-soft)] ">Only 4 tester slots available right now — more coming soon.</p>
  </div>
  </div>
  </div>

 <div className="pt-6 border-t border-[var(--border)] ">
 <label className="mb-6 block text-sm font-bold uppercase tracking-wider text-[var(--ink-soft)] ">TESTER DEADLINE</label>
 <div className="rounded-card border border-[var(--border)] bg-[var(--cream)] p-6 ">
 <select
 value={state.timeoutDuration}
 onChange={(event) => updateState((current) => ({ ...current, timeoutDuration: Number(event.target.value) }))}
 className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-base font-bold text-[var(--ink)] outline-none transition-colors focus:border-[var(--electric)] focus:ring-2 focus:ring-[var(--electric)]/20  cursor-none"
 >
 {testerDeadlineOptions.map((option) => (
 <option key={option.value} value={option.value}>
 {option.label}
 </option>
 ))}
 </select>
 <p className="mt-2 text-sm text-[var(--ink-soft)] ">
 Testers must complete the mission before this deadline after assignment.
 </p>
 </div>
 </div>

 <div className="space-y-4">
 <div className="rounded-2xl border border-[rgba(251,191,36,0.2)] bg-[rgba(251,191,36,0.06)] p-4 text-sm text-[#92400e] ">
 <p>How to make your mission work: use links that testers can open without logging in, confirm they still work in an incognito window, and if the product needs login, add a TEXT asset with a demo account and password.</p>
 </div>
 {errors.assets ? <p className="text-sm text-[#c0392b] ">{errors.assets}</p> : null}
 {state.assets.map((asset, index) => (
 <div key={index} className="rounded-card border border-[var(--border)] bg-[var(--cream)] p-6 " data-field-key={`asset-${index}`}>
 <div className="mb-4 flex flex-wrap items-center gap-3">
 {(['LINK', 'SCREENSHOT', 'VIDEO', 'TEXT'] as const).map((type) => (
 <button
 key={type}
 type="button"
 onClick={() => {
 setAssetChecks((current) => {
 const next = { ...current }
 delete next[index]
 return next
 })
 setAssetPreviewUrls((current) => {
 const next = { ...current }
 delete next[index]
 return next
 })
 updateState((current) => ({
 ...current,
 assets: current.assets.map((currentAsset, assetIndex) =>
 assetIndex === index
 ? { type, url: '', text: '', label: currentAsset.label ?? '' }
 : currentAsset
 ),
 }))
 }}
 className={`cursor-none rounded-full px-3 py-1 text-xs font-bold ${asset.type === type ? 'bg-blue-100 text-blue-700 ' : 'bg-[#f3f3f5] text-[var(--ink-soft)] '}`}
 >
 {type}
 </button>
 ))}
 {state.assets.length > 1 ? (
 <button
 type="button"
 className="ml-auto text-[var(--ink-soft)]  cursor-none"
 onClick={() => {
 setAssetChecks((current) => removeIndexedEntry(current, index))
 setAssetPreviewUrls((current) => removeIndexedEntry(current, index))
 updateState((current) => ({
 ...current,
 assets: current.assets.filter((_, assetIndex) => assetIndex !== index),
 }))
 }}
 >
 ×
 </button>
 ) : null}
 </div>

 {asset.type === 'TEXT' ? (
 <textarea value={asset.text ?? ''} onChange={(event) => updateState((current) => ({ ...current, assets: current.assets.map((currentAsset, assetIndex) => assetIndex === index ? { ...currentAsset, text: event.target.value } : currentAsset) }))} rows={3} className={`${textFieldClass} resize-none cursor-none`} />
 ) : isUploadAssetType(asset.type) ? (
 <div
 className="rounded-2xl border border-dashed border-[#d8d6de] bg-[var(--bg)] p-4 outline-none transition-colors focus:border-[var(--electric)] focus:bg-[#fff7f2] "
 tabIndex={0}
 onPaste={(event) => void handleAssetPaste(index, event)}
 >
 <input
 ref={(element) => {
 assetFileInputRefs.current[index] = element
 }}
 type="file"
 accept={getUploadAssetAccept(asset.type)}
 className="hidden cursor-none"
 onChange={(event) => void handleAssetFileSelected(index, event.target.files?.[0] ?? null)}
 />
 {asset.type === 'SCREENSHOT' && (assetPreviewUrls[index] || asset.url) ? (
 <div className="mb-4 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--cream)] ">
 <div className="relative h-56 w-full sm:h-64">
 <Image
 src={assetPreviewUrls[index] ?? asset.url ?? ''}
 alt={asset.label?.trim() || 'Screenshot preview'}
 fill
 unoptimized
 className="object-cover"
 />
 </div>
 </div>
 ) : null}
 <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
 <div>
 <p className="text-sm font-semibold text-[var(--ink)] ">
 {asset.url
 ? getUploadedAssetName(asset.url)
 : asset.type === 'SCREENSHOT' && assetPreviewUrls[index]
 ? 'Screenshot ready to upload'
 : `No ${asset.type === 'SCREENSHOT' ? 'screenshot' : 'video'} uploaded yet`}
 </p>
 <p className="mt-1 text-xs text-[var(--ink-soft)] ">
 {getUploadAssetHelperText(asset.type)}
 </p>
 </div>
 <button
 type="button"
 onClick={() => assetFileInputRefs.current[index]?.click()}
 disabled={uploadingAssetIndex === index}
 className="inline-flex items-center justify-center gap-2 rounded-[1.25rem] border border-[var(--electric)]/30 px-4 py-2 text-sm font-bold text-[var(--electric)] transition-colors hover:bg-[var(--electric)]/10 disabled:cursor-not-allowed disabled:opacity-60 cursor-none"
 >
 {uploadingAssetIndex === index ? <SpinnerIcon className="h-4 w-4" /> : null}
 {getUploadAssetButtonLabel(asset.type, Boolean(asset.url || assetPreviewUrls[index]))}
 </button>
 </div>

 {asset.url ? (
 <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-[var(--cream)] px-4 py-3 text-sm ">
 <span className="truncate text-[var(--ink)] ">{asset.url}</span>
 <a
 href={asset.url}
 target="_blank"
 rel="noreferrer"
 className="shrink-0 font-semibold text-[var(--electric)] hover:underline cursor-none"
 >
 Preview
 </a>
 </div>
 ) : null}
 </div>
 ) : (
 <div className="relative">
 <input
 value={asset.url ?? ''}
 onBlur={() => void handleAssetReachability(index)}
 onChange={(event) => {
 const val = event.target.value
 setAssetChecks((prev) => {
 const copy = { ...prev }
 delete copy[index]
 return copy
 })
 setErrors((prev) => {
 const copy = { ...prev }
 delete copy[`asset-${index}`]
 return copy
 })
 updateState((current) => ({
 ...current,
 assets: current.assets.map((currentAsset, assetIndex) =>
 assetIndex === index ? { ...currentAsset, url: val } : currentAsset
 ),
 }))
 }}
 placeholder="https://example.com"
 className={`${textFieldClass} cursor-none`}
 />
 {assetChecks[index] === 'checking' ? <SpinnerIcon className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--ink-soft)]" /> : null}
 {assetChecks[index] === 'reachable' && !errors[`asset-${index}`] ? <CheckCircle className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-green-600 " /> : null}
 {assetChecks[index] === 'unreachable' ? <XCircle className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#c0392b] " /> : null}
 </div>
 )}

 <input value={asset.label ?? ''} onChange={(event) => updateState((current) => ({ ...current, assets: current.assets.map((currentAsset, assetIndex) => assetIndex === index ? { ...currentAsset, label: event.target.value } : currentAsset) }))} placeholder="Optional label" className={`${textFieldClass} mt-3 cursor-none`} />
 <p className="mt-1 text-sm text-[#c0392b] ">{errors[`asset-${index}`]}</p>
 </div>
 ))}

 {state.assets.length < 3 ? <button type="button" className="text-sm font-semibold text-[var(--electric)] hover:underline cursor-none" onClick={() => updateState((current) => ({ ...current, assets: [...current.assets, { type: 'LINK', url: '', label: '' }] }))}>+ Add another asset</button> : null}
 </div>
 </div>
            </>
          )}

          {step === 3 && (
            <>
<div className="space-y-6">
 <div className="rounded-card border border-[var(--border)] bg-[var(--cream)] p-6 ">
 <div className="flex flex-wrap items-end justify-between gap-3">
 <div>
  <div className="mb-6">
  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">Start with a preset</p>
  <p className="mt-1 text-sm text-[var(--ink-soft)]">Load a full set of questions for your mission type. You can edit them after.</p>
  <div className="mt-3 flex flex-wrap gap-2">
  {questionPacks.map((pack) => (
  <button
  key={pack.id}
  type="button"
  onClick={() => applyQuestionPack(pack.id)}
  className="rounded-full border border-[var(--electric)]/30 bg-[var(--electric-dim)] px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-[var(--electric)] transition-colors hover:bg-[var(--electric)]/20 cursor-none"
  >
  {pack.label}
  </button>
  ))}
  </div>
  <p className="mt-2 text-xs text-[var(--ink-soft)]">This will replace your current questions.</p>
  </div>
 <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)] ">Suggested templates</p>
 <h3 className="mt-2 text-xl font-bold text-[var(--ink)] ">Start with proven questions</h3>
 <p className="mt-2 text-sm text-[var(--ink-soft)] ">Insert a template, then rewrite it to match your mission. These are generic prompts that work across most tests.</p>
 </div>
 <span className="text-sm font-semibold text-[var(--electric)]">{state.questions.length}/6 questions</span>
 </div>
 <div className="mt-5 grid gap-3 md:grid-cols-2">
 {questionTemplates.map((template) => (
 <div key={template.title} className="rounded-2xl border border-[#ece8e1] bg-[var(--bg)] p-4 wizard-template-card">
 <div className="flex items-start justify-between gap-3">
 <div>
 <p className="text-sm font-bold text-[var(--ink)] ">{template.title}</p>
 <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[var(--electric)]">{template.question.type.replaceAll('_', ' ')}</p>
 </div>
 <button
 type="button"
 disabled={state.questions.length >= 6}
 className="rounded-full border border-[var(--electric)]/30 px-3 py-1 text-xs font-bold text-[var(--electric)] transition-colors hover:bg-[var(--electric)]/10 disabled:cursor-not-allowed disabled:opacity-40 cursor-none"
 onClick={() => insertQuestionTemplate(template)}
 >
 INSERT
 </button>
 </div>
 <p className="mt-3 text-sm text-[var(--ink)] ">{template.question.text}</p>
 <p className="mt-2 text-xs text-[var(--ink-soft)] ">{template.description}</p>
 </div>
 ))}
 </div>
 </div>
 {state.questions.map((question, index) => (
 <div key={index} className="rounded-card border border-[var(--border)] bg-[var(--cream)] p-6 " data-field-key={`question-${index}`}>
 <div className="mb-4 flex items-center justify-between">
 <div className="text-sm font-bold text-[var(--electric)]">QUESTION {index + 1}</div>
 {state.questions.length > 1 ? <button type="button" className="text-[var(--ink-soft)]  cursor-none" onClick={() => updateState((current) => ({ ...current, questions: current.questions.filter((_, questionIndex) => questionIndex !== index) }))}>×</button> : null}
 </div>
 <input value={question.text} onChange={(event) => updateState((current) => ({ ...current, questions: current.questions.map((currentQuestion, questionIndex) => questionIndex === index ? { ...currentQuestion, text: event.target.value } : currentQuestion) }))} placeholder="e.g. What was your first impression?" className={textFieldClass} />
 <p className="mt-1 text-sm text-[#c0392b] ">{errors[`question-${index}`]}</p>
 <p className="mt-2 text-xs text-[var(--ink-soft)] ">Ask one specific thing. Vague questions like &quot;What do you think?&quot; produce vague answers. Better: &quot;Did the pricing feel too high, too low, or about right?&quot;</p>
 <div className="mt-4 flex flex-wrap gap-2">
 {([
 ['TEXT_SHORT', 'Short text'],
 ['TEXT_LONG', 'Long text'],
 ['RATING_1_5', 'Rating'],
 ['MULTIPLE_CHOICE', 'Multiple choice'],
 ['YES_NO', 'Yes/No'],
 ] as const).map(([type, label]) => (
 <button key={type} type="button" onClick={() => updateState((current) => ({ ...current, questions: current.questions.map((currentQuestion, questionIndex) => questionIndex === index ? { ...currentQuestion, type, options: type === 'MULTIPLE_CHOICE' ? currentQuestion.options && currentQuestion.options.length >= 2 ? currentQuestion.options : ['', ''] : undefined } : currentQuestion) }))} className={`rounded-full px-3 py-1 text-sm font-semibold ${question.type === type ? 'bg-[var(--electric)]/10 text-[var(--electric)]' : 'bg-[#f3f3f5] text-[var(--ink-soft)]  cursor-none'}`}>{label}</button>
 ))}
 </div>
 {question.type ? <p className="mt-2 text-xs text-[var(--ink-soft)] ">{questionTypeDescriptions[question.type]}</p> : null}
 {question.type ? <p className="mt-1 text-xs text-[var(--electric)]/80 ">{questionTypeUseCases[question.type]}</p> : null}

 {question.type === 'MULTIPLE_CHOICE' ? (
 <div className="mt-4 space-y-3">
 {(question.options ?? []).map((option, optionIndex) => (
 <div key={optionIndex} className="flex items-center gap-3">
 <input value={option} onChange={(event) => updateState((current) => ({ ...current, questions: current.questions.map((currentQuestion, questionIndex) => questionIndex === index ? { ...currentQuestion, options: (currentQuestion.options ?? []).map((currentOption, currentOptionIndex) => currentOptionIndex === optionIndex ? event.target.value : currentOption) } : currentQuestion) }))} className={textFieldClass} />
 {(question.options?.length ?? 0) > 2 ? <button type="button" className="text-[var(--ink-soft)]  cursor-none" onClick={() => updateState((current) => ({ ...current, questions: current.questions.map((currentQuestion, questionIndex) => questionIndex === index ? { ...currentQuestion, options: (currentQuestion.options ?? []).filter((_, currentOptionIndex) => currentOptionIndex !== optionIndex) } : currentQuestion) }))}>×</button> : null}
 </div>
 ))}
 <p className="text-sm text-[#c0392b] ">{errors[`question-options-${index}`]}</p>
 {(question.options?.length ?? 0) < 5 ? <button type="button" className="text-sm font-semibold text-[var(--electric)] hover:underline cursor-none" onClick={() => updateState((current) => ({ ...current, questions: current.questions.map((currentQuestion, questionIndex) => questionIndex === index ? { ...currentQuestion, options: [...(currentQuestion.options ?? []), ''] } : currentQuestion) }))}>+ Add option</button> : null}
 </div>
 ) : null}

 <div className="mt-4 flex items-center justify-between">
 <label className="flex items-center gap-2 text-sm text-[var(--ink-soft)]  cursor-none"><input type="checkbox" checked={question.required} onChange={(event) => updateState((current) => ({ ...current, questions: current.questions.map((currentQuestion, questionIndex) => questionIndex === index ? { ...currentQuestion, required: event.target.checked } : currentQuestion) }))} />Required</label>
 <div className="flex items-center gap-2">
 <button type="button" disabled={index === 0} className="text-sm text-[var(--ink-soft)] disabled:opacity-40  cursor-none" onClick={() => updateState((current) => { const questions = [...current.questions];[questions[index - 1], questions[index]] = [questions[index], questions[index - 1]]; return { ...current, questions } })}>↑</button>
 <button type="button" disabled={index === state.questions.length - 1} className="text-sm text-[var(--ink-soft)] disabled:opacity-40  cursor-none" onClick={() => updateState((current) => { const questions = [...current.questions];[questions[index], questions[index + 1]] = [questions[index + 1], questions[index]]; return { ...current, questions } })}>↓</button>
 </div>
 </div>
 </div>
 ))}

 {state.questions.length < 6 ? <button type="button" className={`px-6 py-3 ${primaryButtonClass} cursor-none`} onClick={() => updateState((current) => ({ ...current, questions: [...current.questions, { text: '', type: 'TEXT_SHORT', required: true, order: current.questions.length }] }))}>+ ADD QUESTION</button> : null}
 </div>
            </>
          )}

          {step === 4 && (
            <>
<div className="space-y-6">
 <div className="rounded-card border border-[var(--border)] bg-[var(--cream)] p-6 overflow-hidden">
 <div className="wizard-review-header">
 <div className="mb-2 text-sm font-bold text-[var(--electric)]">TITLE</div>
 <div className="text-xl font-bold text-[var(--ink)] ">{state.title}</div>
 </div>
 </div>
 <div className="rounded-card border border-[var(--border)] bg-[var(--cream)] p-6 ">
 <div className="mb-2 text-sm font-bold text-[var(--electric)]">GOAL</div>
 <p className="text-[var(--ink)] ">{state.goal}</p>
 </div>
 <div className="rounded-card border border-[var(--border)] bg-[var(--cream)] p-6 ">
 <div className="mb-2 text-sm font-bold text-[var(--electric)]">TESTER DEADLINE</div>
 <div className="text-xl font-bold text-[var(--ink)] ">
 {testerDeadlineOptions.find((option) => option.value === state.timeoutDuration)?.label ?? '7 days'}
 </div>
 </div>
 <div className="rounded-card border border-[var(--border)] bg-[var(--cream)] p-6 ">
 <div className="mb-4 text-sm font-bold uppercase tracking-wide text-[var(--electric)]">Pre-submission checklist</div>
 <div className="space-y-3">
 <div className={`flex items-start justify-between rounded-2xl border px-4 py-3 ${committedAssetCount > 0 ? 'border-emerald-200 bg-emerald-50 ' : 'border-red-200 bg-red-50 '}`}>
 <div className="flex items-start gap-3">
 {committedAssetCount > 0 ? <CheckCircle className="mt-0.5 h-5 w-5 text-emerald-600 " /> : <XCircle className="mt-0.5 h-5 w-5 text-[#c0392b] " />}
 <div>
 <p className="font-semibold text-[var(--ink)] ">At least one asset added</p>
 {committedAssetCount === 0 ? <p className="mt-1 text-sm text-[#c0392b] ">Add at least one asset before submitting</p> : null}
 </div>
 </div>
 <span className={`text-sm font-bold ${committedAssetCount > 0 ? 'text-emerald-700 ' : 'text-red-700 '}`}>{committedAssetCount > 0 ? 'Ready' : 'Blocked'}</span>
 </div>
 <div className={`flex items-start justify-between rounded-2xl border px-4 py-3 ${meaningfulQuestionCount > 0 ? 'border-emerald-200 bg-emerald-50 ' : 'border-red-200 bg-red-50 '}`}>
 <div className="flex items-start gap-3">
 {meaningfulQuestionCount > 0 ? <CheckCircle className="mt-0.5 h-5 w-5 text-emerald-600 " /> : <XCircle className="mt-0.5 h-5 w-5 text-[#c0392b] " />}
 <div>
 <p className="font-semibold text-[var(--ink)] ">At least one question added</p>
 {meaningfulQuestionCount === 0 ? <p className="mt-1 text-sm text-[#c0392b] ">Add at least one question before submitting</p> : null}
 </div>
 </div>
 <span className={`text-sm font-bold ${meaningfulQuestionCount > 0 ? 'text-emerald-700 ' : 'text-red-700 '}`}>{meaningfulQuestionCount > 0 ? 'Ready' : 'Blocked'}</span>
 </div>
 </div>
 </div>
 <div className="rounded-3xl bg-[var(--electric)] p-6 text-[var(--ink)]">
              <div className="mb-4 text-xs font-bold uppercase tracking-wide text-[var(--ink)]/50">PAYMENT SUMMARY</div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[var(--cream)]">
                  <span>₹80 × {state.testersRequired} testers</span>
                  <span className="font-bold">₹{80 * state.testersRequired}</span>
                </div>
                <div className="my-3 border-t border-white/20" />
                <div className="flex items-center justify-between text-[var(--cream)]">
                  <span className="text-xl font-bold">TOTAL</span>
                  <span className="text-xl font-bold">₹{80 * state.testersRequired}</span>
                </div>
              </div>
            </div>
 {reviewAssets}
 {reviewQuestions}
 {submitError ? <p className="text-sm text-[#c0392b] ">{submitError}</p> : null}
 </div>
            </>
          )}

        </div>
      </div>

      {/* ── ZONE 3: Fixed bottom bar ── */}
      <div className="shrink-0 border-t border-[var(--border)] bg-[var(--cream)] px-4 sm:px-8 py-4">
        <div className="mx-auto max-w-[720px] flex items-center justify-between">
          <div>
            {step === 1 ? (
              <button type="button" onClick={() => router.push('/dashboard/founder')} className="font-semibold text-[var(--electric)] hover:text-[#c0392b] cursor-none">
                ← Dashboard
              </button>
            ) : (
              <button type="button" onClick={() => setStep((s) => s - 1)} className="font-semibold text-[var(--ink-soft)] hover:text-[var(--ink)] cursor-none">
                ← Back
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {step < 4 ? (
              <button
                type="button"
                className={`px-8 py-3.5 ${primaryButtonClass} cursor-none`}
                onClick={() => {
                  const stepErrors = validateStep(step, state)
                  if (Object.keys(stepErrors).length > 0) {
                    setErrors((current) => ({ ...current, ...stepErrors }))
                    const firstKey = Object.keys(stepErrors)[0]
                    window.setTimeout(() => scrollToField(firstKey), 0)
                    return
                  }
                  setStep((s) => s + 1)
                }}
              >
                CONTINUE →
              </button>
            ) : (
              <>
                <button
                  type="button"
                  disabled={pendingAction !== null}
                  className={`flex items-center justify-center gap-2 px-6 py-3.5 ${outlineButtonClass} cursor-none`}
                  onClick={() => void handleSave('draft')}
                >
                  {pendingAction === 'draft' ? <SpinnerIcon className="w-5 h-5" /> : null}
                  {isEditMode ? 'SAVE CHANGES' : 'SAVE AS DRAFT'}
                </button>
                <button
                  type="button"
                  disabled={pendingAction !== null || !canReviewChecklistSubmit}
                  className={`flex items-center justify-center gap-2 px-10 py-4 text-base ${primaryButtonClass} cursor-none`}
                  onClick={() => void handleSave('submit')}
                >
                  {pendingAction === 'submit' ? <SpinnerIcon className="w-5 h-5" /> : null}
                  PAY & LAUNCH MISSION
                </button>
              </>
            )}
          </div>
        </div>
      </div>

{showTemplatesModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="w-full max-w-md rounded-2xl bg-[var(--cream)] border border-[var(--border)] p-6 shadow-2xl flex flex-col max-h-[80vh]">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h2 className="text-xl font-bold font-[family-name:var(--font-fraunces)] italic text-[var(--ink)]">Your Templates</h2>
        <button onClick={() => setShowTemplatesModal(false)} className="text-[var(--ink-soft)] hover:text-[var(--ink)] cursor-none">
          <XCircle className="h-6 w-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-[100px] mb-4 space-y-3">
        {isLoadingTemplates ? (
          <div className="flex justify-center py-8"><SpinnerIcon className="h-6 w-6 text-[var(--electric)]" /></div>
        ) : templates.length === 0 ? (
          <div className="text-center py-8 text-sm text-[var(--ink-soft)]">
            No templates yet. Fill in the wizard and save your setup as a template.
          </div>
        ) : (
          templates.map(t => (
            <div key={t.id} className="flex items-center justify-between p-3 rounded-xl border border-[var(--border)] bg-[var(--bg)]">
              <span className="font-semibold text-sm text-[var(--ink)] truncate mr-2">{t.name}</span>
              <div className="flex items-center gap-2 shrink-0">
                <button 
                  onClick={() => handleApplyTemplate(t)}
                  className="rounded-full bg-[var(--electric)]/10 text-[var(--electric)] px-3 py-1 text-xs font-bold hover:bg-[var(--electric)]/20 cursor-none"
                >
                  Apply
                </button>
                <button 
                  onClick={() => {
                    if (window.confirm('Delete this template?')) {
                      void handleDeleteTemplate(t.id)
                    }
                  }}
                  className="text-[#c0392b]/70 hover:text-[#c0392b] cursor-none p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="pt-4 border-t border-[var(--border)] shrink-0">
        {isAddingNewTemplate ? (
          isSavingTemplate ? (
            <div className="flex justify-center py-2"><SpinnerIcon className="h-5 w-5 text-[var(--electric)]" /></div>
          ) : (
            <div className="flex flex-col gap-3">
              <input 
                type="text" 
                value={newTemplateName} 
                onChange={e => setNewTemplateName(e.target.value)} 
                placeholder="Name this template..." 
                className={`${textFieldClass} text-sm py-2 cursor-none`} 
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => {
                    setIsAddingNewTemplate(false)
                    setNewTemplateName('')
                  }}
                  className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--bg)] cursor-none"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => void handleSaveTemplate()}
                  disabled={!newTemplateName.trim()}
                  className="rounded-full bg-[var(--electric)] text-white px-4 py-2 text-sm font-bold hover:opacity-90 disabled:opacity-50 cursor-none"
                >
                  Confirm
                </button>
              </div>
            </div>
          )
        ) : (
          <div className="flex justify-end">
            <button 
              onClick={() => setIsAddingNewTemplate(true)}
              className="rounded-full bg-[var(--electric)] text-white px-4 py-2 text-sm font-bold hover:opacity-90 cursor-none"
            >
              Save Current as Template
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
)}

{showBillModal && pendingMissionPayload && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold font-[family-name:var(--font-fraunces)] italic text-[var(--ink)] mb-4">Order Summary</h2>
        <p className="font-semibold text-[var(--ink)] mb-4">{pendingMissionPayload.title || 'Untitled Mission'}</p>
        
        <div className="flex justify-between items-center text-sm text-[var(--ink-soft)] mb-2">
          <span>Tester Slots ({pendingMissionPayload.testersRequired} × ₹80)</span>
          <span>₹{pendingMissionPayload.testersRequired * 80}</span>
        </div>
        
        <div className="my-4 border-t border-[var(--border)]" />
        
        <div className="flex justify-between items-center text-lg font-bold text-[var(--ink)] mb-6">
          <span>Total</span>
          <span>₹{pendingMissionPayload.testersRequired * 80}</span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              setShowBillModal(false)
              setPendingAction(null)
            }}
            className="flex-1 rounded-full border border-[var(--border)] py-2 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--cream)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmPayment}
            disabled={pendingAction === 'submit'}
            className="flex-1 rounded-full bg-[var(--electric)] py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {pendingAction === 'submit' ? 'Processing...' : 'CONFIRM & PAY'}
          </button>
        </div>
      </div>
    </div>
  )}
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
 <div className="min-h-screen bg-[var(--bg)] p-4 sm:p-8 ">
 <div className="mx-auto max-w-[720px] rounded-panel bg-[var(--bg)] p-5 sm:p-12 ">
 <div className="mb-8">
 <div className="mb-4 inline-flex rounded-full bg-[var(--electric)]/10 px-4 py-1 text-sm font-bold text-[var(--electric)]">
 Step 1 of 4
 </div>
 <div className="mb-4 h-2 w-full overflow-hidden rounded-full w-full h-1.5 rounded-full bg-[var(--border)]">
 <div className="h-full w-1/4 rounded-full h-1.5 rounded-full bg-[var(--electric)] transition-all duration-500" />
 </div>
 <div className="flex items-center justify-between text-sm">
 <div className="font-bold text-[var(--electric)]">Brief</div>
 <div className="text-[var(--ink-soft)] ">Setup</div>
 <div className="text-[var(--ink-soft)] ">Questions</div>
 <div className="text-[var(--ink-soft)] ">Review</div>
 </div>
 </div>

 <div className="mb-8 inline-flex rounded-full bg-[var(--electric)]/10 px-4 py-2 text-sm font-bold text-[var(--electric)]">
 MEDIUM · loading coin rate
 </div>

 <div className="mb-8 h-10 w-60 animate-pulse rounded-full bg-[var(--border)] " />
 <div className="mb-8 flex items-center justify-between border-b border-[var(--border)] pb-4 ">
 <div className="h-5 w-20 animate-pulse rounded-full bg-[var(--border)] " />
 <div className="h-12 w-36 animate-pulse rounded-[2rem] bg-[var(--border)] " />
 </div>

 <WizardStepSkeleton step={1} />

 <div className="mt-5 flex items-center justify-between border-t border-[var(--border)] pt-4 ">
 <div className="h-5 w-20 animate-pulse rounded-full bg-[var(--border)] " />
 <div className="h-12 w-36 animate-pulse rounded-[2rem] bg-[var(--border)] " />
 </div>
 </div>
 </div>
 )
}