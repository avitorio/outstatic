import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { PostType } from '../types'

export const CONTENT_PATH = path.join(
  process.cwd(),
  process.env.OST_CONTENT_PATH || 'outstatic/content'
)

export function getContentType(contentType: string) {
  const contentTypesPath = path.join(CONTENT_PATH, contentType)
  // Get file names under /posts
  const fileNames = fs.readdirSync(contentTypesPath)

  const allPostsData: PostType[] = []

  fileNames.forEach((fileName) => {
    // Remove ".md" from file name to get id
    const slug = fileName.replace(/\.md$/, '')

    // Read markdown file as string
    const fullPath = path.join(contentTypesPath, fileName)
    const fileContents = fs.readFileSync(fullPath, 'utf8')

    // Use gray-matter to parse the post metadata section
    const { data, content } = matter(fileContents)

    if (data.status === 'published') {
      // Combine the data with the slug
      allPostsData.push({
        slug,
        publishedAt: data?.publishedAt || '2020-01-01',
        title: data?.title || 'No title',
        status: data?.status || 'draft',
        content,
        ...data
      })
    }
  })

  // Sort posts by publishedAt
  return allPostsData.sort(({ publishedAt: a }, { publishedAt: b }) => {
    if (a < b) {
      return 1
    } else if (a > b) {
      return -1
    } else {
      return 0
    }
  })
}

export async function getContent(
  contentType: string,
  slug: string
): Promise<PostType | {}> {
  // Get file names under /posts
  const postFilePath = path.join(CONTENT_PATH + '/' + contentType, `${slug}.md`)
  const fileContents = fs.readFileSync(postFilePath, 'utf8')
  // Use gray-matter to parse the post metadata section
  const { data, content } = matter(fileContents)

  if (data.status === 'published') {
    // Combine the data with the slug
    return {
      slug,
      publishedAt: data?.publishedAt || '2020-01-01',
      title: data?.title || 'No title',
      status: data?.status || 'draft',
      content,
      ...data
    }
  }

  return {}
}

export const getPaths = (contentType: string) => {
  const postFilePaths = fs
    .readdirSync(CONTENT_PATH + '/' + contentType)
    // Only include md(x) files
    .filter((path) => /\.mdx?$/.test(path))

  const paths = postFilePaths
    // Remove file extensions for page paths
    .map((path) => path.replace(/\.mdx?$/, ''))
    // Map the path into the static paths object required by Next.js
    .map((slug: string) => ({ params: { slug } }))

  return paths
}
