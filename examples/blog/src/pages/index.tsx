import Layout from '../components/layout'
import Head from 'next/head'
import Content from '../interfaces/post'
import { getContentType } from 'outstatic/server'
import ContentGrid from '../components/contentGrid'

type Props = {
  allPosts: Content[]
  allProjects: Content[]
}

export default function Index({ allPosts, allProjects }: Props) {
  return (
    <>
      <Layout>
        <Head>
          <title>Next.js Blog Example with Outstatic</title>
        </Head>
        <div className="max-w-6xl mx-auto px-5">
          <section className="mt-16 mb-16 md:mb-12">
            <span className="text-center md:text-left text-3xl md:text-4xl font-bold">
              Hello!
            </span>
            <h1 className="text-6xl md:text-7xl font-bold tracking-tighter leading-tight md:pr-8">
              I&apos;m Andre, nice to meet you.
            </h1>
            <h4 className="max-w-3xl text-2xl mt-4">
              I am a surfer + musician + software developer + designer + online
              marketer and whatever else I can cram into this existence.
            </h4>
          </section>
          {allPosts.length > 0 && (
            <ContentGrid title="Blog" posts={allPosts} contentType="posts" />
          )}
          {allProjects.length > 0 && (
            <ContentGrid
              title="Projects"
              posts={allProjects}
              contentType="projects"
            />
          )}
        </div>
      </Layout>
    </>
  )
}

export const getStaticProps = async () => {
  const allPosts = getContentType('posts', [
    'title',
    'publishedAt',
    'slug',
    'coverImage',
    'description'
  ])

  const allProjects = getContentType('projects', [
    'title',
    'slug',
    'coverImage'
  ])

  return {
    props: { allPosts, allProjects }
  }
}
