import type Author from './author'

export type Document = {
  slug: string
  title: string
  publishedAt: string
  coverImage: string
  author: Author
  description: string
  ogImage: {
    url: string
  }
  content: string
}
