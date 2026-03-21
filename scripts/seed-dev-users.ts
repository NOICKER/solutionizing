import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DEV_TESTER_ID = 'dev-tester-00000000-0000-0000-0000-000000000001'
const DEV_FOUNDER_ID = 'dev-founder-0000000-0000-0000-0000-000000000002'

async function main() {
    console.log('🌱 Seeding dev users...\n')

    // ── Tester ──
    const tester = await prisma.user.upsert({
        where: { id: DEV_TESTER_ID },
        update: {},
        create: {
            id: DEV_TESTER_ID,
            email: 'dev-tester@solutionizing.local',
            role: 'TESTER',
            emailVerified: true,
            testerProfile: {
                create: {
                    displayName: 'Dev Tester',
                    coinBalance: 500,
                    reputationScore: 75.0,
                    reputationTier: 'RELIABLE',
                },
            },
        },
        include: { testerProfile: true },
    })
    console.log('✅ Tester created/found:', tester.id, tester.email)

    // ── Founder ──
    const founder = await prisma.user.upsert({
        where: { id: DEV_FOUNDER_ID },
        update: {},
        create: {
            id: DEV_FOUNDER_ID,
            email: 'dev-founder@solutionizing.local',
            role: 'FOUNDER',
            emailVerified: true,
            founderProfile: {
                create: {
                    displayName: 'Dev Founder',
                    coinBalance: 1000,
                },
            },
        },
        include: { founderProfile: true },
    })
    console.log('✅ Founder created/found:', founder.id, founder.email)

    console.log('\n🎉 Dev users seeded successfully!')
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e)
        process.exit(1)
    })
    .finally(async () => await prisma.$disconnect())
