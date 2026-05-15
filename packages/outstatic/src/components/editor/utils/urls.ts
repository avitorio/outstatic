const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:']

/** Absolute path (href): must start with / and contain no raw whitespace or C0 controls. */
function isValidAbsolutePathHref(path: string) {
  if (!path.startsWith('/')) return false
  // Reject values that are not usable as literal href attributes without encoding
  return !/[\s\u0000-\u001f\u007f]/u.test(path)
}

export function isValidUrl(url: string) {
  try {
    // Only allow safe, known protocols
    const parsedUrl = new URL(url)
    return ALLOWED_PROTOCOLS.includes(parsedUrl.protocol)
  } catch (_e) {
    // If not, check if it's a valid relative path
    return isValidAbsolutePathHref(url)
  }
}

/** Host-only localhost (optional port) for dev links; no dot, so it skips the domain heuristic. */
const LOCALHOST_HOST_PATTERN = /^localhost(?::\d+)?$/i

export function getUrlFromString(str: string): string | null {
  if (isValidUrl(str)) return str
  try {
    if (LOCALHOST_HOST_PATTERN.test(str)) {
      return new URL(`http://${str}`).toString()
    }
    if (str.includes('.') && !str.includes(' ')) {
      return new URL(`https://${str}`).toString()
    }
  } catch (_e) {
    return null
  }
  return null
}
