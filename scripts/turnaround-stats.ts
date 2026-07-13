import { prisma } from '@/lib/prisma'

async function main() {
  console.log('Querying completed missions...')
  
  const missions = await prisma.mission.findMany({
    where: {
      status: 'COMPLETED',
    },
    select: {
      id: true,
      launchedAt: true,
      completedAt: true,
    }
  })

  if (missions.length === 0) {
    console.log('No COMPLETED missions found.')
    return
  }

  let totalTurnaroundMs = 0
  let minTurnaroundMs = Infinity
  let maxTurnaroundMs = -Infinity
  
  let validMissionsCount = 0

  console.log(`Found ${missions.length} completed missions. Calculating turnaround times...\n`)
  console.log('--- Individual Missions ---')

  missions.forEach(mission => {
    if (!mission.launchedAt || !mission.completedAt) {
      console.log(`Mission ${mission.id}: Missing launchedAt or completedAt, skipping.`)
      return
    }

    const turnaroundMs = mission.completedAt.getTime() - mission.launchedAt.getTime()
    const turnaroundHours = turnaroundMs / (1000 * 60 * 60)
    
    console.log(`Mission ${mission.id}: ${turnaroundHours.toFixed(2)} hours`)

    totalTurnaroundMs += turnaroundMs
    if (turnaroundMs < minTurnaroundMs) minTurnaroundMs = turnaroundMs
    if (turnaroundMs > maxTurnaroundMs) maxTurnaroundMs = turnaroundMs
    
    validMissionsCount++
  })

  console.log('\n--- Summary ---')
  console.log(`Total valid completed missions included: ${validMissionsCount}`)
  
  if (validMissionsCount > 0) {
    const avgMs = totalTurnaroundMs / validMissionsCount
    console.log(`Average turnaround time: ${(avgMs / (1000 * 60 * 60)).toFixed(2)} hours`)
    console.log(`Minimum turnaround time: ${(minTurnaroundMs / (1000 * 60 * 60)).toFixed(2)} hours`)
    console.log(`Maximum turnaround time: ${(maxTurnaroundMs / (1000 * 60 * 60)).toFixed(2)} hours`)
  }
}

main()
  .catch(e => {
    console.error('Error running script:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
