"use client"

import { useEffect } from 'react'

export default function LegacyResetPasswordPage() {
  useEffect(() => {
    const nextUrl = `/auth/reset-password${window.location.search}${window.location.hash}`

    window.location.replace(nextUrl)
  }, [])

  return null
}
