const fs = require('fs');
const srcPath = 'components/solutionizing/MissionWizardPage.tsx';
let src = fs.readFileSync(srcPath, 'utf8');

// 1. Remove history effect 1
src = src.replace(/useEffect\(\(\) => \{\s+if \(typeof window !== 'undefined'\) \{\s+if \(!window\.history\.state \|\| typeof window\.history\.state\.step === 'undefined'\) \{\s+window\.history\.replaceState\(\{ step: 1 \}, ''\)\s+\} else \{\s+setStep\(window\.history\.state\.step\)\s+\}\s+\}\s+\}, \[\]\)/g, '');

// 2. Remove history effect 2
src = src.replace(/useEffect\(\(\) => \{\s+if \(typeof window === 'undefined'\) return\s+const handlePopState = \(event: PopStateEvent\) => \{\s+if \(event\.state && typeof event\.state\.step === 'number'\) \{\s+setStep\(event\.state\.step\)\s+\}\s+\}\s+window\.addEventListener\('popstate', handlePopState\)\s+return \(\) => window\.removeEventListener\('popstate', handlePopState\)\s+\}, \[\]\)/g, '');

// 3. Remove handleNext
src = src.replace(/function handleNext\(\) \{[\s\S]*?setStep\(nextStep\)\s+\}\s+\}/g, '');

// 4. Remove handleBack
src = src.replace(/function handleBack\(\) \{\s+if \(step === 1\) \{\s+return\s+\}\s+if \(typeof window !== 'undefined'\) \{\s+window\.history\.back\(\)\s+\} else \{\s+setStep\(\(current\) => current - 1\)\s+\}\s+\}/g, '');

// 5. Replace step assignments in handleSave
src = src.replace(/const targetStep = getStepForFieldKey\(firstErrorKey\)[\s\S]*?setStep\(targetStep\)/g, 'const targetStage = getStageForFieldKey(firstErrorKey)\\n      setActiveStage(targetStage)');

// 6. Delete getStepForFieldKey (we already added getStageForFieldKey manually in the new UI or maybe I didn't? Wait, I added it in my return block? No, I added getStageForFieldKey previously in rewrite. Let's just ensure it is there).
if (!src.includes('getStageForFieldKey')) {
  src = src.replace(/function getStepForFieldKey[\s\S]*?return 3\n\}/g, `function getStageForFieldKey(fieldKey: string): 'brief' | 'setup' | 'questions' | 'review' {
  if (fieldKey === 'title' || fieldKey === 'goal') return 'brief'
  if (fieldKey === 'assets' || fieldKey.startsWith('asset-')) return 'setup'
  return 'questions'
}`);
}

fs.writeFileSync(srcPath, src, 'utf8');
console.log('✅ Cleaned up old state successfully');
