/**
 * In-memory cache for project handshake results
 * Caches project information by API key to avoid repeated handshake calls
 * 
 * This cache persists across requests with a TTL to reduce API calls.
 * Combined with React's cache() for request-level memoization.
 */

export type ProjectInfo = {
  projectId: string
  projectSlug: string
  accountSlug: string
}

interface CacheEntry {
  projectInfo: ProjectInfo
  expiresAt: number
}

// In-memory cache: Map<apiKey, CacheEntry>
const cache = new Map<string, CacheEntry>()

// Default TTL: 1 hour (3600 seconds)
const DEFAULT_TTL_MS = 60 * 60 * 1000

/**
 * Get cached project info for an API key
 * @param apiKey - The API key to look up
 * @returns Cached project info or undefined if not found or expired
 */
export function getCachedProjectInfo(apiKey: string): ProjectInfo | undefined {
  const entry = cache.get(apiKey)

  if (!entry) {
    return undefined
  }

  // Check if entry has expired
  if (Date.now() > entry.expiresAt) {
    cache.delete(apiKey)
    return undefined
  }

  return entry.projectInfo
}

/**
 * Cache project info for an API key
 * @param apiKey - The API key to cache for
 * @param projectInfo - The project info to cache
 * @param ttlMs - Time to live in milliseconds (default: 1 hour)
 */
export function setCachedProjectInfo(
  apiKey: string,
  projectInfo: ProjectInfo,
  ttlMs: number = DEFAULT_TTL_MS
): void {
  cache.set(apiKey, {
    projectInfo,
    expiresAt: Date.now() + ttlMs
  })
}

/**
 * Clear cached project info for an API key
 * @param apiKey - The API key to clear cache for
 */
export function clearCachedProjectInfo(apiKey: string): void {
  cache.delete(apiKey)
}

/**
 * Clear all cached project info
 */
export function clearAllCachedProjectInfo(): void {
  cache.clear()
}

/**
 * @deprecated Use getCachedProjectInfo instead
 * Get cached projectId for an API key (for backwards compatibility)
 */
export function getCachedProjectId(apiKey: string): string | undefined {
  const projectInfo = getCachedProjectInfo(apiKey)
  return projectInfo?.projectId
}

/**
 * @deprecated Use setCachedProjectInfo instead
 * Cache a projectId for an API key (for backwards compatibility)
 */
export function setCachedProjectId(
  apiKey: string,
  projectId: string,
  ttlMs: number = DEFAULT_TTL_MS
): void {
  // This is a legacy function, so we'll create a minimal ProjectInfo
  // Note: projectSlug and accountSlug will be empty strings
  setCachedProjectInfo(
    apiKey,
    {
      projectId,
      projectSlug: '',
      accountSlug: '',
    },
    ttlMs
  )
}

/**
 * @deprecated Use clearCachedProjectInfo instead
 * Clear cached projectId for an API key (for backwards compatibility)
 */
export function clearCachedProjectId(apiKey: string): void {
  clearCachedProjectInfo(apiKey)
}

/**
 * @deprecated Use clearAllCachedProjectInfo instead
 * Clear all cached projectIds (for backwards compatibility)
 */
export function clearAllCachedProjectIds(): void {
  clearAllCachedProjectInfo()
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

