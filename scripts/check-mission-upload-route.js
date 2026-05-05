const fs = require('node:fs')
const path = require('node:path')

const routePath = path.join(__dirname, '..', 'app', 'api', 'v1', 'uploads', 'sign', 'route.ts')
const source = fs.readFileSync(routePath, 'utf8')

const requiredPatterns = [
  {
    label: 'bucket existence check',
    pattern: /getBucket\('mission-assets'\)|ensureMissionAssetsBucket/,
  },
  {
    label: 'bucket creation fallback',
    pattern: /createBucket\('mission-assets'|ensureMissionAssetsBucket/,
  },
  {
    label: 'signed upload retry after bucket setup',
    pattern: /createSignedUploadUrl\(path\)/,
  },
]

const missingPatterns = requiredPatterns.filter(({ pattern }) => !pattern.test(source))

if (missingPatterns.length > 0) {
  console.error('Mission upload route is incomplete:')

  for (const entry of missingPatterns) {
    console.error(`- Missing ${entry.label}`)
  }

  process.exit(1)
}

console.log('Mission upload route covers bucket setup and signed uploads.')
