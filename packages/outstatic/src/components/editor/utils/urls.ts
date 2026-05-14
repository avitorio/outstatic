export function isValidUrl(url: string) {
  try {
    // Check if the URL is absolute
    new URL(url)
    return true
  } catch (_e) {
    // If not, check if it's a valid relative path
    return url.startsWith('/')
  }
}

export function getUrlFromString(str: string) {
  if (isValidUrl(str)) return str
  try {
    if (str.includes('.') && !str.includes(' ')) {
      return new URL(`https://${str}`).toString()
    }
  } catch (_e) {
    return null
  }
}
