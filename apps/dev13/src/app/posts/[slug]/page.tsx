import ErrorPage from 'next/error'
import Header from '../../../components/Header'
import Layout from '../../../components/Layout'
import markdownToHtml from '../../../lib/markdownToHtml'
import { Document } from '../../../interfaces/document'
import { getDocumentPaths, load } from 'outstatic/server'
import DateFormatter from '../../../components/DateFormatter'
import Image from 'next/image'

type Props = {
  post: Document
}

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
          <h1 className="font-primary text-2xl font-bold md:text-4xl mb-2">
            {post.title}
          </h1>
          <div className="hidden md:block md:mb-12 text-slate-600">
            {/* Written on <DateFormatter dateString={post.publishedAt} /> by{' '}
            {post.author.name}. */}
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

type Params = {
  params: {
    slug: string
  }
}

async function getData(params: { slug: string }) {
  const db = await load()
  const post = await db
    .find({ collection: 'posts', slug: params.slug }, [
      'title',
      'publishedAt',
      'slug',
      'author',
      'content',
      'coverImage'
    ])
    .first()

  const content = await markdownToHtml(post.content || '')

  return {
    ...post,
    content
  }
}

export async function generateStaticParams() {
  return getDocumentPaths('posts')
}
