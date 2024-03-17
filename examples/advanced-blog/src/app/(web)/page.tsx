import ContentGrid from '@/components/content-grid'
import markdownToHtml from '@/lib/markdownToHtml'
import { load } from 'outstatic/server'

export default async function Index() {
  const { content, allPosts, otherCollections } = await getData()

  return (
    <>
      <section className="mb-16 md:min-h-[calc(100vh-256px)] items-center flex">
        <div
          className="prose lg:prose-2xl home-intro prose-outstatic home-hero-fade"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </section>
      <div className="animate-fade-in delay-1000 opacity-0 duration-500">
        {allPosts.length > 0 && (
          <ContentGrid
            title="posts"
            items={allPosts}
            collection="posts"
            priority
            viewAll
          />
        )}
        {Object.keys(otherCollections).map((collection) => {
          if (!collection.length) return null
          return (
            <ContentGrid
              key={collection}
              title={collection}
              items={otherCollections[collection]}
              collection={collection}
              viewAll
            />
          )
        })}
      </div>
    </>
  )
}

async function getData() {
  const db = await load()

  // get content for the homepage
  const page = await db
    .find({ collection: 'pages', slug: 'home' }, ['content'])
    .first()

  // convert markdown to html
  const content = await markdownToHtml(page.content)

  // get all posts. Example of fetching a specific collection
  const allPosts = await db
    .find({ collection: 'posts', status: 'published' }, [
      'title',
      'publishedAt',
      'slug',
      'coverImage',
      'description',
      'tags'
    ])
    .sort({ publishedAt: -1 })
    .limit(3)
    .toArray()

  // get remaining collections
  const collections = await db
    .find(
      {
        // $nor is an operator that means "not or"
        $nor: [{ collection: 'posts' }, { collection: 'pages' }],
        status: 'published'
      },
      [
        'collection',
        'title',
        'publishedAt',
        'slug',
        'coverImage',
        'description'
      ]
    )
    .sort({ publishedAt: -1 })
    .limit(3)
    .toArray()

  // group remaining collections by collection
  const otherCollections = collections.reduce<{
    [key: string]: (typeof collections)[0][]
  }>((acc, item) => {
    if (!acc[item.collection]) {
      acc[item.collection] = []
    }

    acc[item.collection].push(item)

    return acc
  }, {})

  return {
    content,
    allPosts,
    otherCollections
  }
}
