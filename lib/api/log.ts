export function logApiRouteError(request: Request, error: unknown) {
  const { method, url } = request
  const { pathname } = new URL(url)

  console.error(`[${method} ${pathname}] Route error:`, error)
}
