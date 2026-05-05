const fs = require('node:fs')
const path = require('node:path')

const migrationsDir = path.join(__dirname, '..', 'prisma', 'migrations')
const migrationFiles = fs
  .readdirSync(migrationsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => path.join(migrationsDir, entry.name, 'migration.sql'))
  .filter((filePath) => fs.existsSync(filePath))

const migrationSql = migrationFiles
  .map((filePath) => fs.readFileSync(filePath, 'utf8'))
  .join('\n')

const requiredChanges = [
  {
    label: 'mission review rejection reason column',
    pattern: /rejectionReason/,
  },
  {
    label: 'approved mission status enum value',
    pattern: /APPROVED/,
  },
  {
    label: 'mission retest parent relation column',
    pattern: /parentMissionId/,
  },
]

const missingChanges = requiredChanges.filter(({ pattern }) => !pattern.test(migrationSql))

if (missingChanges.length > 0) {
  console.error('Missing mission schema migrations:')

  for (const change of missingChanges) {
    console.error(`- ${change.label}`)
  }

  process.exit(1)
}

console.log('Mission schema migrations cover review and retest fields.')
