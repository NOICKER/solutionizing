"use client"

import { useEffect } from 'react'
import posthog from 'posthog-js'
import { PostHogProvider as PostHogContextProvider } from 'posthog-js/react'
import PostHogPageView from '@/providers/PostHogPageView'

let posthogInitialized = false

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (posthogInitialized) {
      return
    }

    const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST

    if (!apiKey || !apiHost) {
      return
    }

    posthog.init(apiKey, {
      api_host: apiHost,
      capture_pageview: false,
      opt_out_capturing_by_default: true,
      session_recording: {
        maskAllInputs: false,
      },
    })

    const consent = window.localStorage.getItem('cookieConsent')
    if (consent === 'accepted') {
      posthog.opt_in_capturing()
    } else if (consent === 'declined') {
      posthog.opt_out_capturing()
    }

    posthogInitialized = true
  }, [])

  return (
    <PostHogContextProvider client={posthog}>
      <PostHogPageView />
      {children}
    </PostHogContextProvider>
  )
}
