const fs = require('fs');
const srcPath = 'components/solutionizing/MissionWizardPage.tsx';
let src = fs.readFileSync(srcPath, 'utf8');

src = src.replace(/function renderStepNavigation\(position: 'top' \| 'bottom'\) \{[\s\S]*?\n\s+\}\n/g, '');

fs.writeFileSync(srcPath, src, 'utf8');
console.log('✅ Removed renderStepNavigation');
