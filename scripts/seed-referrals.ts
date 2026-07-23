import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const code = 'DIVYAM75'

  const existing = await prisma.referralCode.findUnique({
    where: { code },
  })

  if (existing) {
    console.log(`Referral code "${code}" already exists (id: ${existing.id}, timesUsed: ${existing.timesUsed}, active: ${existing.active}). Skipping.`)
    return
  }

  const created = await prisma.referralCode.create({
    data: {
      code,
      referrerName: 'Divyam',
      discountAmount: 40,
      active: true,
    },
  })

  console.log(`Created referral code "${created.code}" (id: ${created.id})`)
}

main()
  .catch((error) => {
    console.error('Seed error:', error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
