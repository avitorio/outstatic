export type OstDocument = {
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
