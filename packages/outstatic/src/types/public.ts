export type OstDocument<TSchema = { [key: string]: unknown }> = TSchema & {
  content: string
  collection: string
  slug: string
  title: string
  status: string
  publishedAt: string
  author?: {
    name?: string
    picture?: string
  }
}

export type OutstaticSchema<
  TSchema extends { [key: string]: unknown } = { [key: string]: unknown }
> = OstDocument<
  TSchema & {
    __outstatic: {
      hash: string
      path: string
      commit: string
    }
  }
>
