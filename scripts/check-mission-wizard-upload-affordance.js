const fs = require('node:fs')
const path = require('node:path')

const wizardPath = path.join(__dirname, '..', 'components', 'solutionizing', 'MissionWizardPage.tsx')
const source = fs.readFileSync(wizardPath, 'utf8')

const requiredPatterns = [
  {
    label: 'hidden file input for upload assets',
    pattern: /type="file"/,
  },
  {
    label: 'upload handler for screenshot and video assets',
    pattern: /handleAssetFileSelected/,
  },
  {
    label: 'upload-specific asset type detection',
    pattern: /SCREENSHOT'\s*\|\|\s*type\s*===\s*'VIDEO'|type\s*===\s*'SCREENSHOT'\s*\|\|\s*asset\.type\s*===\s*'VIDEO'|isUploadAssetType/,
  },
]

const missingPatterns = requiredPatterns.filter(({ pattern }) => !pattern.test(source))

if (missingPatterns.length > 0) {
  console.error('Mission wizard upload affordance is incomplete:')

  for (const entry of missingPatterns) {
    console.error(`- Missing ${entry.label}`)
  }

  process.exit(1)
}

console.log('Mission wizard upload affordance is present.')
