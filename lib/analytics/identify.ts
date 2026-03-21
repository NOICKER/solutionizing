import posthog from 'posthog-js'

export function identifyUser(
  userId: string,
  properties: {
    role: string
    email: string
  }
) {
  posthog.identify(userId, properties)
}
