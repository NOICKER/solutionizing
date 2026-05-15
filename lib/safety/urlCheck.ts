import dns from 'node:dns/promises'

// Private / reserved IP ranges that must never be fetched
const PRIVATE_IP_RANGES = [
  // IPv4
  { prefix: '127.',       mask: null },        // 127.0.0.0/8  loopback
  { prefix: '10.',        mask: null },        // 10.0.0.0/8   private
  { prefix: '192.168.',   mask: null },        // 192.168.0.0/16
  { prefix: '169.254.',   mask: null },        // 169.254.0.0/16 link-local (AWS metadata)
  // 172.16.0.0/12 → 172.16.x – 172.31.x
  { prefix: '172.',       mask: (ip: string) => {
      const second = parseInt(ip.split('.')[1], 10)
      return second >= 16 && second <= 31
    }
  },
  // IPv6 loopback
  { prefix: '::1',        mask: null },
]

function isPrivateIp(ip: string): boolean {
  // Normalise IPv6-mapped IPv4 (e.g. ::ffff:127.0.0.1 → 127.0.0.1)
  const normalised = ip.replace(/^::ffff:/, '')

  for (const range of PRIVATE_IP_RANGES) {
    if (normalised.startsWith(range.prefix)) {
      if (range.mask === null) return true
      if (range.mask(normalised)) return true
    }
  }
  return false
}

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
  code?: string
}
export async function checkUrl(url: string): Promise<UrlCheckResult> {
  // Check for blocked domains
  for (const domain of BLOCKED_DOMAINS) {
    if (url.toLowerCase().includes(domain)) {
      return {
        safe: false,
        reason: `URL contains blocked domain: ${domain}`,
        code: 'DOMAIN_NOT_ALLOWED',
      }
    }
  }
  // Check for blocked extensions
  for (const ext of BLOCKED_EXTENSIONS) {
    if (url.toLowerCase().endsWith(ext)) {
      return {
        safe: false,
        reason: `URL links to a blocked file type: ${ext}`,
        code: 'URL_NOT_ALLOWED',
      }
    }
  }

  // ── SSRF guard: resolve hostname and reject private IPs ──
  let hostname: string
  try {
    hostname = new URL(url).hostname
  } catch {
    return { safe: false, reason: 'Invalid URL', code: 'INVALID_URL' }
  }

  try {
    const { address } = await dns.lookup(hostname)
    if (isPrivateIp(address)) {
      return {
        safe: false,
        reason: 'URL resolves to a private or reserved IP address',
        code: 'SSRF_BLOCKED',
      }
    }
  } catch {
    return { safe: false, reason: 'Could not resolve URL hostname', code: 'DNS_FAILURE' }
  }

  // Verify URL is reachable (HEAD request, 5 second timeout)
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    const res = await fetch(url, { method: 'HEAD', signal: controller.signal })
    clearTimeout(timeout)
    if (res.status === 401 || res.status === 403) {
      return { safe: false, reason: 'URL requires login or is access-restricted', code: 'URL_UNREACHABLE' }
    }

    if (!res.ok) {
      return { safe: false, reason: 'URL is not reachable', code: 'URL_UNREACHABLE' }
    }
  } catch {
    return { safe: false, reason: 'URL is not reachable', code: 'URL_UNREACHABLE' }
  }
  return { safe: true }
}
