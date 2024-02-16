import type Author from './author'

export type Document = {
  content: string
  collection: string
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
  __outstatic: any
}
