import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const workspaceRoot = path.resolve(__dirname, '..')
const synthesizePath = path.join(workspaceRoot, 'lib/ai/synthesize.ts')

const synthesizeSource = await readFile(synthesizePath, 'utf8')

assert.match(synthesizeSource, /import \{ callMercury \} from ['"]@\/lib\/inception['"]/)
assert.match(synthesizeSource, /callMercury\(\[/)
assert.match(synthesizeSource, /role:\s*['"]system['"]/)
assert.match(synthesizeSource, /reasoning_effort:\s*['"]medium['"]/)
assert.match(synthesizeSource, /max_tokens:\s*1200/)
assert.doesNotMatch(synthesizeSource, /GEMINI_API_KEY/)
assert.doesNotMatch(synthesizeSource, /generativelanguage\.googleapis/)
assert.match(synthesizeSource, /JSON\.parse/)

console.log('Synthesis Mercury source checks passed.')
