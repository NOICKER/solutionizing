import { assignTestersToMission } from './lib/business/assignment'

async function run() {
  const missionId = 'cmp6vcpyu000a14d4hld4gati'
  console.log(`Starting test assignment for mission: ${missionId}`)
  
  try {
    const result = await assignTestersToMission(missionId)
    console.log('Result:', result)
  } catch (error) {
    console.error('Error during assignment:', error)
  }
}

run().then(() => process.exit(0))
