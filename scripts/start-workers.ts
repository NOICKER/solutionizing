const { startQueueWorkers, stopQueueWorkers } = require('../lib/queue/workers')

async function main() {
  startQueueWorkers()

  const shutdown = async (signal: string) => {
    console.log(`[QueueWorkers] Received ${signal}. Shutting down workers.`)
    await stopQueueWorkers()
    process.exit(0)
  }

  process.on('SIGINT', () => {
    void shutdown('SIGINT')
  })

  process.on('SIGTERM', () => {
    void shutdown('SIGTERM')
  })
}

void main()
