import Header from '@/components/Header'
import Layout from '@/components/Layout'
import markdownToHtml from '@/lib/markdownToHtml'
import { getDocumentSlugs, load } from 'outstatic/server'
import DateFormatter from '@/components/DateFormatter'
import Image from 'next/image'
import ContentGrid from '@/components/ContentGrid'
import { OstDocument } from 'outstatic'
import { Metadata } from 'next'
import { absoluteUrl } from '@/lib/utils'
import { notFound } from 'next/navigation'

type Project = {
  tags: { value: string; label: string }[]
} & OstDocument

interface Params {
  params: {
    slug: string
  }
}
export async function generateMetadata(params: Params): Promise<Metadata> {
  const { project } = await getData(params)

  if (!project) {
    return {}
  }

  return {
    title: project.title,
    description: project.description,
    openGraph: {
      title: project.title,
      description: project.description,
      type: 'article',
      url: absoluteUrl(`/projects/${project.slug}`),
      images: [
        {
          url: absoluteUrl(project?.coverImage || '/images/og-image.png'),
          width: 1200,
          height: 630,
          alt: project.title
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: project.title,
      description: project.description,
      images: absoluteUrl(project?.coverImage || '/images/og-image.png')
    }
  }
}

export default async function Project(params: Params) {
  const { project, moreProjects, content } = await getData(params)

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-5">
        <Header />
        <article className="mb-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="relative mb-2 md:mb-4 sm:mx-0 aspect-square">
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

async function getData({ params }: Params) {
  const db = await load()
  const project = await db
    .find<Project>({ collection: 'projects', slug: params.slug }, [
      'title',
      'publishedAt',
      'description',
      'slug',
      'author',
      'content',
      'coverImage'
    ])
    .first()

  if (!project) {
    notFound()
  }

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
