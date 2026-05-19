import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const ids = ['cmp2ecw2h00022zg7kicsywfh', 'cmp8ot5es0002h4v9ps4nqbx9']
  
  for (const id of ids) {
    const assignments = await prisma.missionAssignment.findMany({
      where: { testerId: id }
    })
    console.log(`Assignments for ${id}:`, assignments.length)

    const tester = await prisma.testerProfile.findUnique({
      where: { id }
    })
    console.log(`TesterProfile ${id} exists?`, !!tester)

    // Now let's see if those IDs belong to USERs instead?
    const user = await prisma.user.findUnique({
      where: { id }
    })
    console.log(`User ${id} exists?`, !!user)

    // Let's check what their User ID maps to TesterProfile
    if (user) {
        const tpForUser = await prisma.testerProfile.findFirst({
            where: { userId: user.id }
        })
        console.log(`User ${id} maps to TesterProfile:`, tpForUser?.id)
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
