import { canonicalDocsUrl } from '@/lib/docs-metadata'
import { source } from '@/lib/source'

export default async function sitemap() {
  return source.getPages().map((page) => ({
    url: canonicalDocsUrl(page.url),
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7
  }))
}
