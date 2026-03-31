import Layout from '@/components/Layout'
import { load } from 'outstatic/server'
import ContentGrid from '@/components/ContentGrid'
import MDXServer from '@/lib/mdx-server'
import MDXComponent from '@/components/mdx/mdx-component'

export default async function Index() {
  const { content, allPosts, allProjects } = await getData()

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-5">
        <section className="mt-16 mb-16 md:mb-12 prose lg:prose-2xl home-intro">
          <MDXComponent
            content={content}
          />
        </section>
        {allPosts.length > 0 && (
          <ContentGrid
            title="Posts"
            items={allPosts}
            collection="posts"
            priority
          />
        )}
        {allProjects.length > 0 && (
          <ContentGrid
            title="Projects"
            items={allProjects}
            collection="projects"
          />
        )}
      </div>
    </Layout>
  )
}

async function getData() {
  const db = await load()

  const page = await db
    .find({ collection: 'pages', slug: 'home' }, ['content'])
    .first()

  const content = await MDXServer(page.content)

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
    .toArray()

  const allProjects = await db
    .find({ collection: 'projects', status: 'published' }, [
      'title',
      'slug',
      'coverImage'
    ])
    .sort({ publishedAt: -1 })
    .toArray()

  return {
    content,
    allPosts,
    allProjects
  }
}
