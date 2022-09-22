import { useRouter } from 'next/router'
import ErrorPage from 'next/error'
import Head from 'next/head'
import type Content from '../../interfaces/content'
import { getContentPaths, getContentBySlug } from 'outstatic/server'
import markdownToHtml from '../../lib/markdownToHtml'
import formatDate from '../../lib/formatDate'
import Header from '../../components/Header'

type Props = {
  doc: Content
  menu: Content
}

export default function Post({ doc, menu }: Props) {
  const router = useRouter()
  if (!router.isFallback && !doc?.slug) {
    return <ErrorPage statusCode={404} />
  }
  return (
    <div className="h-screen overflow-hidden">
      <Header />
      <div className="bg-white relative flex w-full">
        <aside className="border-r px-4 py-12 w-80">
          <div
            className="prose lg:prose-xl"
            dangerouslySetInnerHTML={{ __html: menu.content }}
          />
        </aside>
        <div className="w-full ml-10 sm:px-2 lg:px-8 xl:px-12 py-12 h-screen sticky top-0 overflow-y-scroll">
          {router.isFallback ? (
            <h1 className="font-primary text-2xl font-bold md:text-4xl mb-2">
              Loading…
            </h1>
          ) : (
            <>
              <article className="mb-32">
                <Head>
                  <title>{`${doc.title} | Next.js + Outstatic`}</title>
                  <meta property="og:image" content={doc.coverImage} />
                </Head>
                <h1 className="font-primary text-2xl font-bold md:text-4xl mb-2">
                  {doc.title}
                </h1>
                <div className="hidden md:block md:mb-12 text-slate-600">
                  Last updated on{' '}
                  <time dateTime={doc.publishedAt}>
                    {formatDate(doc.publishedAt)}
                  </time>
                  .
                </div>
                <hr className="border-neutral-200 mt-10 mb-10" />
                <div className="max-w-2xl">
                  <div
                    className="prose lg:prose-xl"
                    dangerouslySetInnerHTML={{ __html: doc.content }}
                  />
                </div>
              </article>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

type Params = {
  params: {
    slug: string
  }
}

export async function getStaticProps({ params }: Params) {
  const doc = getContentBySlug('docs', params.slug, [
    'title',
    'publishedAt',
    'slug',
    'author',
    'content',
    'coverImage'
  ])

  const menu = getContentBySlug('menus', 'docs-menu', ['content'])

  const content = await markdownToHtml(doc.content || '')
  const menuContent = await markdownToHtml(menu.content || '')

  return {
    props: {
      doc: {
        ...doc,
        content
      },
      menu: {
        content: menuContent
      }
    }
  }
}

export async function getStaticPaths() {
  return {
    paths: getContentPaths('docs'),
    fallback: false
  }
}
