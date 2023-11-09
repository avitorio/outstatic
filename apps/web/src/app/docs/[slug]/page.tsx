import { getDocumentBySlug, getDocumentSlugs, load } from 'outstatic/server'
import { Metadata } from 'next'
import markdownToHtml from '@/lib/markdownToHtml'
import formatDate from '@/lib/formatDate'
import Header from '@/components/Header'
import Mdx from '@/components/MDXComponent'

interface Params {
  params: {
    slug: string
  }
}

export async function generateMetadata(params: Params): Promise<Metadata> {
  const { doc } = await getData(params)

  if (!doc) {
    return {}
  }

  return {
    title: `${doc.title} - Outstatic`,
    description: doc.description,
    openGraph: {
      title: `${doc.title} - Outstatic`,
      description: doc.description,
      type: 'article',
      url: `https://outstatic.com/docs/${doc.slug}`,
      images: [
        {
          url: 'https://outstatic.com/images/og-image.png',
          width: 1200,
          height: 630,
          alt: doc.title
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: doc.title,
      description: doc.description,
      images: 'https://outstatic.com/images/og-image.png'
    }
  }
}

export default async function Post(params: Params) {
  const { doc, menu } = await getData(params)

  return (
    <>
      <Header />
      <div className="bg-white flex w-full">
        <aside className="border-r px-4 py-4 w-full max-w-xs sticky top-16 h-[calc(100vh-4rem)] overflow-y-scroll no-scrollbar sidebar">
          <div
            className="prose prose-base"
            dangerouslySetInnerHTML={{ __html: menu.content }}
          />
        </aside>
        <div className="w-full ml-10 sm:px-2 lg:px-8 xl:px-12 py-12">
          <article className="mb-32 w-full">
            <h1 className="font-primary text-2xl font-bold md:text-4xl mb-2">
              {doc.title}
            </h1>
            <div className="hidden md:block md:mb-12 text-slate-600">
              Last updated on{' '}
              <time dateTime={doc.publishedAt}>
                {formatDate(doc.publishedAt)}
              </time>
            </div>
            <hr className="border-neutral-200 mt-10 mb-10" />
            <div className="prose prose-base outstatic-content docs">
              <Mdx content={doc.content} />
            </div>
          </article>
        </div>
      </div>
    </>
  )
}

import { bundleMDX } from 'mdx-bundler'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypePrism from 'rehype-prism-plus'
import rehypeSlug from 'rehype-slug'

async function getData({ params }: Params) {
  const db = await load()

  const doc = await db
    .find({ collection: 'docs', slug: params.slug }, [
      'title',
      'publishedAt',
      'slug',
      'author',
      'content',
      'coverImage'
    ])
    .first()

  const menu = getDocumentBySlug('menus', 'docs-menu', ['content'])

  const menuContent = await markdownToHtml(menu?.content || '')

  const result = await bundleMDX({
    source: doc.content,
    mdxOptions(options) {
      options.rehypePlugins = [
        ...(options.rehypePlugins ?? []),
        rehypeSlug,
        rehypePrism,
        [
          rehypeAutolinkHeadings,
          {
            properties: {
              className: ['hash-anchor']
            }
          }
        ]
      ]
      return options
    }
  })

  return {
    doc: {
      ...doc,
      content: result.code
    },
    menu: {
      content: menuContent
    }
  }
}

export async function generateStaticParams() {
  const posts = getDocumentSlugs('docs')
  return posts.map((slug) => ({ slug }))
}
