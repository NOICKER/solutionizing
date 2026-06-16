const fs = require('fs');

const path = 'c:\\Users\\Shubhi Mishra\\Desktop\\solutionizing 5\\components\\solutionizing\\MissionWizardPage.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove state hooks and useEffects
content = content.replace(/const \[step, setStep\] = useState\(1\)\n/, '');
content = content.replace(/useEffect\(\(\) => \{\n\s+if \(typeof window !== 'undefined'\) \{\n\s+if \(!window\.history\.state \|\| typeof window\.history\.state\.step === 'undefined'\) \{\n\s+window\.history\.replaceState\(\{ step: 1 \}, ''\)\n\s+\} else \{\n\s+setStep\(window\.history\.state\.step\)\n\s+\}\n\s+\}\n\s+\}, \[\]\)\n/, '');
content = content.replace(/useEffect\(\(\) => \{\n\s+if \(typeof window === 'undefined'\) return\n\s+const handlePopState = \(event: PopStateEvent\) => \{\n\s+if \(event\.state && typeof event\.state\.step === 'number'\) \{\n\s+setStep\(event\.state\.step\)\n\s+\}\n\s+\}\n\s+window\.addEventListener\('popstate', handlePopState\)\n\s+return \(\) => window\.removeEventListener\('popstate', handlePopState\)\n\s+\}, \[\]\)\n/, '');

// 2. Remove functions
content = content.replace(/function handleNext\(\) \{[\s\S]*?\}\n\s+\}\n\s+\}\n\n/, '');
content = content.replace(/function handleBack\(\) \{[\s\S]*?\}\n\s+\}\n\n/, '');
content = content.replace(/function renderStepNavigation\(position: 'top' \| 'bottom'\) \{[\s\S]*?\}\n\s+\}\n\n/, '');
content = content.replace(/function StepIndicator\(\{ step \}: \{ step: number \}\) \{[\s\S]*?\}\n\s+\}\n\n/, '');

// 3. Transform render block
// Replace standard top level items
content = content.replace(/<StepIndicator step=\{step\} \/>\n/, '');
content = content.replace(/<h2.*?\{step === 1 \?.*?<\/h2>\n/, '');
content = content.replace(/\{renderStepNavigation\('top'\)\}\n/, '');
content = content.replace(/\{renderStepNavigation\('bottom'\)\}\n/, '');

// Replace the step wrappers
content = content.replace(/\{step === 1 \? \(\n\s*<div className="space-y-8 rounded-\[12px\] border border-\[var\(--border\)\] bg-\[var\(--cream\)\] p-4">/g, 
  '<div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">\n        <div className="space-y-8">\n          <h2 className="text-xl font-[family-name:var(--font-fraunces)] italic font-normal text-[var(--ink)]">Brief</h2>\n          <div className="space-y-8 rounded-[12px] border border-[var(--border)] bg-[var(--cream)] p-4">');
content = content.replace(/\n\s*\) : null\}\n\n\s*\{step === 2 \? \(\n\s*<div className="space-y-8">/g, 
  '\n        </div>\n\n        <div className="space-y-8">\n          <h2 className="text-xl font-[family-name:var(--font-fraunces)] italic font-normal text-[var(--ink)]">Setup</h2>\n          <div className="space-y-8 rounded-[12px] border border-[var(--border)] bg-[var(--cream)] p-4">');
content = content.replace(/\n\s*\) : null\}\n\n\s*\{step === 3 \? \(\n\s*<div className="space-y-8">/g, 
  '\n            </div>\n        </div>\n\n        <div className="space-y-8">\n          <h2 className="text-xl font-[family-name:var(--font-fraunces)] italic font-normal text-[var(--ink)]">Questions</h2>\n          <div className="space-y-8">');
content = content.replace(/\n\s*\) : null\}\n\n\s*\{step === 4 \? \(\n\s*<div className="space-y-8">/g, 
  '\n        </div>\n\n        <div className="space-y-8">\n          <h2 className="text-xl font-[family-name:var(--font-fraunces)] italic font-normal text-[var(--ink)]">Review</h2>\n          <div className="space-y-8 rounded-[12px] border border-[var(--border)] bg-[var(--cream)] p-4">');
content = content.replace(/\n\s*\) : null\}\n\n\s*<\/div>\n\s*\)\n\s*\}/g, '\n          </div>\n        </div>\n      </div>\n    </div>\n  )\n}');

// We also need to fix the submit button because it was inside `step === 4`. 
// Actually, it can stay there, we just need to make sure the bottom button uses validateMission instead of validateStep.
// Wait, `validateStep` was used, but we now have `getMissionValidationErrors(state)`.
// `handleCheckout` uses `getMissionValidationErrors`.

fs.writeFileSync(path, content, 'utf8');
console.log('Done');
