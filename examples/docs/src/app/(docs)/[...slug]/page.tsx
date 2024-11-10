import Header from '@/components/header'
import formatDate from '@/lib/formatDate'
import { Metadata } from 'next'
import { getDocumentBySlug, getDocumentSlugs, load } from 'outstatic/server'
import { notFound } from 'next/navigation'

type Params = Promise<{ slug: string[] }>

export async function generateMetadata(props: {
  params: Params
}): Promise<Metadata> {
  const params = await props.params
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

export default async function Post(props: { params: Params }) {
  const params = await props.params
  const { doc, menu } = await getData(params)

  if (!doc) {
    notFound()
  }

  return (
    <>
      <Header />
      <div className="bg-background flex w-full">
        <SidebarNav content={menu.content} />
        <div className="w-full flex flex-col items-center ml-0 md:ml-10 px-4 lg:px-8 xl:px-12 py-12 max-w-full overflow-x-scroll lg:overflow-x-auto">
          <article className="mb-32 w-full px-4 pt-10 md:px-6 md:pt-12 max-w-[860px] prose prose-outstatic">
            <h1 className="font-primary text-2xl font-bold md:text-4xl mb-2">
              {doc.title}
            </h1>
            <div className="hidden md:block md:mb-12 text-slate-700 dark:text-slate-400">
              Last updated on{' '}
              <time dateTime={doc.publishedAt}>
                {formatDate(doc.publishedAt)}
              </time>
            </div>
            <hr className="border-neutral-200 mt-10 mb-10" />
            <div className="w-full prose prose-outstatic">
              <MDXComponent content={doc.content} />
            </div>
          </article>
        </div>
        <div className="hidden 2xl:block w-full max-w-xs"></div>
      </div>
      <MobileMenu content={menu.content} />
    </>
  )
}

import MDXComponent from '@/components/mdx/mdx-component'
import { MobileMenu } from '@/components/mobile-menu'
import { SidebarNav } from '@/components/sidebar-nav'
import MDXServer from '@/lib/mdx-server'

async function getData(params: { slug: string[] }) {
  const db = await load()
  const slug = params.slug
  const latest = slug.length === 1

  const doc = await db
    .find(
      {
        collection: latest ? 'docs' : params.slug[0],
        slug: latest ? params.slug[0] : params.slug[1]
      },
      [
        'title',
        'publishedAt',
        'slug',
        'author',
        'content',
        'coverImage',
        'collection'
      ]
    )
    .first()

  if (!doc) {
    notFound()
  }

  const menu = getDocumentBySlug(
    'menus',
    latest ? 'latest-menu' : `${params.slug[0]}-menu`,
    ['content']
  )

  const docMdx = await MDXServer(doc?.content)

  const menuMdx = menu ? await MDXServer(menu?.content) : ''

  return {
    doc: {
      ...doc,
      content: docMdx
    },
    menu: {
      content: menuMdx
    }
  }
}

export async function generateStaticParams() {
  const latest = getDocumentSlugs('docs')
  const v1_4 = getDocumentSlugs('v1.4')

  const slugs = [
    ...latest.map((slug) => ({ slug: [slug] })),
    ...v1_4.map((slug) => ({ slug: ['v1.4', slug] }))
  ]

  return slugs
}
