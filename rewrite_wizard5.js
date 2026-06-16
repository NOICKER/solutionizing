const fs = require('fs');

const path = 'c:\\Users\\Shubhi Mishra\\Desktop\\solutionizing 5\\components\\solutionizing\\MissionWizardPage.tsx';
let content = fs.readFileSync(path, 'utf8');

console.log("Original length:", content.length);

// 1. Remove state hooks
content = content.replace(/const \[step, setStep\] = useState\(1\)\n/g, '');
content = content.replace(/useEffect\(\(\) => \{\n\s+if \(typeof window !== 'undefined'\) \{\n\s+if \(!window\.history\.state \|\| typeof window\.history\.state\.step === 'undefined'\) \{\n\s+window\.history\.replaceState\(\{ step: 1 \}, ''\)\n\s+\} else \{\n\s+setStep\(window\.history\.state\.step\)\n\s+\}\n\s+\}\n\s+\}, \[\]\)\n/g, '');
content = content.replace(/useEffect\(\(\) => \{\n\s+if \(typeof window === 'undefined'\) return\n\s+const handlePopState = \(event: PopStateEvent\) => \{\n\s+if \(event\.state && typeof event\.state\.step === 'number'\) \{\n\s+setStep\(event\.state\.step\)\n\s+\}\n\s+\}\n\s+window\.addEventListener\('popstate', handlePopState\)\n\s+return \(\) => window\.removeEventListener\('popstate', handlePopState\)\n\s+\}, \[\]\)\n/g, '');

// 2. Remove functions
content = content.replace(/function handleNext\(\) \{[\s\S]*?\}\n\s+\}\n\s+\}\n\n/g, '');
content = content.replace(/function handleBack\(\) \{[\s\S]*?\}\n\s+\}\n\n/g, '');
content = content.replace(/function renderStepNavigation\(position: 'top' \| 'bottom'\) \{[\s\S]*?\}\n\s+\}\n\n/g, '');
content = content.replace(/function StepIndicator\(\{ step \}: \{ step: number \}\) \{[\s\S]*?\}\n\s+\}\n\n/g, '');

// 3. Rewrite render tree
// Find the exact line "return (" near the end. It's after `if (isLoading) { ... }`
const searchStr1 = `return (\n    <div className="min-h-screen bg-[var(--bg)] pb-12">\n      <div className="mx-auto max-w-2xl px-4 sm:px-6 md:px-8 transition-all duration-300 pt-6">\n`;
const split1 = content.split(searchStr1);
if (split1.length < 2) {
  console.log("Could not find start of render block.");
} else {
  let topPart = split1[0];
  let bottomPart = searchStr1 + split1.slice(1).join(searchStr1);

  // We need to replace everything before `{step === 1 ? (`
  const step1Index = bottomPart.indexOf('{step === 1 ? (');
  if (step1Index > -1) {
    // Keep everything up to the showRejectedBanner part
    // Let's just do an index based slice
    const stepIndIndex = bottomPart.indexOf('<StepIndicator step={step} />');
    if (stepIndIndex > -1) {
      const beforeStepInd = bottomPart.slice(0, stepIndIndex);
      
      const col1Start = `
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 h-[calc(100vh-120px)] items-start">
        {/* Column 1: Brief & Setup (3/12) */}
        <div className="xl:col-span-3 flex flex-col gap-6 overflow-y-auto h-full xl:pr-4 hide-scrollbar pb-10">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-[family-name:var(--font-fraunces)] italic font-normal text-[var(--ink)]">1. Brief & Setup</h2>
            <div className="inline-flex rounded-full bg-[var(--electric)]/10 px-3 py-1 text-xs font-bold text-[var(--electric)] uppercase">{state.difficulty}</div>
          </div>
          <div className="space-y-8 rounded-[12px] border border-[var(--border)] bg-[var(--cream)] p-4">
`;

      let newBottomPart = beforeStepInd + col1Start + bottomPart.slice(step1Index + '{step === 1 ? (\n          <div className="space-y-8 rounded-[12px] border border-[var(--border)] bg-[var(--cream)] p-4">\n'.length);

      // Now replace step boundaries
      newBottomPart = newBottomPart.replace(/\n\s*\) : null\}\n\n\s*\{step === 2 \? \(\n\s*<div className="space-y-8">/, `\n          </div>\n          <div className="space-y-8">`);
      
      newBottomPart = newBottomPart.replace(/\n\s*\) : null\}\n\n\s*\{step === 3 \? \(\n\s*<div className="space-y-8">/, `\n          </div>\n        </div>\n\n        {/* Column 2: Assets & Questions (5/12) */}\n        <div className="xl:col-span-5 flex flex-col gap-6 overflow-y-auto h-full xl:pr-4 hide-scrollbar pb-10">\n          <h2 className="text-xl font-[family-name:var(--font-fraunces)] italic font-normal text-[var(--ink)]">2. Assets & Questions</h2>\n          <div className="space-y-8">`);

      newBottomPart = newBottomPart.replace(/\n\s*\) : null\}\n\n\s*\{step === 4 \? \(\n\s*<div className="space-y-8">/, `\n          </div>\n        </div>\n\n        {/* Column 3: Review & Launch (4/12) */}\n        <div className="xl:col-span-4 flex flex-col gap-6 overflow-y-auto h-full xl:pr-4 hide-scrollbar pb-10">\n          <h2 className="text-xl font-[family-name:var(--font-fraunces)] italic font-normal text-[var(--ink)]">3. Review & Launch</h2>\n          <div className="space-y-8">`);

      // Final replacement for the end
      newBottomPart = newBottomPart.replace(/\n\s*\) : null\}\n\n\s*\{renderStepNavigation\('bottom'\)\}\n\s*<\/div>/, `\n          </div>\n          <div className="mt-4 flex flex-col sm:flex-row flex-wrap items-center justify-end gap-3 w-full">
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

      // Update the top wrapper class to remove max-w-2xl
      newBottomPart = newBottomPart.replace('<div className="mx-auto max-w-2xl px-4 sm:px-6 md:px-8 transition-all duration-300 pt-6">', '<div className="mx-auto max-w-[1600px] px-4 sm:px-6 md:px-8 transition-all duration-300 pt-6 h-screen flex flex-col">');
      newBottomPart = newBottomPart.replace('<div className="min-h-screen bg-[var(--bg)] pb-12">', '<div className="h-screen bg-[var(--bg)] overflow-hidden">');

      content = topPart + newBottomPart;
    } else {
      console.log("Could not find StepIndicator");
    }
  } else {
    console.log("Could not find step 1 check");
  }
}

console.log("New length:", content.length);
fs.writeFileSync(path, content, 'utf8');
console.log('Done rewriting.');
