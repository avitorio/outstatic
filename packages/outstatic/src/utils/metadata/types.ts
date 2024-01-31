import { OstDocument } from '@/types/public'

export type MetadataSchema<
  T extends { [key: string]: unknown } = { [key: string]: unknown }
> = {
  commit: string
  generated: string
  metadata: Omit<OutstaticSchema<T>, 'content'>[]
}

export type Projection = Record<string, number> | string[]

export type OutstaticSchema<
  TSchema extends { [key: string]: unknown } = { [key: string]: unknown }
> = TSchema &
  OstDocument & {
    __outstatic: {
      hash: string
      path: string
      commit: string
    }
  }

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
