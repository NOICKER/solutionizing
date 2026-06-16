const fs = require('fs');

const path = 'c:\\Users\\Shubhi Mishra\\Desktop\\solutionizing 5\\components\\solutionizing\\MissionWizardPage.tsx';
let content = fs.readFileSync(path, 'utf8');

console.log("Original length:", content.length);

// 1. Remove state hooks
content = content.replace(/const \[step, setStep\] = useState\(1\)\n/, '');
content = content.replace(/useEffect\(\(\) => \{\n\s+if \(typeof window !== 'undefined'\) \{\n\s+if \(!window\.history\.state \|\| typeof window\.history\.state\.step === 'undefined'\) \{\n\s+window\.history\.replaceState\(\{ step: 1 \}, ''\)\n\s+\} else \{\n\s+setStep\(window\.history\.state\.step\)\n\s+\}\n\s+\}\n\s+\}, \[\]\)\n/, '');
content = content.replace(/useEffect\(\(\) => \{\n\s+if \(typeof window === 'undefined'\) return\n\s+const handlePopState = \(event: PopStateEvent\) => \{\n\s+if \(event\.state && typeof event\.state\.step === 'number'\) \{\n\s+setStep\(event\.state\.step\)\n\s+\}\n\s+\}\n\s+window\.addEventListener\('popstate', handlePopState\)\n\s+return \(\) => window\.removeEventListener\('popstate', handlePopState\)\n\s+\}, \[\]\)\n/, '');

// 2. Remove functions
content = content.replace(/function handleNext\(\) \{[\s\S]*?\}\n\s+\}\n\s+\}\n\n/, '');
content = content.replace(/function handleBack\(\) \{[\s\S]*?\}\n\s+\}\n\n/, '');
content = content.replace(/function renderStepNavigation\(position: 'top' \| 'bottom'\) \{[\s\S]*?\}\n\s+\}\n\n/, '');
content = content.replace(/function StepIndicator\(\{ step \}: \{ step: number \}\) \{[\s\S]*?\}\n\s+\}\n\n/, '');

// 3. Rewrite render tree
// We replace everything from `return (` at the bottom up to the end of the component.
const renderStartRegex = /return \(\n\s*<div className="min-h-screen bg-\[var\(--bg\)\] pb-12">[\s\S]*?\{showRejectedBanner \? \([\s\S]*?\) : null\}\n\s*<StepIndicator step=\{step\} \/>\n\s*<div className="mb-8 inline-flex rounded-full bg-\[var\(--electric\)\]\/10 px-4 py-2 text-sm font-bold text-\[var\(--electric\)\]">\n\s*\{state\.difficulty\}\n\s*<\/div>\n\s*<h2 className="mb-8 text-3xl font-\[family-name:var\(--font-fraunces\)\] italic font-normal text-\[var\(--ink\)\] ">\n\s*\{step === 1 \? 'Mission Brief' : step === 2 \? 'Mission Setup' : step === 3 \? 'Questions' : 'Review'\}\n\s*<\/h2>\n\s*\{renderStepNavigation\('top'\)\}\n\s*\{step === 1 \? \(\n\s*<div className="space-y-8 rounded-\[12px\] border border-\[var\(--border\)\] bg-\[var\(--cream\)\] p-4">/;

const col1Start = `return (
  <div className="min-h-screen xl:h-screen xl:overflow-hidden bg-[var(--bg)] pb-12 xl:pb-0 flex flex-col font-['Satoshi'] selection:bg-[var(--electric)] selection:text-white">
    <div className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 pt-6 xl:pt-10 transition-all duration-300">
      {showDraftBanner ? (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-[rgba(251,191,36,0.2)] bg-[rgba(251,191,36,0.06)] p-4">
          <span className="text-sm font-semibold text-[#92400e]">You have an unsaved draft. Continue where you left off?</span>
          <button type="button" onClick={() => { clearLocalDraft(); dirtyRef.current = false; setState(hydratedStateRef.current); setShowDraftBanner(false) }} className="text-sm font-bold text-[#92400e] underline hover:text-amber-900 cursor-none">Clear draft</button>
        </div>
      ) : null}
      {showRejectedBanner ? (
        <div className="mb-6 rounded-xl border border-[rgba(251,191,36,0.2)] bg-[rgba(251,191,36,0.06)] p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-amber-900">This mission was rejected. Review the feedback below, make your changes, and resubmit for review.</p>
              <p className="mt-2 text-sm text-[#92400e]">{rejectedReviewNote}</p>
            </div>
            <button type="button" onClick={() => setShowRejectedBanner(false)} className="text-sm font-bold text-[#92400e] underline hover:text-amber-900 cursor-none">Dismiss</button>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 h-full items-start">
        {/* Column 1: Brief & Setup (3/12) */}
        <div className="xl:col-span-3 flex flex-col gap-6 xl:overflow-y-auto xl:h-[calc(100vh-120px)] xl:pr-4 hide-scrollbar pb-10">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-[family-name:var(--font-fraunces)] italic font-normal text-[var(--ink)]">1. Brief & Setup</h2>
            <div className="inline-flex rounded-full bg-[var(--electric)]/10 px-3 py-1 text-xs font-bold text-[var(--electric)] uppercase">{state.difficulty}</div>
          </div>
          <div className="space-y-8 rounded-[12px] border border-[var(--border)] bg-[var(--cream)] p-4">`;

content = content.replace(renderStartRegex, col1Start);

// Now step 1 end and step 2 start
content = content.replace(/\n\s*\) : null\}\n\n\s*\{step === 2 \? \(\n\s*<div className="space-y-8">/, `\n          </div>\n          <div className="space-y-8">`);

// Step 2 end and step 3 start
content = content.replace(/\n\s*\) : null\}\n\n\s*\{step === 3 \? \(\n\s*<div className="space-y-8">/, `\n          </div>\n        </div>\n\n        {/* Column 2: Assets & Questions (5/12) */}\n        <div className="xl:col-span-5 flex flex-col gap-6 xl:overflow-y-auto xl:h-[calc(100vh-120px)] xl:pr-4 hide-scrollbar pb-10">\n          <h2 className="text-xl font-[family-name:var(--font-fraunces)] italic font-normal text-[var(--ink)]">2. Assets & Questions</h2>\n          <div className="space-y-8">`);

// Step 3 end and step 4 start
content = content.replace(/\n\s*\) : null\}\n\n\s*\{step === 4 \? \(\n\s*<div className="space-y-8">/, `\n          </div>\n        </div>\n\n        {/* Column 3: Review & Launch (4/12) */}\n        <div className="xl:col-span-4 flex flex-col gap-6 xl:overflow-y-auto xl:h-[calc(100vh-120px)] xl:pr-4 hide-scrollbar pb-10">\n          <h2 className="text-xl font-[family-name:var(--font-fraunces)] italic font-normal text-[var(--ink)]">3. Review & Launch</h2>\n          <div className="space-y-8">`);

// Step 4 end and final bottom nav replacement
content = content.replace(/\n\s*\) : null\}\n\n\s*\{renderStepNavigation\('bottom'\)\}\n\s*<\/div>/, `\n          </div>\n          <div className="mt-4 flex flex-col sm:flex-row flex-wrap items-center justify-end gap-3 w-full">
            <button
              type="button"
              disabled={pendingAction !== null}
              className={\`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 \${outlineButtonClass} cursor-none\`}
              onClick={() => void handleSave('draft')}
            >
              {pendingAction === 'draft' ? <SpinnerIcon className="w-5 h-5" /> : null}
              {isEditMode ? 'SAVE CHANGES' : 'SAVE AS DRAFT'}
            </button>
            <button
              type="button"
              disabled={pendingAction !== null || !canReviewChecklistSubmit}
              className={\`w-full sm:w-auto flex items-center justify-center gap-2 px-10 py-4 text-base \${primaryButtonClass} rounded-[12px] bg-[var(--electric)] text-[var(--cream)] font-semibold transition-opacity hover:opacity-90 cursor-none\`}
              onClick={() => void handleSave('submit')}
            >
              {pendingAction === 'submit' ? <SpinnerIcon className="w-5 h-5" /> : null}
              PAY & LAUNCH MISSION
            </button>
          </div>\n        </div>\n      </div>\n    </div>`);

console.log("New length:", content.length);
fs.writeFileSync(path, content, 'utf8');
console.log('Done rewriting.');
