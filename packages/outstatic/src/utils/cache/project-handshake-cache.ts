/**
 * In-memory cache for project handshake results
 * Caches projectId by API key to avoid repeated handshake calls
 * 
 * This cache persists across requests with a TTL to reduce API calls.
 * Combined with React's cache() for request-level memoization.
 */

interface CacheEntry {
  projectId: string
  expiresAt: number
}

// In-memory cache: Map<apiKey, CacheEntry>
const cache = new Map<string, CacheEntry>()

// Default TTL: 1 hour (3600 seconds)
const DEFAULT_TTL_MS = 60 * 60 * 1000

/**
 * Get cached projectId for an API key
 * @param apiKey - The API key to look up
 * @returns Cached projectId or undefined if not found or expired
 */
export function getCachedProjectId(apiKey: string): string | undefined {
  const entry = cache.get(apiKey)

  if (!entry) {
    return undefined
  }

  // Check if entry has expired
  if (Date.now() > entry.expiresAt) {
    cache.delete(apiKey)
    return undefined
  }

  return entry.projectId
}

/**
 * Cache a projectId for an API key
 * @param apiKey - The API key to cache for
 * @param projectId - The projectId to cache
 * @param ttlMs - Time to live in milliseconds (default: 1 hour)
 */
export function setCachedProjectId(
  apiKey: string,
  projectId: string,
  ttlMs: number = DEFAULT_TTL_MS
): void {
  cache.set(apiKey, {
    projectId,
    expiresAt: Date.now() + ttlMs
  })
}

/**
 * Clear cached projectId for an API key
 * @param apiKey - The API key to clear cache for
 */
export function clearCachedProjectId(apiKey: string): void {
  cache.delete(apiKey)
}

/**
 * Clear all cached projectIds
 */
export function clearAllCachedProjectIds(): void {
  cache.clear()
}

/**
 * Clean up expired entries from the cache
 * This can be called periodically to prevent memory leaks
 */
export function cleanupExpiredEntries(): void {
  const now = Date.now()
  for (const [key, entry] of cache.entries()) {
    if (now > entry.expiresAt) {
      cache.delete(key)
    }
  }
}

