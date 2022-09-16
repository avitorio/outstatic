import fs from 'fs'
import { join } from 'path'
import matter from 'gray-matter'

const CONTENT_PATH = join(
  process.cwd(),
  process.env.OST_CONTENT_PATH || 'outstatic/content'
)

export function getContentSlugs(contentType: string) {
  const contentTypesPath = join(CONTENT_PATH, contentType)
  return fs.readdirSync(contentTypesPath)
}

export function getContentBySlug(
  contentType: string,
  slug: string,
  fields: string[] = []
) {
  const realSlug = slug.replace(/\.mdx?$/, '')
  const contentTypesPath = join(CONTENT_PATH, contentType)
  const fullPath = join(contentTypesPath, `${realSlug}.md`)
  const fileContents = fs.readFileSync(fullPath, 'utf8')
  const { data, content } = matter(fileContents)

  type Items = {
    [key: string]: string
  }

  const items: Items = {}

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

export function getContentType(contentType: string, fields: string[] = []) {
  const slugs = getContentSlugs(contentType)
  const posts = slugs
    .map((slug) => getContentBySlug(contentType, slug, fields))
    // sort posts by date in descending order
    .sort((post1, post2) => (post1.publishedAt > post2.publishedAt ? -1 : 1))
  return posts
}

export const getContentPaths = (contentType: string) => {
  const contentFilePaths = fs
    .readdirSync(CONTENT_PATH + '/' + contentType)
    // Only include md(x) files
    .filter((path) => /\.mdx?$/.test(path))

  const paths = contentFilePaths
    // Remove file extensions for page paths
    .map((path) => path.replace(/\.mdx?$/, ''))
    // Map the path into the static paths object required by Next.js
    .map((slug: string) => ({ params: { slug } }))

  return paths
}

export const getContentTypes = () => {
  const contentTypes = fs.readdirSync(CONTENT_PATH)

  return contentTypes
}
