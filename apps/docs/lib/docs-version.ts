import type { StructuredData } from 'fumadocs-core/mdx-plugins'
import type { source } from '@/lib/source'

export type DocVersion = 'latest' | 'v1.4'

export function getPageVersionTag(page: {
  path: string
  slugs: string[]
}): DocVersion {
  if (page.path.startsWith('v1.4/') || page.slugs[0] === 'v1.4') {
    return 'v1.4'
  }

  return 'latest'
}

export function getVersionFromPathname(pathname: string): DocVersion {
  const normalized = pathname.replace(/^\//, '')

  if (normalized === 'v1.4' || normalized.startsWith('v1.4/')) {
    return 'v1.4'
  }

  return 'latest'
}

async function resolveStructuredData(
  page: (typeof source)['$inferPage']
): Promise<StructuredData> {
  const { structuredData } = page.data as {
    structuredData?: (() => Promise<StructuredData>) | StructuredData
  }

  if (!structuredData) {
    throw new Error(`Cannot find structured data from page: ${page.path}`)
  }

  return typeof structuredData === 'function'
    ? structuredData()
    : structuredData
}

export async function buildVersionedSearchIndex(
  page: (typeof source)['$inferPage']
) {
  const structuredData = await resolveStructuredData(page)

  return {
    title: page.data.title,
    description: page.data.description,
    url: page.url,
    id: page.url,
    structuredData,
    tag: getPageVersionTag(page)
  }
}
