import fs from 'fs'
import { join } from 'path'
import matter from 'gray-matter'

const CONTENT_PATH = join(
  process.cwd(),
  process.env.OST_CONTENT_PATH || 'outstatic/content'
)

export function getDocumentSlugs(collection: string) {
  const collectionsPath = join(CONTENT_PATH, collection)
  return fs.readdirSync(collectionsPath)
}

export function getDocumentBySlug(
  collection: string,
  slug: string,
  fields: string[] = []
) {
  const realSlug = slug.replace(/\.mdx?$/, '')
  const collectionsPath = join(CONTENT_PATH, collection)
  const fullPath = join(collectionsPath, `${realSlug}.md`)
  const fileContents = fs.readFileSync(fullPath, 'utf8')
  const { data, content } = matter(fileContents)

  type Items = {
    [key: string]: string
  }

  const items: Items = {}

  if (data['status'] === 'draft') {
    return {}
  }

  // Ensure only the minimal needed data is exposed
  fields.forEach((field) => {
    if (field === 'slug') {
      items[field] = realSlug
    }
    if (field === 'content') {
      items[field] = content
    }

    if (typeof data[field] !== 'undefined') {
      items[field] = data[field]
    }
  })

  return items
}

export function getDocuments(collection: string, fields: string[] = []) {
  const slugs = getDocumentSlugs(collection)
  const posts = slugs
    .map((slug) =>
      getDocumentBySlug(collection, slug, [...fields, 'publishedAt', 'status'])
    )
    .filter((post) => post.status === 'published')
    // sort posts by date in descending order
    .sort((post1, post2) => (post1.publishedAt > post2.publishedAt ? -1 : 1))
  return posts
}

export const getDocumentPaths = (collection: string) => {
  const documentFilePaths = fs
    .readdirSync(CONTENT_PATH + '/' + collection)
    // Only include md(x) files
    .filter((path) => /\.mdx?$/.test(path))

  const publishedPaths = documentFilePaths.filter((path) => {
    const collectionsPath = join(CONTENT_PATH, collection)
    const fullPath = join(collectionsPath, `${path}`)
    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const { data } = matter(fileContents)
    return data['status'] === 'published'
  })

  const paths = publishedPaths
    // Remove file extensions for page paths
    .map((path) => path.replace(/\.mdx?$/, ''))
    // Map the path into the static paths object required by Next.js
    .map((slug: string) => ({ params: { slug } }))

  return paths
}

export const getCollections = () => {
  const collections = fs.readdirSync(CONTENT_PATH)
  return collections
}
