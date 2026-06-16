const fs = require('fs');

const srcPath = 'components/solutionizing/MissionWizardPage.tsx';
let src = fs.readFileSync(srcPath, 'utf8');

let returnIdx = src.indexOf('  if (isLoading) {');
if (returnIdx === -1) {
  throw new Error('Could not find loading block');
}

let regionA = src.substring(0, returnIdx);
const closingFnMatch = src.indexOf('\\nexport function MissionWizardPage()');
if (closingFnMatch === -1) throw new Error('Could not find MissionWizardPage export');
let regionC = src.substring(closingFnMatch);

// --- 1. Fix State Variables ---
regionA = regionA.replace(
  `const [step, setStep] = useState(1)`,
  `const [activeStage, setActiveStage] = useState<'brief' | 'setup' | 'questions' | 'review'>('brief')`
);

// --- 2. Remove History Effects ---
const historyEffect1 = `  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!window.history.state || typeof window.history.state.step === 'undefined') {
        window.history.replaceState({ step: 1 }, '')
      } else {
        setStep(window.history.state.step)
      }
    }
  }, [])`;

const historyEffect2 = `  useEffect(() => {
    if (typeof window === 'undefined') return
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && typeof event.state.step === 'number') {
        setStep(event.state.step)
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])`;

regionA = regionA.replace(historyEffect1, '');
regionA = regionA.replace(historyEffect2, '');

// --- 3. Remove handleNext ---
const handleNextBlock = `  function handleNext() {
    const nextState = step === 2 ? prepareAssetsForValidation(state) : state

    if (step === 2 && JSON.stringify(nextState.assets) !== JSON.stringify(state.assets)) {
      updateState(() => nextState)
    }

    const nextErrors = validateStep(step, nextState)
    setErrors(nextErrors)

    const firstError = Object.keys(nextErrors)[0]
    if (firstError) {
      scrollToField(firstError === 'assets' ? 'asset-0' : firstError)
      return
    }

    const nextStep = Math.min(4, step + 1)
    if (nextStep !== step) {
      if (typeof window !== 'undefined') {
        window.history.pushState({ step: nextStep }, '')
      }
      setStep(nextStep)
    }
  }`;
regionA = regionA.replace(handleNextBlock, '');

// --- 4. Remove handleBack ---
const handleBackBlock = `  function handleBack() {
    if (step === 1) {
      return
    }

    if (typeof window !== 'undefined') {
      window.history.back()
    } else {
      setStep((current) => current - 1)
    }
  }`;
regionA = regionA.replace(handleBackBlock, '');

// --- 5. Fix handleSave step navigation ---
const saveStepNavBlock = `      const targetStep = getStepForFieldKey(firstErrorKey)
      if (typeof window !== 'undefined') {
        window.history.pushState({ step: targetStep }, '')
      }
      setStep(targetStep)
      window.setTimeout(() => scrollToField(firstErrorKey === 'assets' ? 'asset-0' : firstErrorKey), 0)`;
regionA = regionA.replace(saveStepNavBlock, `      const targetStage = getStageForFieldKey(firstErrorKey)
      setActiveStage(targetStage)
      window.setTimeout(() => scrollToField(firstErrorKey === 'assets' ? 'asset-0' : firstErrorKey), 0)`);

// --- 6. Replace getStepForFieldKey ---
const getStepBlock = `function getStepForFieldKey(fieldKey: string) {
  if (fieldKey === 'title' || fieldKey === 'goal') {
    return 1
  }

  if (fieldKey === 'assets' || fieldKey.startsWith('asset-')) {
    return 2
  }

  return 3
}`;
regionA = regionA.replace(getStepBlock, `function getStageForFieldKey(fieldKey: string): 'brief' | 'setup' | 'questions' | 'review' {
  if (fieldKey === 'title' || fieldKey === 'goal') {
    return 'brief'
  }
  if (fieldKey === 'assets' || fieldKey.startsWith('asset-')) {
    return 'setup'
  }
  return 'questions'
}`);

// --- 7. Remove renderStepNavigation ---
// Because this is large, let's use indexOf and substring
const renderNavStart = regionA.indexOf("  function renderStepNavigation(position: 'top' | 'bottom') {");
if (renderNavStart !== -1) {
  const renderNavEnd = regionA.indexOf('  }', regionA.indexOf('    )') + 5) + 3;
  // Let's just find the exact block for renderStepNavigation up to its closing brace
  // It ends before `  if (isLoading) {`
  const renderNavEndReal = regionA.indexOf('  if (isLoading) {', renderNavStart);
  regionA = regionA.substring(0, renderNavStart) + regionA.substring(renderNavEndReal);
}

// --- 8. Remove StepIndicator ---
const stepIndStart = regionA.indexOf('function StepIndicator({ step }: { step: number }) {');
if (stepIndStart !== -1) {
  const stepIndEnd = regionA.indexOf('}', regionA.indexOf('return (', stepIndStart)) + 1;
  const nextFn = regionA.indexOf('function ', stepIndStart + 10);
  regionA = regionA.substring(0, stepIndStart) + regionA.substring(nextFn !== -1 ? nextFn : stepIndEnd);
}

// --- 9. Build new JSX Return ---
const newReturn = `
  // Completion indicators for stage tabs
  const briefComplete = state.title.trim().length >= 5 && state.goal.trim().length >= 10
  const setupComplete = committedAssetCount > 0
  const meaningfulQuestionCount = state.questions.filter((q) => q.text.trim().length >= 5).length
  const questionsComplete = meaningfulQuestionCount > 0
  const reviewReady = briefComplete && setupComplete && questionsComplete

  const stages = [
    { id: 'brief' as const, label: 'Brief', complete: briefComplete },
    { id: 'setup' as const, label: 'Setup', complete: setupComplete },
    { id: 'questions' as const, label: 'Questions', complete: questionsComplete },
    { id: 'review' as const, label: 'Review', complete: reviewReady },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] selection:bg-[var(--electric)] selection:text-white pb-[80px]">
      {/* ── Top bar ── */}
      <div className="w-full border-b border-[var(--border)] bg-[var(--cream)]/60 backdrop-blur-sm sticky top-0 z-30">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="text-sm font-semibold text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors cursor-none"
              onClick={() => router.push('/dashboard/founder')}
            >
              ← Dashboard
            </button>
            <h1 className="text-lg font-[family-name:var(--font-fraunces)] italic font-normal text-[var(--ink)] hidden sm:block">
              {isEditMode ? 'Edit Mission' : 'Create Mission'}
            </h1>
          </div>
          <div className="inline-flex rounded-full bg-[var(--electric)]/10 px-3 py-1 text-xs font-bold text-[var(--electric)] uppercase">
            {state.difficulty}
          </div>
        </div>

        {/* ── Stage Tabs ── */}
        <div className="mx-auto max-w-4xl px-4 sm:px-6 md:px-8 pb-0">
          <div className="flex gap-1 overflow-x-auto hide-scrollbar">
            {stages.map((stage) => (
              <button
                key={stage.id}
                type="button"
                onClick={() => setActiveStage(stage.id)}
                className={\`relative flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-t-xl transition-all cursor-none whitespace-nowrap \${
                  activeStage === stage.id
                    ? 'bg-[var(--bg)] text-[var(--electric)] border border-[var(--border)] border-b-[var(--bg)] -mb-px z-10'
                    : 'text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--bg)]/50'
                }\`}
              >
                {stage.label}
                {stage.complete ? (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle className="h-3 w-3" />
                  </span>
                ) : activeStage !== stage.id ? (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--border)] text-[var(--ink-soft)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content Area ── */}
      <div className="flex-1 w-full mx-auto max-w-4xl px-4 sm:px-6 md:px-8">
        {/* ── Banners ── */}
        <div className="pt-6">
          {showDraftBanner ? (<div className="mb-6 flex items-center justify-between rounded-xl border border-[rgba(251,191,36,0.2)] bg-[rgba(251,191,36,0.06)] p-4"><span className="text-sm font-semibold text-[#92400e]">You have an unsaved draft. Continue where you left off?</span><button type="button" onClick={() => { clearLocalDraft(); dirtyRef.current = false; setState(hydratedStateRef.current); setShowDraftBanner(false) }} className="text-sm font-bold text-[#92400e] underline hover:text-amber-900 cursor-none">Clear draft</button></div>) : null}
          {showRejectedBanner ? (<div className="mb-6 rounded-xl border border-[rgba(251,191,36,0.2)] bg-[rgba(251,191,36,0.06)] p-4"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold text-amber-900">This mission was rejected. Review the feedback below, make your changes, and resubmit for review.</p><p className="mt-2 text-sm text-[#92400e]">{rejectedReviewNote}</p></div><button type="button" onClick={() => setShowRejectedBanner(false)} className="text-sm font-bold text-[#92400e] underline hover:text-amber-900 cursor-none">Dismiss</button></div></div>) : null}
        </div>

        {/* ── BRIEF ── */}
        {activeStage === 'brief' ? (
          <div className="space-y-8 animate-in fade-in duration-200 pb-8">
            <div className="rounded-[12px] border border-[var(--border)] bg-[var(--cream)] p-6 space-y-8">
              <div data-field-key="title">
                <label className="mb-3 block text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">GIVE YOUR MISSION A TITLE</label>
                <input
                  value={state.title}
                  onChange={(event) => updateState((current) => ({ ...current, title: event.target.value }))}
                  placeholder="e.g. First impression test for our onboarding flow"
                  className={\`\${textFieldClass} focus:border-[var(--electric)] focus:ring-2 focus:ring-[var(--electric-dim)] cursor-none\`}
                />
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-[#c0392b]">{errors.title}</span>
                  <span className="text-sm text-[var(--ink-soft)]">{state.title.length}/100</span>
                </div>
              </div>

              <div data-field-key="goal">
                <label className="mb-3 block text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">WHAT DO YOU WANT TO LEARN?</label>
                <textarea
                  value={state.goal}
                  onBlur={handleGoalBlur}
                  onChange={(event) => updateState((current) => ({ ...current, goal: event.target.value }))}
                  placeholder="e.g. I want to know if first-time visitors understand what we do within 10 seconds, and whether the pricing page feels trustworthy."
                  rows={5}
                  className={\`\${textFieldClass} resize-none focus:border-[var(--electric)] focus:ring-2 focus:ring-[var(--electric-dim)] cursor-none\`}
                />
                <div className="mt-2 flex items-center justify-between">
                  <span className={\`text-sm \${errors.goal ? 'text-[#c0392b]' : 'text-[#92400e]'}\`}>{errors.goal || goalWarning}</span>
                  <span className="text-sm text-[var(--ink-soft)]">{state.goal.length}/300</span>
                </div>
                <div className="mt-3 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--ink-soft)]">What makes a good goal?</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 text-green-500">✓</span>
                      <span className="text-[var(--ink)]">&quot;Do visitors understand what this product does in under 30 seconds?&quot;</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 text-green-500">✓</span>
                      <span className="text-[var(--ink)]">&quot;Does the checkout flow feel confusing or trustworthy?&quot;</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 text-red-400">✗</span>
                      <span className="text-[var(--ink-soft)]">&quot;Give me feedback on my website.&quot; — too vague, testers won&apos;t know what to focus on</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <label className="mb-4 block text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">DIFFICULTY</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {([
                  { value: 'EASY', note: 'Quick impressions', detail: 'Testers spend 2 minutes, visit your link, and answer a few quick questions. Best for first impressions and top-of-funnel clarity.' },
                  { value: 'MEDIUM', note: 'Detailed feedback', detail: 'Testers spend up to 4 minutes, explore key flows, and give structured written feedback. Best for UX and messaging.' },
                  { value: 'HARD', note: 'Complex analysis', detail: 'Testers spend up to 6 minutes, dig into specific features, and write detailed analysis. Best for product decisions and conversion problems.' },
                ] as const).map((difficulty) => (
                  <button
                    key={difficulty.value}
                    type="button"
                    onClick={() => updateState((current) => ({ ...current, difficulty: difficulty.value }))}
                    className={\`rounded-[12px] p-5 text-left transition-all \${
                      state.difficulty === difficulty.value
                        ? 'border-2 border-[var(--electric)] bg-[rgba(255,107,26,0.04)]'
                        : 'border border-[var(--border)] bg-transparent opacity-80 hover:border-[var(--border-strong)] transition-colors'
                    } cursor-none\`}
                  >
                    <div className="mb-1 text-lg font-bold text-[var(--ink)]">{difficulty.value}</div>
                    <div className="text-sm text-[var(--ink-soft)]">{difficulty.note}</div>
                    <div className="mt-2 text-xs leading-relaxed text-[var(--ink-soft)]">{difficulty.detail}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {/* ── SETUP ── */}
        {activeStage === 'setup' ? (
          <div className="space-y-8 animate-in fade-in duration-200 pb-8">
            {/* Estimated Minutes */}
            <div className="rounded-[12px] border border-[var(--border)] bg-[var(--cream)] p-6">
              <label className="mb-4 block text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">ESTIMATED MINUTES</label>
              <input type="range" min={2} max={4} step={1} value={state.estimatedMinutes} onChange={(event) => updateState((current) => ({ ...current, estimatedMinutes: Number(event.target.value) }))} className="w-full accent-[var(--electric)] cursor-none" />
              <div className="mt-4 text-center">
                <div className="text-2xl font-[family-name:var(--font-fraunces)] italic font-normal text-[var(--ink)]">{state.estimatedMinutes} minutes</div>
                <p className="mt-1 text-sm text-[var(--ink-soft)]">Missions must be 2–4 minutes</p>
              </div>
            </div>

            {/* Testers */}
            <div className="rounded-[12px] border border-[var(--border)] bg-[var(--cream)] p-6">
              <label className="mb-4 block text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">NUMBER OF TESTERS</label>
              <input type="range" min={1} max={3} step={1} value={state.testersRequired > 3 ? 1 : state.testersRequired} onChange={(event) => updateState((current) => ({ ...current, testersRequired: Number(event.target.value) }))} className="w-full accent-[var(--electric)] cursor-none" />
              <div className="mt-4 text-center">
                <div className="text-2xl font-[family-name:var(--font-fraunces)] italic font-normal text-[var(--ink)]">{state.testersRequired > 3 ? 1 : state.testersRequired} testers</div>
                <p className="mt-1 text-sm text-[var(--ink-soft)]">Only 3 tester slots available right now — more coming soon.</p>
              </div>
            </div>

            {/* Deadline */}
            <div className="rounded-[12px] border border-[var(--border)] bg-[var(--cream)] p-6">
              <label className="mb-4 block text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">TESTER DEADLINE</label>
              <select
                value={state.timeoutDuration}
                onChange={(event) => updateState((current) => ({ ...current, timeoutDuration: Number(event.target.value) }))}
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-base font-bold text-[var(--ink)] outline-none transition-colors focus:border-[var(--electric)] focus:ring-2 focus:ring-[var(--electric)]/20 cursor-none"
              >
                {testerDeadlineOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <p className="mt-2 text-sm text-[var(--ink-soft)]">Testers must complete the mission before this deadline after assignment.</p>
            </div>

            {/* Assets */}
            <div className="space-y-4">
              <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">ASSETS</label>
              <div className="rounded-2xl border border-[rgba(251,191,36,0.2)] bg-[rgba(251,191,36,0.06)] p-4 text-sm text-[#92400e]">
                <p>How to make your mission work: use links that testers can open without logging in, confirm they still work in an incognito window, and if the product needs login, add a TEXT asset with a demo account and password.</p>
              </div>
              {errors.assets ? <p className="text-sm text-[#c0392b]">{errors.assets}</p> : null}
              {state.assets.map((asset, index) => (
                <div key={index} className="rounded-[12px] border border-[var(--border)] bg-[var(--cream)] p-6" data-field-key={\`asset-\${index}\`}>
                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    {(['LINK', 'SCREENSHOT', 'VIDEO', 'TEXT'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setAssetChecks((current) => { const next = { ...current }; delete next[index]; return next })
                          setAssetPreviewUrls((current) => { const next = { ...current }; delete next[index]; return next })
                          updateState((current) => ({
                            ...current,
                            assets: current.assets.map((currentAsset, assetIndex) =>
                              assetIndex === index ? { type, url: '', text: '', label: currentAsset.label ?? '' } : currentAsset
                            ),
                          }))
                        }}
                        className={\`cursor-none rounded-full px-3 py-1 text-xs font-bold \${asset.type === type ? 'bg-blue-100 text-blue-700' : 'bg-[#f3f3f5] text-[var(--ink-soft)]'}\`}
                      >
                        {type}
                      </button>
                    ))}
                    {state.assets.length > 1 ? (
                      <button
                        type="button"
                        className="ml-auto text-[var(--ink-soft)] cursor-none text-xl leading-none"
                        onClick={() => {
                          setAssetChecks((current) => removeIndexedEntry(current, index))
                          setAssetPreviewUrls((current) => removeIndexedEntry(current, index))
                          updateState((current) => ({ ...current, assets: current.assets.filter((_, assetIndex) => assetIndex !== index) }))
                        }}
                      >×</button>
                    ) : null}
                  </div>

                  {asset.type === 'TEXT' ? (
                    <textarea value={asset.text ?? ''} onChange={(event) => updateState((current) => ({ ...current, assets: current.assets.map((currentAsset, assetIndex) => assetIndex === index ? { ...currentAsset, text: event.target.value } : currentAsset) }))} rows={3} className={\`\${textFieldClass} resize-none cursor-none\`} />
                  ) : isUploadAssetType(asset.type) ? (
                    <div
                      className="rounded-2xl border border-dashed border-[#d8d6de] bg-[var(--bg)] p-4 outline-none transition-colors focus:border-[var(--electric)] focus:bg-[#fff7f2]"
                      tabIndex={0}
                      onPaste={(event) => void handleAssetPaste(index, event)}
                    >
                      <input
                        ref={(element) => { assetFileInputRefs.current[index] = element }}
                        type="file"
                        accept={getUploadAssetAccept(asset.type)}
                        className="hidden cursor-none"
                        onChange={(event) => void handleAssetFileSelected(index, event.target.files?.[0] ?? null)}
                      />
                      {asset.type === 'SCREENSHOT' && (assetPreviewUrls[index] || asset.url) ? (
                        <div className="mb-4 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--cream)]">
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
                          <p className="text-sm font-semibold text-[var(--ink)]">
                            {asset.url
                              ? getUploadedAssetName(asset.url)
                              : asset.type === 'SCREENSHOT' && assetPreviewUrls[index]
                              ? 'Screenshot ready to upload'
                              : \`No \${asset.type === 'SCREENSHOT' ? 'screenshot' : 'video'} uploaded yet\`}
                          </p>
                          <p className="mt-1 text-xs text-[var(--ink-soft)]">{getUploadAssetHelperText(asset.type)}</p>
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
                        <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-[var(--cream)] px-4 py-3 text-sm">
                          <span className="truncate text-[var(--ink)]">{asset.url}</span>
                          <a href={asset.url} target="_blank" rel="noreferrer" className="shrink-0 font-semibold text-[var(--electric)] hover:underline cursor-none">Preview</a>
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
                          setAssetChecks((prev) => { const copy = { ...prev }; delete copy[index]; return copy })
                          setErrors((prev) => { const copy = { ...prev }; delete copy[\`asset-\${index}\`]; return copy })
                          updateState((current) => ({ ...current, assets: current.assets.map((currentAsset, assetIndex) => assetIndex === index ? { ...currentAsset, url: val } : currentAsset) }))
                        }}
                        placeholder="https://example.com"
                        className={\`\${textFieldClass} cursor-none\`}
                      />
                      {assetChecks[index] === 'checking' ? <SpinnerIcon className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--ink-soft)]" /> : null}
                      {assetChecks[index] === 'reachable' && !errors[\`asset-\${index}\`] ? <CheckCircle className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-green-600" /> : null}
                      {assetChecks[index] === 'unreachable' ? <XCircle className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#c0392b]" /> : null}
                    </div>
                  )}
                  <input value={asset.label ?? ''} onChange={(event) => updateState((current) => ({ ...current, assets: current.assets.map((currentAsset, assetIndex) => assetIndex === index ? { ...currentAsset, label: event.target.value } : currentAsset) }))} placeholder="Optional label" className={\`\${textFieldClass} mt-3 cursor-none\`} />
                  <p className="mt-1 text-sm text-[#c0392b]">{errors[\`asset-\${index}\`]}</p>
                </div>
              ))}
              {state.assets.length < 3 ? <button type="button" className="text-sm font-semibold text-[var(--electric)] hover:underline cursor-none" onClick={() => updateState((current) => ({ ...current, assets: [...current.assets, { type: 'LINK', url: '', label: '' }] }))}>+ Add another asset</button> : null}
            </div>
          </div>
        ) : null}

        {/* ── QUESTIONS ── */}
        {activeStage === 'questions' ? (
          <div className="space-y-6 animate-in fade-in duration-200 pb-8">
            <div className="rounded-[12px] border border-[var(--border)] bg-[var(--cream)] p-6">
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
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">Suggested templates</p>
                  <h3 className="mt-2 text-xl font-bold text-[var(--ink)]">Start with proven questions</h3>
                  <p className="mt-2 text-sm text-[var(--ink-soft)]">Insert a template, then rewrite it to match your mission. These are generic prompts that work across most tests.</p>
                </div>
                <span className="text-sm font-semibold text-[var(--electric)]">{state.questions.length}/6 questions</span>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {questionTemplates.map((template) => (
                  <div key={template.title} className="rounded-2xl border border-[#ece8e1] bg-[var(--bg)] p-4 wizard-template-card">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-[var(--ink)]">{template.title}</p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[var(--electric)]">{template.question.type.replaceAll('_', ' ')}</p>
                      </div>
                      <button
                        type="button"
                        disabled={state.questions.length >= 6}
                        className="rounded-full border border-[var(--electric)]/30 px-3 py-1 text-xs font-bold text-[var(--electric)] transition-colors hover:bg-[var(--electric)]/10 disabled:cursor-not-allowed disabled:opacity-40 cursor-none"
                        onClick={() => insertQuestionTemplate(template)}
                      >INSERT</button>
                    </div>
                    <p className="mt-3 text-sm text-[var(--ink)]">{template.question.text}</p>
                    <p className="mt-2 text-xs text-[var(--ink-soft)]">{template.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {state.questions.map((question, index) => (
              <div key={index} className="rounded-[12px] border border-[var(--border)] bg-[var(--cream)] p-6" data-field-key={\`question-\${index}\`}>
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-sm font-bold text-[var(--electric)]">QUESTION {index + 1}</div>
                  {state.questions.length > 1 ? <button type="button" className="text-[var(--ink-soft)] cursor-none text-xl leading-none" onClick={() => updateState((current) => ({ ...current, questions: current.questions.filter((_, questionIndex) => questionIndex !== index) }))}>×</button> : null}
                </div>
                <input value={question.text} onChange={(event) => updateState((current) => ({ ...current, questions: current.questions.map((currentQuestion, questionIndex) => questionIndex === index ? { ...currentQuestion, text: event.target.value } : currentQuestion) }))} placeholder="e.g. What was your first impression?" className={textFieldClass} />
                <p className="mt-1 text-sm text-[#c0392b]">{errors[\`question-\${index}\`]}</p>
                <p className="mt-2 text-xs text-[var(--ink-soft)]">Ask one specific thing. Vague questions like &quot;What do you think?&quot; produce vague answers. Better: &quot;Did the pricing feel too high, too low, or about right?&quot;</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {([
                    ['TEXT_SHORT', 'Short text'],
                    ['TEXT_LONG', 'Long text'],
                    ['RATING_1_5', 'Rating'],
                    ['MULTIPLE_CHOICE', 'Multiple choice'],
                    ['YES_NO', 'Yes/No'],
                  ] as const).map(([type, label]) => (
                    <button key={type} type="button" onClick={() => updateState((current) => ({ ...current, questions: current.questions.map((currentQuestion, questionIndex) => questionIndex === index ? { ...currentQuestion, type, options: type === 'MULTIPLE_CHOICE' ? currentQuestion.options && currentQuestion.options.length >= 2 ? currentQuestion.options : ['', ''] : undefined } : currentQuestion) }))} className={\`rounded-full px-3 py-1 text-sm font-semibold \${question.type === type ? 'bg-[var(--electric)]/10 text-[var(--electric)]' : 'bg-[#f3f3f5] text-[var(--ink-soft)] cursor-none'}\`}>{label}</button>
                  ))}
                </div>
                {question.type ? <p className="mt-2 text-xs text-[var(--ink-soft)]">{questionTypeDescriptions[question.type]}</p> : null}
                {question.type ? <p className="mt-1 text-xs text-[var(--electric)]/80">{questionTypeUseCases[question.type]}</p> : null}
                {question.type === 'MULTIPLE_CHOICE' ? (
                  <div className="mt-4 space-y-3">
                    {(question.options ?? []).map((option, optionIndex) => (
                      <div key={optionIndex} className="flex items-center gap-3">
                        <input value={option} onChange={(event) => updateState((current) => ({ ...current, questions: current.questions.map((currentQuestion, questionIndex) => questionIndex === index ? { ...currentQuestion, options: (currentQuestion.options ?? []).map((currentOption, currentOptionIndex) => currentOptionIndex === optionIndex ? event.target.value : currentOption) } : currentQuestion) }))} className={textFieldClass} />
                        {(question.options?.length ?? 0) > 2 ? <button type="button" className="text-[var(--ink-soft)] cursor-none text-xl leading-none" onClick={() => updateState((current) => ({ ...current, questions: current.questions.map((currentQuestion, questionIndex) => questionIndex === index ? { ...currentQuestion, options: (currentQuestion.options ?? []).filter((_, currentOptionIndex) => currentOptionIndex !== optionIndex) } : currentQuestion) }))}>×</button> : null}
                      </div>
                    ))}
                    <p className="text-sm text-[#c0392b]">{errors[\`question-options-\${index}\`]}</p>
                    {(question.options?.length ?? 0) < 5 ? <button type="button" className="text-sm font-semibold text-[var(--electric)] hover:underline cursor-none" onClick={() => updateState((current) => ({ ...current, questions: current.questions.map((currentQuestion, questionIndex) => questionIndex === index ? { ...currentQuestion, options: [...(currentQuestion.options ?? []), ''] } : currentQuestion) }))}>+ Add option</button> : null}
                  </div>
                ) : null}
                <div className="mt-4 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-[var(--ink-soft)] cursor-none"><input type="checkbox" checked={question.required} onChange={(event) => updateState((current) => ({ ...current, questions: current.questions.map((currentQuestion, questionIndex) => questionIndex === index ? { ...currentQuestion, required: event.target.checked } : currentQuestion) }))} className="cursor-none" />Required</label>
                  <div className="flex items-center gap-2">
                    <button type="button" disabled={index === 0} className="text-sm text-[var(--ink-soft)] disabled:opacity-40 cursor-none" onClick={() => updateState((current) => { const questions = [...current.questions];[questions[index - 1], questions[index]] = [questions[index], questions[index - 1]]; return { ...current, questions } })}>↑ Move Up</button>
                    <button type="button" disabled={index === state.questions.length - 1} className="text-sm text-[var(--ink-soft)] disabled:opacity-40 cursor-none" onClick={() => updateState((current) => { const questions = [...current.questions];[questions[index], questions[index + 1]] = [questions[index + 1], questions[index]]; return { ...current, questions } })}>↓ Move Down</button>
                  </div>
                </div>
              </div>
            ))}

            {state.questions.length < 6 ? <button type="button" className={\`px-6 py-3 \${primaryButtonClass} cursor-none\`} onClick={() => updateState((current) => ({ ...current, questions: [...current.questions, { text: '', type: 'TEXT_SHORT', required: true, order: current.questions.length }] }))}>+ ADD QUESTION</button> : null}
          </div>
        ) : null}

        {/* ── REVIEW ── */}
        {activeStage === 'review' ? (
          <div className="space-y-6 animate-in fade-in duration-200 pb-8">
            <div className="rounded-[12px] border border-[var(--border)] bg-[var(--cream)] p-6 overflow-hidden">
              <div className="wizard-review-header">
                <div className="mb-2 text-sm font-bold text-[var(--electric)]">TITLE</div>
                <div className="text-xl font-bold text-[var(--ink)]">{state.title || <span className="text-[var(--ink-soft)] italic">Not set</span>}</div>
              </div>
            </div>
            <div className="rounded-[12px] border border-[var(--border)] bg-[var(--cream)] p-6">
              <div className="mb-2 text-sm font-bold text-[var(--electric)]">GOAL</div>
              <p className="text-[var(--ink)]">{state.goal || <span className="text-[var(--ink-soft)] italic">Not set</span>}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-[12px] border border-[var(--border)] bg-[var(--cream)] p-5">
                <div className="mb-1 text-xs font-bold uppercase text-[var(--electric)]">Difficulty</div>
                <div className="text-lg font-bold text-[var(--ink)]">{state.difficulty}</div>
              </div>
              <div className="rounded-[12px] border border-[var(--border)] bg-[var(--cream)] p-5">
                <div className="mb-1 text-xs font-bold uppercase text-[var(--electric)]">Testers</div>
                <div className="text-lg font-bold text-[var(--ink)]">{state.testersRequired > 3 ? 1 : state.testersRequired}</div>
              </div>
              <div className="rounded-[12px] border border-[var(--border)] bg-[var(--cream)] p-5">
                <div className="mb-1 text-xs font-bold uppercase text-[var(--electric)]">Deadline</div>
                <div className="text-lg font-bold text-[var(--ink)]">{testerDeadlineOptions.find((option) => option.value === state.timeoutDuration)?.label ?? '7 days'}</div>
              </div>
            </div>

            {/* Pre-submission checklist */}
            <div className="rounded-[12px] border border-[var(--border)] bg-[var(--cream)] p-6">
              <div className="mb-4 text-sm font-bold uppercase tracking-wide text-[var(--electric)]">Pre-submission checklist</div>
              <div className="space-y-3">
                <div className={\`flex items-start justify-between rounded-2xl border px-4 py-3 \${committedAssetCount > 0 ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}\`}>
                  <div className="flex items-start gap-3">
                    {committedAssetCount > 0 ? <CheckCircle className="mt-0.5 h-5 w-5 text-emerald-600" /> : <XCircle className="mt-0.5 h-5 w-5 text-[#c0392b]" />}
                    <div>
                      <p className="font-semibold text-[var(--ink)]">At least one asset added</p>
                      {committedAssetCount === 0 ? <p className="mt-1 text-sm text-[#c0392b]">Add at least one asset before submitting</p> : null}
                    </div>
                  </div>
                  <span className={\`text-sm font-bold \${committedAssetCount > 0 ? 'text-emerald-700' : 'text-red-700'}\`}>{committedAssetCount > 0 ? 'Ready' : 'Blocked'}</span>
                </div>
                <div className={\`flex items-start justify-between rounded-2xl border px-4 py-3 \${meaningfulQuestionCount > 0 ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}\`}>
                  <div className="flex items-start gap-3">
                    {meaningfulQuestionCount > 0 ? <CheckCircle className="mt-0.5 h-5 w-5 text-emerald-600" /> : <XCircle className="mt-0.5 h-5 w-5 text-[#c0392b]" />}
                    <div>
                      <p className="font-semibold text-[var(--ink)]">At least one question added</p>
                      {meaningfulQuestionCount === 0 ? <p className="mt-1 text-sm text-[#c0392b]">Add at least one question before submitting</p> : null}
                    </div>
                  </div>
                  <span className={\`text-sm font-bold \${meaningfulQuestionCount > 0 ? 'text-emerald-700' : 'text-red-700'}\`}>{meaningfulQuestionCount > 0 ? 'Ready' : 'Blocked'}</span>
                </div>
              </div>
            </div>

            {/* Payment summary */}
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
            {submitError ? <p className="text-sm text-[#c0392b]">{submitError}</p> : null}
          </div>
        ) : null}
      </div>

      {/* ── Sticky Action Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-[var(--cream)]/80 backdrop-blur-sm p-4">
        <div className="mx-auto max-w-4xl flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            disabled={pendingAction !== null}
            className={\`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 \${outlineButtonClass} cursor-none bg-white\`}
            onClick={() => void handleSave('draft')}
          >
            {pendingAction === 'draft' ? <SpinnerIcon className="w-5 h-5" /> : null}
            {isEditMode ? 'SAVE CHANGES' : 'SAVE AS DRAFT'}
          </button>
          <button
            type="button"
            disabled={pendingAction !== null || !canReviewChecklistSubmit}
            className={\`w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 text-base \${primaryButtonClass} rounded-[12px] bg-[var(--electric)] text-[var(--cream)] font-semibold transition-opacity hover:opacity-90 cursor-none\`}
            onClick={() => void handleSave('submit')}
          >
            {pendingAction === 'submit' ? <SpinnerIcon className="w-5 h-5" /> : null}
            PAY & LAUNCH MISSION
          </button>
        </div>
      </div>

      {/* ── Bill Modal ── */}
      {showBillModal && pendingMissionPayload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[var(--cream)] p-6 shadow-2xl">
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
                onClick={() => { setShowBillModal(false); setPendingAction(null) }}
                className="flex-1 rounded-full border border-[var(--border)] py-2 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--bg)] transition-colors cursor-none"
              >Cancel</button>
              <button
                onClick={handleConfirmPayment}
                disabled={pendingAction === 'submit'}
                className="flex-1 rounded-full bg-[var(--electric)] py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50 cursor-none"
              >{pendingAction === 'submit' ? 'Processing...' : 'CONFIRM & PAY'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MissionWizardPageLoading() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="w-full border-b border-[var(--border)] bg-[var(--cream)]/60">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 md:px-8 py-4">
          <div className="h-6 w-40 animate-pulse rounded-full bg-[var(--border)]" />
        </div>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 md:px-8 pb-3">
          <div className="flex gap-2">
            <div className="h-9 w-20 animate-pulse rounded-t-xl bg-[var(--border)]" />
            <div className="h-9 w-20 animate-pulse rounded-t-xl bg-[var(--border)]" />
            <div className="h-9 w-28 animate-pulse rounded-t-xl bg-[var(--border)]" />
            <div className="h-9 w-20 animate-pulse rounded-t-xl bg-[var(--border)]" />
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 md:px-8 pt-6">
        <WizardStepSkeleton step={1} />
      </div>
    </div>
  )
}
`;

fs.writeFileSync(srcPath, regionA + newReturn, 'utf8');
console.log('✅ Updated MissionWizardPage.tsx successfully!');
