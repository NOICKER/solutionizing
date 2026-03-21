/**
 * Usage: npx ts-node scripts/promote-to-admin.ts user@example.com
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2]?.trim()

  if (!email) {
    console.error('Usage: npx ts-node scripts/promote-to-admin.ts user@example.com')
    process.exit(1)
  }

  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    console.error(`User not found for email: ${email}`)
    process.exit(1)
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      role: 'ADMIN',
    },
  })

  console.log(`Promoted ${updatedUser.email} to ADMIN.`)
}

main()
  .catch((error) => {
    console.error('Failed to promote user:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
