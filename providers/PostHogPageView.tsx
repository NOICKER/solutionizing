"use client"

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import posthog from 'posthog-js'

export default function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const queryString = searchParams.toString()

  useEffect(() => {
    if (!pathname) {
      return
    }

    const url = queryString ? `${pathname}?${queryString}` : pathname
    posthog.capture('$pageview', {
      $current_url: url,
    })
  }, [pathname, queryString])

  return null
}
