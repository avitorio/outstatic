export type OstDocument<
  TSchema extends { [key: string]: unknown } = { [key: string]: unknown }
> = TSchema & {
  content: string
  collection: string
  slug: string
  title: string
  status: string
  description?: string
  coverImage?: string
  publishedAt: string
  author?: {
    name?: string
    picture?: string
  }
}
