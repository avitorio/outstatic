// app/sitemap.ts
import { source } from '@/lib/source'

export default async function sitemap() {
  const baseUrl = 'https://outstatic.com/docs'
  const docsUrls = source
    // Optional: leverage the noIndex property we previously added.
    // .filter(page => page.data.noIndex !== true)
    .getPages().map(page => ({
      url: `${baseUrl}${page.url}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

  return [...docsUrls]
}