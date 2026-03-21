"use client"

import { Suspense, useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import posthog from 'posthog-js'

function PostHogPageViewContent() {
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

function PostHogPageViewLoading() {
  return null
}

export default function PostHogPageView() {
  return (
    <Suspense fallback={<PostHogPageViewLoading />}>
      <PostHogPageViewContent />
    </Suspense>
  )
}
