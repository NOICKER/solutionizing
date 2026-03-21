import { redirect } from 'next/navigation'

function appendSearchParams(searchParams: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, item)
      }
      continue
    }

    if (typeof value === 'string') {
      params.set(key, value)
    }
  }

  const query = params.toString()

  return query ? `/auth?${query}` : '/auth'
}

export default function AuthLoginPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  redirect(appendSearchParams(searchParams))
}
