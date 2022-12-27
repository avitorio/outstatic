import 'mingo/init/system'

import fs from 'fs'
import { readFile } from 'fs/promises'
import { join, resolve } from 'path'
import matter from 'gray-matter'
import sift, { Query } from 'sift'
import { firstBy } from 'thenby'

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
) {
  try {
    const realSlug = slug.replace(MD_MDX_REGEXP, '')
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
  } catch (error) {
    console.error({ getDocumentBySlug: error })
    return {}
  }
}

export function getDocuments(collection: string, fields: string[] = []) {
  const slugs = getDocumentSlugs(collection)
  const documents = slugs
    .map((slug) =>
      getDocumentBySlug(collection, slug, [...fields, 'publishedAt', 'status'])
    )
    .filter((document) => document.status === 'published')
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
      .filter((f) => !/\.json$/.test(f))
    return collections
  } catch (error) {
    console.error({ getCollections: error })
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

type SortFunction = (a: unknown, b: unknown) => number
type Projection = Record<string, number> | string[]
type OutstaticSchema<TSchema extends {} = {}> = TSchema & {
  content: string
  category: string
  slug: string
  title: string
  status: string
  __outstatic: {
    hash: string
    path: string
  }
}
type QueryAPI<T> = {
  sort: (sort: Record<string, number> | string[]) => QueryAPI<T>
  project: (projection: Projection) => QueryAPI<T>
  skip: (skip: number) => QueryAPI<T>
  limit: (limit: number) => QueryAPI<T>
  toArray: () => Promise<T[]>
}

export const load = async <TSchema extends {} = {}>() => {
  const m = await readFile(resolve(CONTENT_PATH, './metadata.json'))
  const metadata = JSON.parse(m.toString())
  const mdb: unknown[] = metadata?.metadata ?? []

  return {
    find: (query: Query<OutstaticSchema<TSchema>>, projection?: Projection) => {
      const subset = mdb.filter(sift<OutstaticSchema<TSchema>>(query))
      let prj = projection ?? []
      let skp = 0
      let lmt: undefined | number = undefined
      const api: QueryAPI<OutstaticSchema<TSchema>> = {
        sort: (sort) => {
          if (Array.isArray(sort)) {
            let fn = firstBy(sort.shift() ?? '\x00')
            for (const s of sort) {
              fn = fn.thenBy(s)
            }
            subset.sort(fn as SortFunction)
          } else {
            const entries = Object.entries(sort)
            const first = entries.shift()
            if (first) {
              let fn = firstBy(first[0], {
                direction: first[1] >= 0 ? 'asc' : 'desc'
              })
              for (const [s, dir] of entries) {
                fn = fn.thenBy(s, { direction: dir >= 0 ? 'asc' : 'desc' })
              }
              subset.sort(fn as SortFunction)
            }
          }
          return api
        },
        project: (projection) => {
          prj = projection
          return api
        },
        skip: (skip) => {
          skp = skip
          return api
        },
        limit: (limit) => {
          lmt = limit
          return api
        },
        toArray: async () => {
          // narrow down to smallest result set
          const copied = (
            JSON.parse(JSON.stringify(subset)) as OutstaticSchema<TSchema>[]
          ).slice(skp, lmt)

          const finalProjection = Array.isArray(prj) ? prj : Object.keys(prj)

          // check projections and load content
          const projected = await Promise.all(
            copied.map((m) => {
              if (
                finalProjection.length === 0 ||
                finalProjection.includes('content')
              ) {
                // TODO get content
              }

              // TODO unany
              const result: any = {}
              for (const p of finalProjection) {
                if (typeof m[p as keyof typeof m] !== 'undefined') {
                  result[p] = m[p as keyof typeof m]
                }
              }
              return result as OutstaticSchema<TSchema>
            })
          )

          return projected
        }
      }
      return api
    }
  }
}
