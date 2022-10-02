import { useRouter } from 'next/router'
import ErrorPage from 'next/error'
import Header from '../../components/Header'
import Layout from '../../components/Layout'
import Head from 'next/head'
import markdownToHtml from '../../lib/markdownToHtml'
import { Document } from '../../interfaces/document'
import { getDocumentPaths, getDocumentBySlug } from 'outstatic/server'
import DateFormatter from '../../components/DateFormatter'
import Image from 'next/image'

type Props = {
  post: Document
}

export default function Post({ post }: Props) {
  const router = useRouter()
  if (!router.isFallback && !post?.slug) {
    return <ErrorPage statusCode={404} />
  }
  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-5">
        <Header />
        {router.isFallback ? (
          <h1 className="font-primary text-2xl font-bold md:text-4xl mb-2">
            Loading…
          </h1>
        ) : (
          <>
            <article className="mb-32">
              <Head>
                <title>{`${post.title} | Next.js + Outstatic`}</title>
                <meta property="og:image" content={post.coverImage} />
              </Head>
              <div className="mb-2 md:mb-4 sm:mx-0">
                <Image
                  alt={post.title}
                  src={post.coverImage}
                  width={1200}
                  height={(1200 * 2) / 5}
                  layout="responsive"
                  objectFit="cover"
                  objectPosition={'center center'}
                />
              </div>
              <h1 className="font-primary text-2xl font-bold md:text-4xl mb-2">
                {post.title}
              </h1>
              <div className="hidden md:block md:mb-12 text-slate-600">
                Written on <DateFormatter dateString={post.publishedAt} /> by{' '}
                {post.author.name}.
              </div>
              <hr className="border-neutral-200 mt-10 mb-10" />
              <div className="max-w-2xl mx-auto">
                <div
                  className="prose lg:prose-xl"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
              </div>
            </article>
          </>
        )}
      </div>
    </Layout>
  )
}

type Params = {
  params: {
    slug: string
  }
}

export async function getStaticProps({ params }: Params) {
  const post = getDocumentBySlug('posts', params.slug, [
    'title',
    'publishedAt',
    'slug',
    'author',
    'content',
    'coverImage'
  ])
  const content = await markdownToHtml(post.content || '')

  return {
    props: {
      post: {
        ...post,
        content
      }
    }
  }
}

export async function getStaticPaths() {
  return {
    paths: getDocumentPaths('posts'),
    fallback: false
  }
}
