import { OutstaticSchema } from '@/types/public'

export type { OutstaticSchema } from '@/types/public'

export type MetadataType<
  T extends { [key: string]: unknown } = { [key: string]: unknown }
> = Omit<OutstaticSchema<T>, 'content'>[]

export type MetadataSchema = {
  commit: string
  generated: string
  metadata: MetadataType
}

export type Projection = Record<string, number> | string[]

type SortDeclaration = {
  [key: string]: number
}

export type FindAPI<T, P> = {
  /**
   * Sort the results using the following options for `sort`
   *   * As an array of strings - sorted using ascending sort
   *   * As an object in key-order - {publishedAt: 1, slug: -1} using `1` for ascending and `-1` for descending
   *   * An array containing a mix of the above values
   */
  sort: (
    sort: SortDeclaration | (keyof T)[] | SortDeclaration | keyof T
  ) => FindAPI<T, P>
  /** Limit the fields returned before running the find operation */
  project: (projection: Projection) => FindAPI<T, P>
  /** Skip the specified number of entries from the result */
  skip: (skip: number) => FindAPI<T, P>
  /** Limit the find results to the specified number of results */
  limit: (limit: number) => FindAPI<T, P>
  /** Take the first result from the query, disregarding others. Populates additional data from the filesystem */
  first: () => Promise<P>
  /** Return the results as an array, populating additional data from the filesystem as needed */
  toArray: () => Promise<P[]>
}

export type MediaItem = {
  __outstatic: {
    hash: string
    path: string
    commit: string
  }
  filename: string
  alt: string
  publishedAt: string
  type: string
  source?: string
}

export type MediaSchema = {
  commit: string
  generated: string
  media: MediaItem[]
}

export type MDExtensions = 'md' | 'mdx'

export const mediaCategories = [
  'image',
  'document',
  'video',
  'audio',
  'compressed',
  'code',
  'font',
  'spreadsheet'
] as const

export type MediaCategory = (typeof mediaCategories)[number]

export type MediaSourceConfig = {
  name: string
  label: string
  input: string
  output: string
  extensions?: readonly string[]
  categories?: readonly MediaCategory[]
  commit?: Record<string, unknown>
  actions?: unknown
  [key: string]: unknown
}

export type ConfigType = {
  publicMediaPath?: string
  repoMediaPath?: string
  media?: MediaSourceConfig[]
  mdExtension?: MDExtensions
  [key: string]: unknown
}
