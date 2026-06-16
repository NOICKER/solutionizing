import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const workspaceRoot = path.resolve(__dirname, '..')

async function readSource(relativePath) {
  return readFile(path.join(workspaceRoot, relativePath), 'utf8')
}

function assertFileMissing(relativePath) {
  assert.equal(
    existsSync(path.join(workspaceRoot, relativePath)),
    false,
    `${relativePath} should be removed because dark mode is permanent.`
  )
}

async function readProjectSources(relativeDirectory) {
  const directory = path.join(workspaceRoot, relativeDirectory)
  const entries = await readdir(directory, { withFileTypes: true })
  const sources = []

  for (const entry of entries) {
    const relativePath = path.join(relativeDirectory, entry.name)

    if (entry.isDirectory()) {
      sources.push(...(await readProjectSources(relativePath)))
      continue
    }

    if (/\.(css|tsx?)$/.test(entry.name)) {
      sources.push([relativePath, await readSource(relativePath)])
    }
  }

  return sources
}

const [
  layoutSource,
  globalsSource,
  testerSettingsSource,
  testerDashboardSource,
  founderDashboardSource,
  founderProfileRouteSource,
  testerProfileRouteSource,
  currentUserSource,
  prismaSchemaSource,
  appSources,
  componentSources,
] =
  await Promise.all([
    readSource('app/layout.tsx'),
    readSource('app/globals.css'),
    readSource('components/solutionizing/tester/TesterSettingsTab.tsx'),
    readSource('components/solutionizing/TesterDashboardPage.tsx'),
    readSource('components/solutionizing/FounderDashboardPage.tsx'),
    readSource('app/api/v1/founder/profile/route.ts'),
    readSource('app/api/v1/tester/profile/route.ts'),
    readSource('lib/auth/current-user.ts'),
    readSource('prisma/schema.prisma'),
    readProjectSources('app'),
    readProjectSources('components'),
  ])

assert.match(layoutSource, /<html lang="en" className="dark" suppressHydrationWarning>/)
assert.doesNotMatch(layoutSource, /AppThemeBoundary/)
assert.doesNotMatch(layoutSource, /ThemeProvider/)

assert.doesNotMatch(globalsSource, /html\.dark/)
assert.doesNotMatch(globalsSource, /\.light-surface/)
assert.doesNotMatch(globalsSource, /\.dark-surface/)

assert.doesNotMatch(testerSettingsSource, /useTheme/)
assert.doesNotMatch(testerSettingsSource, /Dark Mode/)
assert.doesNotMatch(testerSettingsSource, /Toggle dark mode/)
assert.doesNotMatch(testerSettingsSource, /toggleDarkMode/)
assert.doesNotMatch(testerSettingsSource, /darkMode/)

assert.doesNotMatch(testerDashboardSource, /ThemeToggleButton/)
assert.doesNotMatch(founderDashboardSource, /ThemeToggleButton/)

for (const [relativePath, source] of [...appSources, ...componentSources]) {
  assert.doesNotMatch(source, /\blight-surface\b/, `${relativePath} should not use light-surface.`)
  assert.doesNotMatch(source, /\bdark-surface\b/, `${relativePath} should not use dark-surface.`)
}

for (const source of [founderProfileRouteSource, testerProfileRouteSource, currentUserSource, prismaSchemaSource]) {
  assert.doesNotMatch(source, /\bdarkMode\b/)
}

assertFileMissing('context/ThemeContext.tsx')
assertFileMissing('components/AppThemeBoundary.tsx')
assertFileMissing('components/solutionizing/shared/ThemeToggleButton.tsx')

console.log('Permanent dark theme source checks passed.')
