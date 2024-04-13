import ContentGrid from '@/components/content-grid'
import DocHero from '@/components/doc-hero'
import MDXComponent from '@/components/mdx/mdx-component'
import MDXServer from '@/lib/mdx-server'
import { absoluteUrl, ogUrl } from '@/lib/utils'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { OstDocument } from 'outstatic'
import { getCollections, load } from 'outstatic/server'

type Document = {
  tags: { value: string; label: string }[]
} & OstDocument

interface Params {
  params: {
    slug: string
  }
}

export async function generateMetadata(params: Params): Promise<Metadata> {
  const { doc, moreDocs } = await getData(params)

  if (!doc) {
    return {
      title: `All ${moreDocs.collection}`,
      description: `All ${moreDocs.collection}`
    }
  }

  return {
    title: doc.title,
    description: doc.description,
    openGraph: {
      title: doc.title,
      description: doc.description,
      type: 'article',
      url: absoluteUrl(`/${doc.collection}/${doc.slug}`),
      images: [
        {
          url: ogUrl(doc?.coverImage || `/api/og?title=${doc.title}`),
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
      images: ogUrl(doc?.coverImage || `/api/og?title=${doc.title}`)
    }
  }
}

export default async function Document(params: Params) {
  const { doc, moreDocs } = await getData(params)

  if (!doc) {
    const { docs, collection } = moreDocs
    return (
      <div className="pt-24 mb-16 animate-fade-up opacity-0">
        {docs.length > 0 && (
          <ContentGrid
            title={`All ${collection}`}
            items={docs}
            collection={collection}
          />
        )}
      </div>
    )
  }

  if (doc.collection === 'pages') {
    return (
      <article className="mb-32 py-24">
        <div className="prose md:prose-xl prose-outstatic animate-fade-up opacity-0">
          <MDXComponent content={doc.content} />
        </div>
      </article>
    )
  }

  return (
    <>
      <article className="mb-32">
        <DocHero {...doc} />
        <div className="max-w-2xl mx-auto">
          <div className="prose prose-outstatic">
            <MDXComponent content={doc.content} />
          </div>
        </div>
      </article>
      <div className="mb-16">
        {moreDocs.length > 0 && (
          <ContentGrid
            title={`More ${doc.collection}`}
            items={moreDocs}
            collection={doc.collection}
          />
        )}
      </div>
    </>
  )
}

async function getData({ params }: Params) {
  const db = await load()
  let slug = params.slug[1]
  let collection = params.slug[0]

  // check if we have two slugs, if not, we are on a collection archive or a page
  if (!params.slug || params.slug.length !== 2) {
    if (collection !== 'pages') {
      const docs = await db
        .find({ collection, status: 'published' }, [
          'title',
          'slug',
          'coverImage',
          'description',
          'tags'
        ])
        .sort({ publishedAt: -1 })
        .toArray()

      // if we have docs, we are on a collection archive
      if (docs.length) {
        return {
          doc: undefined,
          moreDocs: {
            docs,
            collection
          }
        }
      }
    }

    // if we don't have docs, we are on a page
    slug = params.slug[0]
    collection = 'pages'
  }

  // get the document
  const doc = await db
    .find<Document>({ collection, slug }, [
      'collection',
      'title',
      'publishedAt',
      'description',
      'slug',
      'author',
      'content',
      'coverImage',
      'tags'
    ])
    .first()

  if (!doc) {
    notFound()
  }

  const content = await MDXServer(doc.content)

  const moreDocs =
    collection === 'pages'
      ? []
      : await db
          .find(
            {
              collection: params.slug[0],
              slug: { $ne: params.slug[1] },
              status: 'published'
            },
            ['title', 'slug', 'coverImage', 'description']
          )
          .sort({ publishedAt: -1 })
          .toArray()

  return {
    doc: {
      ...doc,
      content
    },
    moreDocs
  }
}

export async function generateStaticParams() {
  const db = await load()
  const collections = getCollections().filter(
    (collection) => collection !== 'pages'
  )

  // get all documents, except those in the posts collection and the home page
  // as we have a specific route for them (/posts)
  const items = await db
    .find(
      {
        $nor: [{ collection: 'posts' }, { collection: 'pages', slug: 'home' }],
        status: 'published'
      },
      ['collection', 'slug']
    )
    .toArray()

  // pages should be at the root level
  const slugs = items.map(({ collection, slug }) => ({
    slug: collection === 'pages' ? [slug] : [collection, slug]
  }))

  collections.forEach((collection) => {
    slugs.push({
      slug: [collection]
    })
  })

  return slugs
}
