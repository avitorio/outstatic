import { MetadataRoute } from 'next'
import { getDocuments } from 'outstatic/server'

const SITE_URL = 'https://outstatic.com'

function getCollectionEntries(
  collection: string,
  pathPrefix: string
): MetadataRoute.Sitemap {
  return getDocuments(collection, ['slug', 'publishedAt']).map((doc) => ({
    url: `${SITE_URL}/docs${pathPrefix}/${doc.slug}`,
    lastModified: new Date(doc.publishedAt)
  }))
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...getCollectionEntries('docs', ''),
    ...getCollectionEntries('v1.4', '/v1.4')
  ]
}
