const fs = require('fs')
const path = require('path')

function readWorkspaceFile(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8')
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

const testerWorkspaceSource = readWorkspaceFile('components/solutionizing/TesterWorkspacePage.tsx')
const flagModalSource = readWorkspaceFile('components/solutionizing/FlagSignalModal.tsx')

const legacyWorkspaceTokens = [
  'bg-[#faf9f7]',
  'bg-white',
  'text-[#1a1625]',
  'text-[#6b687a]',
  'text-[#9b98a8]',
  'border-[#e5e4e0]',
]

for (const token of legacyWorkspaceTokens) {
  assert(
    !testerWorkspaceSource.includes(token),
    `Tester workspace still includes legacy light-theme token: ${token}`
  )
}

assert(
  testerWorkspaceSource.includes("const workspacePageClass = 'min-h-screen bg-background"),
  'Tester workspace should use the shared dark page shell.'
)

assert(
  testerWorkspaceSource.includes("const selectedChoiceClass = 'border-primary/60 bg-primary/12 text-text-main"),
  'Selected multiple-choice options should keep readable text on the tester workspace.'
)

assert(
  !flagModalSource.includes('bg-white'),
  'Flag modal should not render on a plain white surface anymore.'
)

assert(
  flagModalSource.includes('bg-surface'),
  'Flag modal should use the shared dark surface token.'
)

console.log('Tester workspace theme checks passed.')
