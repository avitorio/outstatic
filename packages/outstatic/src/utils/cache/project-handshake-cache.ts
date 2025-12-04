/**
 * Multi-layer cache for project handshake results in serverless environments
 *
 * Three-layer caching strategy:
 * 1. React cache() - Request-level deduplication
 * 2. In-memory Map - Fast access for warm containers
 * 3. Next.js unstable_cache - Persistent cache across cold starts
 *
 * Cache flow:
 * 1. React cache() automatically dedupes same-request calls
 * 2. Check in-memory Map for valid entry
 * 3. If miss, call unstable_cache wrapped fetcher
 * 4. On successful fetch, populate in-memory cache
 * 5. Return result
 */

import { cache } from 'react'
import { unstable_cache, revalidateTag } from 'next/cache'

export type ProjectInfo = {
  projectId: string
  projectSlug: string
  accountSlug: string
  repoOwner: string
  repoSlug: string
}

export type HandshakeFetcher = (apiKey: string) => Promise<ProjectInfo | null>

interface CacheEntry {
  projectInfo: ProjectInfo
  expiresAt: number
}

// Configuration
const CONFIG = {
  IN_MEMORY_TTL_MS: 30 * 60 * 1000,      // 30 minutes
  NEXT_CACHE_TTL_SECONDS: 30 * 60,           // 30 minutes
  CACHE_TAG: 'project-handshake',
  CACHE_KEY_PREFIX: 'project-handshake',
} as const

// Layer 2: In-memory cache (warm containers)
const inMemoryCache = new Map<string, CacheEntry>()

/**
 * Get project info from in-memory cache
 */
function getFromMemory(apiKey: string): ProjectInfo | undefined {
  const entry = inMemoryCache.get(apiKey)

  if (!entry) {
    return undefined
  }

  // Check if entry has expired
  if (Date.now() > entry.expiresAt) {
    inMemoryCache.delete(apiKey)
    return undefined
  }

  return entry.projectInfo
}

/**
 * Store project info in in-memory cache
 */
function setInMemory(
  apiKey: string,
  projectInfo: ProjectInfo,
  ttlMs: number = CONFIG.IN_MEMORY_TTL_MS
): void {
  inMemoryCache.set(apiKey, {
    projectInfo,
    expiresAt: Date.now() + ttlMs
  })
}

/**
 * Factory function - creates a cached version of any handshake fetcher
 *
 * Implements three-layer caching:
 * 1. React cache() for request-level deduplication
 * 2. In-memory Map for warm containers
 * 3. unstable_cache for cold starts
 *
 * @example
 * ```typescript
 * async function fetchProjectFromAPI(apiKey: string): Promise<ProjectInfo | null> {
 *   const res = await fetch(`${process.env.API_URL}/handshake`, {
 *     headers: { Authorization: `Bearer ${apiKey}` },
 *     cache: 'no-store',
 *   })
 *   if (!res.ok) return null
 *   return res.json()
 * }
 *
 * export const getProjectInfo = createCachedHandshake(fetchProjectFromAPI)
 * ```
 */
export function createCachedHandshake(
  fetcher: HandshakeFetcher
): (apiKey: string) => Promise<ProjectInfo | null> {
  // Layer 3: Create persistent cache wrapper using unstable_cache
  // This is created once at module load time
  const persistentFetcher = unstable_cache(
    async (apiKey: string) => {
      try {
        const result = await fetcher(apiKey)
        return result
      } catch (error) {
        console.error('[project-handshake-cache] Error fetching from API:', error)
        return null
      }
    },
    process.env.NODE_ENV === "development"
      ? [`${CONFIG.CACHE_KEY_PREFIX}-${Date.now()}`] // always miss
      : [CONFIG.CACHE_KEY_PREFIX], // Cache key prefix
    {
      revalidate: CONFIG.NEXT_CACHE_TTL_SECONDS,
      tags: [CONFIG.CACHE_TAG],
    }
  )

  // Layer 2 + 3: Combined fetcher that checks memory first
  const memoryAndPersistentFetcher = async (apiKey: string): Promise<ProjectInfo | null> => {
    // Check in-memory cache first (Layer 2)
    const memoryResult = getFromMemory(apiKey)
    if (memoryResult) {
      return memoryResult
    }

    // If not in memory, check persistent cache (Layer 3)
    // This may fetch from API if not in persistent cache
    const result = await persistentFetcher(apiKey)

    // Populate in-memory cache if we got a valid result
    if (result) {
      setInMemory(apiKey, result)
    }

    return result
  }

  // Layer 1: Wrap in React cache() for request-level deduplication
  // This ensures multiple calls within the same request are deduped
  return cache(memoryAndPersistentFetcher)
}

/**
 * Invalidate project cache for a specific API key
 *
 * Note: This only clears the in-memory cache. The Next.js persistent cache
 * will expire naturally based on TTL. To force immediate revalidation of
 * persistent cache, use invalidateAllProjectCache() instead.
 */
export function invalidateProjectCache(apiKey: string): void {
  inMemoryCache.delete(apiKey)
}

/**
 * Invalidate all project cache (in-memory + Next.js persistent cache)
 *
 * This clears the in-memory cache and triggers revalidation of all
 * Next.js cached entries tagged with 'project-handshake'.
 */
export async function invalidateAllProjectCache(): Promise<void> {
  // Clear in-memory cache
  inMemoryCache.clear()

  // Revalidate Next.js persistent cache
  try {
    revalidateTag(CONFIG.CACHE_TAG)
  } catch (error) {
    console.error('[project-handshake-cache] Error revalidating cache:', error)
  }
}

/**
 * Clean up expired entries from the in-memory cache
 *
 * Call this periodically to prevent memory leaks in long-running processes.
 * This is less critical in serverless environments where containers are
 * frequently recycled, but useful for traditional Node.js servers.
 */
export function cleanupExpiredEntries(): void {
  const now = Date.now()
  for (const [key, entry] of inMemoryCache.entries()) {
    if (now > entry.expiresAt) {
      inMemoryCache.delete(key)
    }
  }
}

/**
 * Get cache statistics for debugging
 *
 * Returns the current size of the in-memory cache and all cached keys.
 * Note: This only reflects the in-memory layer, not the persistent cache.
 */
export function getCacheStats(): { inMemorySize: number; inMemoryKeys: string[] } {
  return {
    inMemorySize: inMemoryCache.size,
    inMemoryKeys: Array.from(inMemoryCache.keys())
  }
}
