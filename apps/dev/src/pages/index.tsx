import Layout from '../components/Layout'
import Head from 'next/head'
import { Document } from '../interfaces/document'
import { load } from 'outstatic/server'
import ContentGrid from '../components/ContentGrid'
import markdownToHtml from '../lib/markdownToHtml'

type Props = {
  page: Document
  allPosts: Document[]
  allProjects: Document[]
}

export default function Index({ page, allPosts, allProjects }: Props) {
  return (
    <>
      <Layout>
        <Head>
          <title>Outstatic Example Blog</title>
        </Head>
        <div className="max-w-6xl mx-auto px-5">
          <section className="mt-16 mb-16 md:mb-12">
            <div
              className="prose lg:prose-2xl home-intro"
              dangerouslySetInnerHTML={{ __html: page.content }}
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
    </>
  )
}

export const getStaticProps = async () => {
  const db = await load()

  const page = await db
    .find({ collection: 'pages', slug: 'home' }, ['content'])
    .first()
  const content = await markdownToHtml(page.content || '')

  const allPosts = await db
    .find({ collection: 'posts' }, [
      'title',
      'publishedAt',
      'slug',
      'coverImage',
      'description'
    ])
    .sort({ publishedAt: -1 })
    .toArray()

  const allProjects = await db
    .find({ collection: 'projects' }, ['title', 'slug', 'coverImage'])
    .sort({ publishedAt: -1 })
    .toArray()

  return {
    props: { page: { content }, allPosts, allProjects }
  }
}
