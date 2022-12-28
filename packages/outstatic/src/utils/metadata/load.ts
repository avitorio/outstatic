import { readFile } from 'fs/promises'
import { join, resolve } from 'path'
import matter from 'gray-matter'
import sift, { Query } from 'sift'
import { firstBy } from 'thenby'

const CONTENT_PATH = join(
  process.cwd(),
  process.env.OST_CONTENT_PATH || 'outstatic/content'
)

export type MetadataSchema<T extends {} = {}> = {
  hash: string
  generated: string
  metadata: Omit<OutstaticSchema<T>, 'content'>[]
}

type Projection = Record<string, number> | string[]

type OutstaticSchema<TSchema extends {} = {}> = TSchema & {
  content: string
  category: string
  slug: string
  title: string
  status: string
  description?: string
  coverImage?: string
  publishedAt: Date
  author?: {
    name?: string
    picture?: string
  }
  __outstatic: {
    hash: string
    path: string
  }
}

type SortDeclaration = {
  [key: string]: number
}

type QueryAPI<T, P> = {
  /**
   * Sort the results using the following options for `sort`
   *   * As an array of strings - sorted using ascending sort
   *   * As an object in key-order - {publishedAt: 1, slug: -1} using `1` for ascending and `-1` for descending
   *   * An array containing a mix of the above values
   */
  sort: (
    sort: SortDeclaration | (keyof T)[] | SortDeclaration | keyof T
  ) => QueryAPI<T, P>
  /** Limit the fields returned before running the find operation */
  project: (projection: Projection) => QueryAPI<T, P>
  /** Skip the specified number of entries from the result */
  skip: (skip: number) => QueryAPI<T, P>
  /** Limit the find results to the specified number of results */
  limit: (limit: number) => QueryAPI<T, P>
  /** Take the first result from the query, disregarding others. Populates additional data from the filesystem */
  first: () => Promise<P>
  /** Return the results as an array, populating additional data from the filesystem as needed */
  toArray: () => Promise<P[]>
}

export const load = async <TSchema extends {} = {}>() => {
  const m = await readFile(resolve(CONTENT_PATH, './metadata.json'))
  const metadata = JSON.parse(m.toString())
  const mdb: unknown[] = metadata?.metadata ?? []

  return {
    /**
     * Find a post matching a provided query, with options for sorting and limiting
     * @template <TProjection> The returned fields described by the optional Projection
     */
    find: <TProjection = OutstaticSchema<TSchema>>(
      query: Query<OutstaticSchema<TSchema>>,
      projection?: Projection
    ) => {
      const subset = mdb.filter(sift<OutstaticSchema<TSchema>>(query))
      let prj = projection ?? []
      let skp = 0
      let lmt: undefined | number = undefined
      const api: QueryAPI<OutstaticSchema<TSchema>, TProjection> = {
        sort: (sort) => {
          const applyKeys = (obj: Record<string, number>, tb: IThenBy<any>) => {
            let next = tb
            for (const [s, dir] of Object.entries(obj)) {
              next = next.thenBy(s, { direction: dir >= 0 ? 'asc' : 'desc' })
            }
            return next
          }
          const applyString = (s: string, tb: IThenBy<any>) => {
            return tb.thenBy(s)
          }

          if (typeof sort === 'number' || typeof sort === 'symbol') {
            throw new Error(
              'sort must be either an array of fields or an object containing field keys and sort directions'
            )
          }

          if (typeof sort === 'string') {
            subset.sort(firstBy<any>(sort, { direction: 'asc' }))
            return api
          }

          if (!Array.isArray(sort)) {
            let fn = firstBy<any>('\x00')
            fn = applyKeys(sort, fn)
            subset.sort(fn)
            return api
          }

          // array
          let fn: ReturnType<typeof firstBy<any>> | undefined
          for (const entry of sort) {
            if (!fn) {
              if (typeof entry === 'string') {
                fn = firstBy<any>(entry, { direction: 'asc' })
                continue
              } else {
                fn = firstBy<any>('\x00') // placeholder
              }
            }

            if (!fn) {
              throw new Error('Unreachable condition: !fn')
            }

            if (typeof entry === 'string') {
              fn = applyString(entry, fn)
            } else if (typeof entry === 'number' || typeof entry === 'symbol') {
              throw new Error(
                'sort must be either an array of fields or an object containing field keys and sort directions'
              )
            } else {
              fn = applyKeys(entry, fn)
            }
          }

          if (fn) {
            subset.sort(fn)
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

        first: async () => {
          const arr = await api.toArray()
          return arr?.[0]
        },

        toArray: async () => {
          // narrow down to smallest result set
          const copied = (
            JSON.parse(JSON.stringify(subset)) as OutstaticSchema<TSchema>[]
          ).slice(skp, lmt)

          const finalProjection = Array.isArray(prj) ? prj : Object.keys(prj)

          // check projections and load content
          const projected = await Promise.all(
            copied.map(async (m) => {
              if (
                finalProjection.length === 0 ||
                finalProjection.includes('content')
              ) {
                const buf = await readFile(
                  resolve(CONTENT_PATH, `./${m.__outstatic.path}`)
                )
                const { content } = matter(buf.toString())
                m.content = content
              }

              // start as any, cast to projection
              const result: any = {}
              for (const p of finalProjection) {
                if (typeof m[p as keyof typeof m] !== 'undefined') {
                  result[p] = m[p as keyof typeof m]
                }
              }
              return result as TProjection
            })
          )

          return projected
        }
      }
      return api
    }
  }
}
