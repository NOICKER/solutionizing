// Blocked domains — URLs containing these are rejected
const BLOCKED_DOMAINS = [
  'stripe.com', 'paypal.com', 'checkout.com', 'square.com',
  'venmo.com', 'cashapp.com', 'gofundme.com',  // Payment
  'dropbox.com/s/', 'drive.google.com',          // File downloads
  'wetransfer.com', 'filebin.net',               // File sharing
]
// Blocked file extensions in URLs
const BLOCKED_EXTENSIONS = [
  '.exe', '.dmg', '.apk', '.msi', '.pkg',
  '.zip', '.rar', '.tar', '.gz',
  '.sh', '.bat', '.ps1', '.cmd',
]
export interface UrlCheckResult {
  safe: boolean
  reason?: string
}
export async function checkUrl(url: string): Promise<UrlCheckResult> {
  // Check for blocked domains
  for (const domain of BLOCKED_DOMAINS) {
    if (url.toLowerCase().includes(domain)) {
      return { safe: false, reason: `URL contains blocked domain: ${domain}` }
    }
  }
  // Check for blocked extensions
  for (const ext of BLOCKED_EXTENSIONS) {
    if (url.toLowerCase().endsWith(ext)) {
      return { safe: false, reason: `URL links to a blocked file type: ${ext}` }
    }
  }
  // Verify URL is reachable (HEAD request, 5 second timeout)
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    const res = await fetch(url, { method: 'HEAD', signal: controller.signal })
    clearTimeout(timeout)
    if (res.status === 401 || res.status === 403) {
      return { safe: false, reason: 'URL requires login or is access-restricted' }
    }
  } catch {
    return { safe: false, reason: 'URL is not reachable' }
  }
  return { safe: true }
}
