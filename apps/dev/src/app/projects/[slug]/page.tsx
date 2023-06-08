import Header from '@/components/Header'
import Layout from '@/components/Layout'
import Head from 'next/head'
import markdownToHtml from '@/lib/markdownToHtml'
import { getDocumentSlugs, load } from 'outstatic/server'
import DateFormatter from '@/components/DateFormatter'
import Image from 'next/image'
import ContentGrid from '@/components/ContentGrid'

export default async function Project({
  params
}: {
  params: { slug: string }
}) {
  const { project, moreProjects, content } = await getData(params)

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-5">
        <Header />
        <article className="mb-8">
          <Head>
            <title>{`${project.title} | Next.js + Outstatic`}</title>
            <meta property="og:image" content={project.coverImage} />
          </Head>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="relative mb-2 md:mb-4 sm:mx-0 h-64">
              <Image
                alt={project.title}
                src={project.coverImage ?? ''}
                fill
                className="object-cover object-center"
                priority
              />
            </div>
            <div>
              <h1 className="font-primary text-2xl font-bold md:text-4xl mb-2">
                {project.title}
              </h1>
              <div className="hidden md:block md:mb-8 text-slate-600">
                Launched on <DateFormatter dateString={project.publishedAt} />{' '}
                {project?.author?.name ? `by ${project?.author?.name}` : null}.
              </div>
              <div className="inline-block p-4 border mb-8 font-semibold text-lg rounded shadow">
                {project.description}
              </div>
              <div className="max-w-2xl mx-auto">
                <div
                  className="prose lg:prose-xl"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              </div>
            </div>
          </div>
        </article>
        <div className="mb-16">
          {moreProjects.length > 0 && (
            <ContentGrid
              title="Other Projects"
              items={moreProjects}
              collection="projects"
            />
          )}
        </div>
      </div>
    </Layout>
  )
}

async function getData(params: { slug: string }) {
  const db = await load()
  const project = await db
    .find({ collection: 'projects', slug: params.slug }, [
      'title',
      'publishedAt',
      'description',
      'slug',
      'author',
      'content',
      'coverImage'
    ])
    .first()

  const content = await markdownToHtml(project.content)

  const moreProjects = await db
    .find({ collection: 'projects', slug: { $ne: params.slug } }, [
      'title',
      'slug',
      'coverImage'
    ])
    .toArray()

  return {
    project,
    content,
    moreProjects
  }
}

export async function generateStaticParams() {
  const posts = getDocumentSlugs('projects')
  return posts.map((slug) => ({ slug }))
}
