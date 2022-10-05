import { useRouter } from 'next/router'
import ErrorPage from 'next/error'
import Head from 'next/head'
import { useMemo } from 'react'
import { getMDXComponent } from 'mdx-bundler/client'
import { Document } from '../../interfaces/document'
import { getDocumentPaths, getDocumentBySlug } from 'outstatic/server'
import markdownToHtml from '../../lib/markdownToHtml'
import formatDate from '../../lib/formatDate'
import Header from '../../components/Header'
import MDXComponents from '../../components/MDXComponents'

type Props = {
  doc: Document
  menu: Document
}

export default function Post({ doc, menu }: Props) {
  const router = useRouter()
  const Component = useMemo(() => getMDXComponent(doc.content), [doc.content])

  if (!router.isFallback && !doc?.slug) {
    return <ErrorPage statusCode={404} />
  }

  return (
    <>
      <Header />
      <div className="bg-white flex w-full">
        <aside className="border-r px-4 py- w-full max-w-xs sticky top-16 h-[calc(100vh-4rem)] overflow-y-scroll no-scrollbar">
          <div
            className="prose prose-base"
            dangerouslySetInnerHTML={{ __html: menu.content }}
          />
        </aside>
        <div className="w-full ml-10 sm:px-2 lg:px-8 xl:px-12 py-12">
          {router.isFallback ? (
            <h1 className="font-primary text-2xl font-bold md:text-4xl mb-2">
              Loading…
            </h1>
          ) : (
            <>
              <article className="mb-32 w-full">
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
                <div className="prose prose-base">
                  <Component
                    components={
                      {
                        ...MDXComponents
                      } as any
                    }
                  />
                </div>
              </article>
            </>
          )}
        </div>
      </div>
    </>
  )
}

type Params = {
  params: {
    slug: string
  }
}

import { bundleMDX } from 'mdx-bundler'
import rehypePrism from 'rehype-prism-plus'

export async function getStaticProps({ params }: Params) {
  const doc = getDocumentBySlug('docs', params.slug, [
    'title',
    'publishedAt',
    'slug',
    'author',
    'content',
    'coverImage'
  ])

  const menu = getDocumentBySlug('menus', 'docs-menu', ['content'])

  // const content = await markdownToHtml(doc.content || '')
  const menuContent = await markdownToHtml(menu.content || '')
  const result = await bundleMDX({
    source: doc.content,
    mdxOptions(options) {
      options.rehypePlugins = [...(options.rehypePlugins ?? []), rehypePrism]
      return options
    }
  })
  return {
    props: {
      doc: {
        ...doc,
        content: result.code
      },
      menu: {
        content: menuContent
      }
    }
  }
}

export async function getStaticPaths() {
  return {
    paths: getDocumentPaths('docs'),
    fallback: false
  }
}
