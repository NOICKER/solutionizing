let sessionExpiredHandler: ((nextPath: string) => void) | null = null
let handlingSessionExpiry = false

export function registerSessionExpiredHandler(handler: (nextPath: string) => void) {
  sessionExpiredHandler = handler

  return () => {
    if (sessionExpiredHandler === handler) {
      sessionExpiredHandler = null
    }
  }
}

export function notifySessionExpired(nextPath: string) {
  if (!sessionExpiredHandler || handlingSessionExpiry) {
    return
  }

  handlingSessionExpiry = true
  sessionExpiredHandler(nextPath)

  window.setTimeout(() => {
    handlingSessionExpiry = false
  }, 0)
}
