const fs = require('fs');
const filePath = 'components/solutionizing/MissionWizardPage.tsx';
const raw = fs.readFileSync(filePath, 'utf8');
const NL = raw.includes('\r\n') ? '\r\n' : '\n';
const L = raw.split(NL);
const O = [];

function cp(s, e) { for (let i = s - 1; i <= e - 1; i++) O.push(L[i]); }

// ──────────────────────────────────────────────
// Lines 1-6: imports before React (unchanged)
// ──────────────────────────────────────────────
cp(1, 6);

// Line 7: Add Fragment to React import
O.push("import { Fragment, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'");

// Lines 8-558: unchanged (types, helpers, constants, component start, state before activeStage)
cp(8, 558);

// Line 559: Replace activeStage with step
O.push("  const [step, setStep] = useState(1)");

// Lines 560-855: unchanged (rest of state, effects, handlers up to getStageForFieldKey)
cp(560, 855);

// Lines 856-860: SKIP getStageForFieldKey (deleted)

// Lines 861-873: blank line + handleSave start (unchanged)
cp(861, 873);

// Lines 874-875: Fix to use getStepForFieldKey + setStep
O.push("      const targetStep = getStepForFieldKey(firstErrorKey)");
O.push("      setStep(targetStep)");

// Lines 876-1154: unchanged (rest of handleSave, handleConfirmPayment, memos, helpers)
cp(876, 1154);

// Lines 1155-1215: SKIP renderStepNavigation (deleted - was dead code)

// Lines 1216-1226: blank + isLoading early return + blank (unchanged)
cp(1216, 1226);

// ══════════════════════════════════════════════
// NEW RETURN BLOCK
// ══════════════════════════════════════════════
O.push("  return (");
O.push("    <div className=\"h-screen flex flex-col bg-[var(--bg)] font-['Satoshi'] selection:bg-[var(--electric)] selection:text-white\">");
O.push("");

// ── ZONE 1: Fixed top bar ──
O.push("      {/* ── ZONE 1: Fixed top bar ── */}");
O.push("      <div className=\"shrink-0 bg-[var(--cream)] border-b border-[var(--border)]\">");

// Draft banner
O.push("        {showDraftBanner ? (");
O.push("          <div className=\"mx-auto max-w-[720px] mt-4 px-4 sm:px-6 flex items-center justify-between rounded-xl border border-[rgba(251,191,36,0.2)] bg-[rgba(251,191,36,0.06)] p-4\">");
O.push("            <span className=\"text-sm font-semibold text-[#92400e]\">You have an unsaved draft. Continue where you left off?</span>");
O.push("            <button");
O.push("              type=\"button\"");
O.push("              onClick={() => {");
O.push("                clearLocalDraft()");
O.push("                dirtyRef.current = false");
O.push("                setState(hydratedStateRef.current)");
O.push("                setShowDraftBanner(false)");
O.push("              }}");
O.push("              className=\"text-sm font-bold text-[#92400e] underline hover:text-amber-900 cursor-none\"");
O.push("            >");
O.push("              Clear draft");
O.push("            </button>");
O.push("          </div>");
O.push("        ) : null}");

// Rejected banner
O.push("        {showRejectedBanner ? (");
O.push("          <div className=\"mx-auto max-w-[720px] mt-4 px-4 sm:px-6 rounded-xl border border-[rgba(251,191,36,0.2)] bg-[rgba(251,191,36,0.06)] p-4\">");
O.push("            <div className=\"flex items-start justify-between gap-4\">");
O.push("              <div>");
O.push("                <p className=\"text-sm font-semibold text-amber-900\">This mission was rejected. Review the feedback below, make your changes, and resubmit for review.</p>");
O.push("                <p className=\"mt-2 text-sm text-[#92400e]\">{rejectedReviewNote}</p>");
O.push("              </div>");
O.push("              <button type=\"button\" onClick={() => setShowRejectedBanner(false)} className=\"text-sm font-bold text-[#92400e] underline hover:text-amber-900 cursor-none\">Dismiss</button>");
O.push("            </div>");
O.push("          </div>");
O.push("        ) : null}");
O.push("");

// Step tabs
O.push("        <div className=\"mx-auto max-w-[720px] px-4 sm:px-6 flex items-center justify-center py-5 gap-0\">");
O.push("          {([");
O.push("            { num: 1, label: 'Brief' },");
O.push("            { num: 2, label: 'Setup' },");
O.push("            { num: 3, label: 'Questions' },");
O.push("            { num: 4, label: 'Review' },");
O.push("          ] as const).map((s, i) => {");
O.push("            const isActive = step === s.num");
O.push("            const isCompleted = s.num < 4 && Object.keys(validateStep(s.num, state)).length === 0 && !isActive");
O.push("            return (");
O.push("              <Fragment key={s.num}>");
O.push("                {i > 0 && <div className={`h-0.5 w-8 sm:w-12 transition-colors ${step > i ? 'bg-[var(--electric)]' : 'bg-[var(--border)]'}`} />}");
O.push("                <button");
O.push("                  type=\"button\"");
O.push("                  onClick={() => setStep(s.num)}");
O.push("                  className={`flex items-center gap-2 rounded-full px-3 sm:px-4 py-2 text-sm font-semibold transition-all cursor-none ${");
O.push("                    isActive");
O.push("                      ? 'bg-[var(--electric)] text-white shadow-md'");
O.push("                      : isCompleted");
O.push("                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'");
O.push("                        : 'bg-[var(--bg)] text-[var(--ink-soft)] border border-[var(--border)] hover:border-[var(--ink-soft)]'");
O.push("                  }`}");
O.push("                >");
O.push("                  {isCompleted ? (");
O.push("                    <CheckCircle className=\"h-4 w-4\" />");
O.push("                  ) : (");
O.push("                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${");
O.push("                      isActive ? 'bg-white/20 text-white' : 'bg-[var(--border)] text-[var(--ink-soft)]'");
O.push("                    }`}>{s.num}</span>");
O.push("                  )}");
O.push("                  <span className=\"hidden sm:inline\">{s.label}</span>");
O.push("                </button>");
O.push("              </Fragment>");
O.push("            )");
O.push("          })}");
O.push("        </div>");
O.push("      </div>");
O.push("");

// ── ZONE 2: Scrollable middle ──
O.push("      {/* ── ZONE 2: Scrollable middle ── */}");
O.push("      <div className=\"flex-1 overflow-y-auto\">");
O.push("        <div className=\"mx-auto max-w-[720px] px-4 sm:px-6 md:px-8 py-8 space-y-8\">");
O.push("");

// Step 1: Brief (original lines 1277-1324)
O.push("          {step === 1 && (");
O.push("            <>");
cp(1277, 1324);
O.push("            </>");
O.push("          )}");
O.push("");

// Step 2: Setup (original lines 1326-1577)
O.push("          {step === 2 && (");
O.push("            <>");
cp(1326, 1577);
O.push("            </>");
O.push("          )}");
O.push("");

// Step 3: Questions (original lines 1583-1680)
O.push("          {step === 3 && (");
O.push("            <>");
cp(1583, 1680);
O.push("            </>");
O.push("          )}");
O.push("");

// Step 4: Review (original lines 1686-1745)
O.push("          {step === 4 && (");
O.push("            <>");
cp(1686, 1745);
O.push("            </>");
O.push("          )}");
O.push("");

O.push("        </div>");
O.push("      </div>");
O.push("");

// ── ZONE 3: Fixed bottom bar ──
O.push("      {/* ── ZONE 3: Fixed bottom bar ── */}");
O.push("      <div className=\"shrink-0 border-t border-[var(--border)] bg-[var(--cream)] px-4 sm:px-8 py-4\">");
O.push("        <div className=\"mx-auto max-w-[720px] flex items-center justify-between\">");

// Left side: Dashboard link or Back button
O.push("          <div>");
O.push("            {step === 1 ? (");
O.push("              <button type=\"button\" onClick={() => router.push('/dashboard/founder')} className=\"font-semibold text-[var(--electric)] hover:text-[#c0392b] cursor-none\">");
O.push("                ← Dashboard");
O.push("              </button>");
O.push("            ) : (");
O.push("              <button type=\"button\" onClick={() => setStep((s) => s - 1)} className=\"font-semibold text-[var(--ink-soft)] hover:text-[var(--ink)] cursor-none\">");
O.push("                ← Back");
O.push("              </button>");
O.push("            )}");
O.push("          </div>");

// Right side: Continue or Save/Pay buttons
O.push("          <div className=\"flex items-center gap-3\">");
O.push("            {step < 4 ? (");
O.push("              <button");
O.push("                type=\"button\"");
O.push("                className={`px-8 py-3.5 ${primaryButtonClass} cursor-none`}");
O.push("                onClick={() => {");
O.push("                  const stepErrors = validateStep(step, state)");
O.push("                  if (Object.keys(stepErrors).length > 0) {");
O.push("                    setErrors((current) => ({ ...current, ...stepErrors }))");
O.push("                    const firstKey = Object.keys(stepErrors)[0]");
O.push("                    window.setTimeout(() => scrollToField(firstKey), 0)");
O.push("                    return");
O.push("                  }");
O.push("                  setStep((s) => s + 1)");
O.push("                }}");
O.push("              >");
O.push("                CONTINUE →");
O.push("              </button>");
O.push("            ) : (");
O.push("              <>");
O.push("                <button");
O.push("                  type=\"button\"");
O.push("                  disabled={pendingAction !== null}");
O.push("                  className={`flex items-center justify-center gap-2 px-6 py-3.5 ${outlineButtonClass} cursor-none`}");
O.push("                  onClick={() => void handleSave('draft')}");
O.push("                >");
O.push("                  {pendingAction === 'draft' ? <SpinnerIcon className=\"w-5 h-5\" /> : null}");
O.push("                  {isEditMode ? 'SAVE CHANGES' : 'SAVE AS DRAFT'}");
O.push("                </button>");
O.push("                <button");
O.push("                  type=\"button\"");
O.push("                  disabled={pendingAction !== null || !canReviewChecklistSubmit}");
O.push("                  className={`flex items-center justify-center gap-2 px-10 py-4 text-base ${primaryButtonClass} cursor-none`}");
O.push("                  onClick={() => void handleSave('submit')}");
O.push("                >");
O.push("                  {pendingAction === 'submit' ? <SpinnerIcon className=\"w-5 h-5\" /> : null}");
O.push("                  PAY & LAUNCH MISSION");
O.push("                </button>");
O.push("              </>");
O.push("            )}");
O.push("          </div>");
O.push("        </div>");
O.push("      </div>");
O.push("");

// Bill modal (original lines 1771-1809, unchanged)
cp(1771, 1809);

// Close outer div and return
O.push("    </div>");
O.push("  )");
O.push("}");
O.push("");

// ──────────────────────────────────────────────
// Lines 1814-end: exports + loading component (unchanged)
// ──────────────────────────────────────────────
cp(1814, L.length);

fs.writeFileSync(filePath, O.join(NL), 'utf8');
console.log('✅ Refactored MissionWizardPage.tsx — ' + O.length + ' lines');
console.log('Changes:');
console.log('  - Replaced activeStage state with step (number 1-4)');
console.log('  - Removed getStageForFieldKey (used getStepForFieldKey instead)');
console.log('  - Removed dead renderStepNavigation function');
console.log('  - Rebuilt return block with 3-zone layout:');
console.log('    Zone 1: Fixed top bar with clickable step tabs');
console.log('    Zone 2: Scrollable middle with step-conditional content');
console.log('    Zone 3: Fixed bottom bar with Back/Continue/Pay buttons');
