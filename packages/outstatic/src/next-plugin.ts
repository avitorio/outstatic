/**
 * Outstatic Next.js Plugin
 *
 * Generates TypeScript types from collection/singleton schemas automatically
 * during Next.js build. Works with both Webpack and Turbopack.
 *
 * Usage:
 * ```js
 * // next.config.js
 * const { withOutstatic } = require('outstatic/next-plugin')
 * module.exports = withOutstatic({ ... })
 * ```
 */

import type { NextConfig } from 'next'
import { generateTypesSync } from './typegen/generator'

export interface OutstaticPluginOptions {
  /** Path to the content directory (default: 'outstatic/content') */
  contentPath?: string
  /** Path to output generated types (default: '.outstatic/types') */
  outputPath?: string
  /** Disable type generation (default: false) */
  skipTypeGeneration?: boolean
}

/**
 * Wraps a Next.js config to automatically generate Outstatic types
 *
 * @param nextConfig - Your existing Next.js configuration
 * @param options - Outstatic plugin options
 * @returns Modified Next.js configuration
 *
 * @example
 * ```js
 * // next.config.js
 * const { withOutstatic } = require('outstatic/next-plugin')
 *
 * module.exports = withOutstatic({
 *   // your next.js config
 * })
 * ```
 *
 * @example
 * ```js
 * // With custom paths
 * module.exports = withOutstatic(
 *   { ... },
 *   {
 *     contentPath: 'content',
 *     outputPath: 'types/outstatic'
 *   }
 * )
 * ```
 */
export function withOutstatic(
  nextConfig: NextConfig = {},
  options: OutstaticPluginOptions = {}
): NextConfig {
  const { skipTypeGeneration = false, contentPath, outputPath } = options

  // Generate types synchronously during config evaluation
  // This happens before any bundler (Webpack or Turbopack) starts
  if (!skipTypeGeneration) {
    try {
      generateTypesSync({
        contentPath,
        outputPath
      })
    } catch (error) {
      // Don't fail the build if type generation fails
      // Just log a warning
      console.warn('[outstatic] Type generation failed:', error)
    }
  }

  return nextConfig
}

export default withOutstatic
