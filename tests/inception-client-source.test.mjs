import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const workspaceRoot = path.resolve(__dirname, '..')
const clientPath = path.join(workspaceRoot, 'lib/inception.ts')
const envExamplePath = path.join(workspaceRoot, '.env.example')

let clientSource = ''
try {
  clientSource = await readFile(clientPath, 'utf8')
} catch {
  assert.fail('lib/inception.ts should define a reusable Mercury client')
}

const envExampleSource = await readFile(envExamplePath, 'utf8')

assert.match(envExampleSource, /^INCEPTION_API_KEY=/m)
assert.match(clientSource, /INCEPTION_BASE_URL\s*=\s*['"]https:\/\/api\.inceptionlabs\.ai\/v1['"]/)
assert.match(clientSource, /\/chat\/completions/)
assert.match(clientSource, /model:\s*['"]mercury-2['"]/)
assert.match(clientSource, /process\.env\.INCEPTION_API_KEY/)
assert.doesNotMatch(clientSource, /NEXT_PUBLIC_INCEPTION/)
assert.match(clientSource, /reasoning_effort:\s*options\?\.reasoning_effort\s*\?\?\s*['"]medium['"]/)
assert.match(clientSource, /temperature:\s*options\?\.temperature\s*\?\?\s*0\.75/)
assert.match(clientSource, /max_tokens:\s*options\?\.max_tokens\s*\?\?\s*8192/)
assert.match(clientSource, /Mercury API error/)

console.log('Inception Mercury client source checks passed.')
