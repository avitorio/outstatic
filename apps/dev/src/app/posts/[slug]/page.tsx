import Header from '@/components/Header'
import Layout from '@/components/Layout'
import markdownToHtml from '@/lib/markdownToHtml'
import { getDocumentSlugs, load } from 'outstatic/server'
import DateFormatter from '@/components/DateFormatter'
import Image from 'next/image'
import { OstDocument } from 'outstatic'

type Post = {
  tags: { value: string; label: string }[]
} & OstDocument

export default async function Post({ params }: { params: { slug: string } }) {
  const post = await getData(params)
  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-5">
        <Header />
        <article className="mb-32">
          <div className="relative mb-2 md:mb-4 sm:mx-0 w-full h-52 md:h-96">
            <Image
              alt={post.title}
              src={post?.coverImage || ''}
              fill
              className="object-cover object-center"
              priority
            />
          </div>
          {Array.isArray(post?.tags)
            ? post.tags.map(({ label }) => (
                <span
                  key="label"
                  className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2"
                >
                  {label}
                </span>
              ))
            : null}
          <h1 className="font-primary text-2xl font-bold md:text-4xl mb-2">
            {post.title}
          </h1>
          <div className="hidden md:block md:mb-12 text-slate-600">
            Written on <DateFormatter dateString={post.publishedAt} /> by{' '}
            {post?.author?.name || ''}.
          </div>
          <hr className="border-neutral-200 mt-10 mb-10" />
          <div className="max-w-2xl mx-auto">
            <div
              className="prose lg:prose-xl"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>
        </article>
      </div>
    </Layout>
  )
}

async function getData(params: { slug: string }) {
  const db = await load()

  const post = await db
    .find<Post>({ collection: 'posts', slug: params.slug }, [
      'title',
      'publishedAt',
      'slug',
      'author',
      'content',
      'coverImage',
      'tags'
    ])
    .first()

  const content = await markdownToHtml(post.content)

  return {
    ...post,
    content
  }
}

export async function generateStaticParams() {
  const posts = getDocumentSlugs('posts')
  return posts.map((slug) => ({ slug }))
}
