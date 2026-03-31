import fs from 'fs'
import matter from 'gray-matter'
import { join } from 'path'
import { OutstaticSchema } from './metadata/types'

// metadata db features
export { load } from './metadata/load'

const CONTENT_PATH = join(
  process.cwd(),
  process.env.OST_CONTENT_PATH || 'outstatic/content'
)

const MD_MDX_REGEXP = /\.mdx?$/i

export function getDocumentSlugs(collection: string) {
  const collectionsPath = join(CONTENT_PATH, collection)
  const mdMdxFiles = readMdMdxFiles(collectionsPath)
  const slugs = mdMdxFiles.map((file) => file.replace(MD_MDX_REGEXP, ''))
  return slugs
}

export function getDocumentBySlug(
  collection: string,
  slug: string,
  fields: string[] = []
): OutstaticSchema | null {
  try {
    const realSlug = slug.replace(MD_MDX_REGEXP, '')
    const collectionsPath = join(CONTENT_PATH, collection)
    const mdPath = join(collectionsPath, `${realSlug}.md`)
    const mdxPath = join(collectionsPath, `${realSlug}.mdx`)

    let fullPath: string

    // Check which file exists
    if (fs.existsSync(mdPath)) {
      fullPath = mdPath
    } else if (fs.existsSync(mdxPath)) {
      fullPath = mdxPath
    } else {
      return null
    }

    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const { data, content } = matter(fileContents)

    type Items = {
      [key: string]: string
    }

    const items: Items = {}

    if (data['status'] === 'draft') {
      return null
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

    return items as OutstaticSchema
  } catch (error) {
    console.error({ getDocumentBySlug: error })
    return null
  }
}

export function getDocuments(collection: string, fields: string[] = []) {
  const slugs = getDocumentSlugs(collection)
  const documents = slugs
    .map(
      (slug) =>
        getDocumentBySlug(collection, slug, [
          ...fields,
          'publishedAt',
          'status'
        ])!
    )
    .filter((document) => document !== null && document.status === 'published')
    // sort documents by date in descending order
    .sort((document1, document2) =>
      document1.publishedAt > document2.publishedAt ? -1 : 1
    )
  return documents
}

export const getDocumentPaths = (collection: string) => {
  try {
    const documentFilePaths = fs
      .readdirSync(CONTENT_PATH + '/' + collection)
      // Only include md(x) files
      .filter((path) => MD_MDX_REGEXP.test(path))

    const publishedPaths = documentFilePaths.filter((path) => {
      const collectionsPath = join(CONTENT_PATH, collection)
      const fullPath = join(collectionsPath, `${path}`)
      const fileContents = fs.readFileSync(fullPath, 'utf8')
      const { data } = matter(fileContents)
      return data['status'] === 'published'
    })

    const paths = publishedPaths
      // Remove file extensions for page paths
      .map((path) => path.replace(MD_MDX_REGEXP, ''))
      // Map the path into the static paths object required by Next.js
      .map((slug: string) => ({ params: { slug } }))

    return paths
  } catch (error) {
    console.error({ getDocumentPaths: error })
    return []
  }
}

export const getCollections = () => {
  try {
    const collections = fs
      .readdirSync(CONTENT_PATH)
      .filter((f) => !/\.json$/.test(f) && f !== '_singletons')
    return collections
  } catch (error) {
    console.error({ getCollections: error })
    return []
  }
}

const SINGLETONS_PATH = join(CONTENT_PATH, '_singletons')

export function getSingletonBySlug(
  slug: string,
  fields: string[] = []
): OutstaticSchema | null {
  try {
    const realSlug = slug.replace(MD_MDX_REGEXP, '')
    const mdPath = join(SINGLETONS_PATH, `${realSlug}.md`)
    const mdxPath = join(SINGLETONS_PATH, `${realSlug}.mdx`)

    let fullPath: string

    // Check which file exists
    if (fs.existsSync(mdPath)) {
      fullPath = mdPath
    } else if (fs.existsSync(mdxPath)) {
      fullPath = mdxPath
    } else {
      return null
    }

    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const { data, content } = matter(fileContents)

    type Items = {
      [key: string]: string
    }

    const items: Items = {}

    // Singletons don't have draft status check - they're always available
    // But we still respect the status field if present
    if (data['status'] === 'draft') {
      return null
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

    return items as OutstaticSchema
  } catch (error) {
    console.error({ getSingletonBySlug: error })
    return null
  }
}

export function getSingletonSlugs(): string[] {
  try {
    if (!fs.existsSync(SINGLETONS_PATH)) {
      return []
    }
    const mdMdxFiles = readMdMdxFiles(SINGLETONS_PATH)
    const slugs = mdMdxFiles.map((file) => file.replace(MD_MDX_REGEXP, ''))
    return slugs
  } catch (error) {
    console.error({ getSingletonSlugs: error })
    return []
  }
}

function readMdMdxFiles(path: string) {
  try {
    const dirents = fs.readdirSync(path, { withFileTypes: true })
    const mdMdxFiles = dirents
      .filter((dirent) => dirent.isFile() && MD_MDX_REGEXP.test(dirent.name))
      .map((dirent) => dirent.name)
    return mdMdxFiles
  } catch (error) {
    console.error({ readMdMdxFiles: error })
    return []
  }
}
