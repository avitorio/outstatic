import type Content from '../interfaces/post'
import Link from 'next/link'
import DateFormatter from './date-formatter'
import Image from 'next/image'

type Props = {
  contentType: 'posts' | 'projects'
  title?: string
  posts: Content[]
}

const ContentGrid = ({ title = 'More', posts, contentType }: Props) => {
  return (
    <section>
      <h2 className="mb-8 text-5xl md:text-6xl font-bold tracking-tighter leading-tight">
        {title}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 sm:gap-x-6 lg:gap-x-8 gap-y-5 sm:gap-y-6 lg:gap-y-8 mb-8">
        {posts.map((post) => (
          <div className="border">
            <div className="sm:mx-0 relative">
              <Link
                as={`/${contentType}/${post.slug}`}
                href={`/${contentType}/[slug]`}
              >
                <a aria-label={post.title}>
                  <Image
                    src={post.coverImage}
                    alt={`Cover Image for ${post.title}`}
                    width={350}
                    height={post.description ? 180 : 350}
                    layout="responsive"
                    objectFit="cover"
                  />
                  {contentType === 'projects' && (
                    <h4 className="p-2 bg-opacity-80 bg-white text-center whitespace-nowrap font-bold text-3xl absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2">
                      {post.title}
                    </h4>
                  )}
                </a>
              </Link>
            </div>
            {contentType === 'posts' && (
              <div className="p-4">
                <h3 className="text-xl mb-2 leading-snug font-bold">
                  <Link as={`/posts/${post.slug}`} href="/posts/[slug]">
                    <a className="hover:underline">{post.title}</a>
                  </Link>
                </h3>
                <div className="text-md mb-4 text-slate-700">
                  <DateFormatter dateString={post.publishedAt} />
                </div>
                <p className="text-lg leading-relaxed mb-4">
                  {post.description}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

export default ContentGrid
