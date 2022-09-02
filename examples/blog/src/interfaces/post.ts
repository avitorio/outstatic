import type Author from './author'

type PostType = {
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

export default PostType
