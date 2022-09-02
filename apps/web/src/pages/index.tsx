import Head from 'next/head'
import Link from 'next/link'
import { getContentType } from 'outstatic/server'

type HomeProps = {
  allPosts: {
    slug: string
    publishedAt: string
    title: string
    description?: string
  }[]
}

export default function Home({ allPosts }: HomeProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <Head>
        <title>Web - Outstatic Example</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="mx-auto w-auto px-4 pt-16 pb-8 sm:pt-24 lg:px-8">
        <h1 className="mx-auto max-w-5xl text-center text-6xl font-extrabold leading-[1.1] tracking-tighter text-white sm:text-7xl lg:text-8xl xl:text-8xl mb-4">
          Outstatic
        </h1>
        <h2 className="mx-auto max-w-5xl text-center text-4xl font-extrabold leading-[1.1] tracking-tighter text-white sm:text-3xl lg:text-4xl xl:text-4xl">
          A Static CMS for Next.js
        </h2>
        <div className="mx-auto mt-5 max-w-xl sm:flex sm:justify-center md:mt-8">
          <a href="https://outstatic.com/docs">
            <div className="flex w-full items-center justify-center rounded-md border border-transparent bg-black px-8 py-3 text-base font-medium text-white no-underline hover:bg-gray-700 dark:bg-white dark:text-black dark:hover:bg-gray-300 md:py-3 md:px-10 md:text-lg md:leading-6">
              Get Started
              <span className="ml-2 bg-gradient-to-r from-brandred to-brandblue bg-clip-text text-transparent">
                →
              </span>
            </div>
          </a>
        </div>
        <div className="grid grid-cols-3 mt-20">
          <h3 className="mx-auto max-w-5xl text-center text-3xl font-extrabold leading-[1.1] tracking-tighter text-white sm:text-3xl lg:text-4xl xl:text-4xl">
            Open Source.
          </h3>
          <h3 className="mx-auto max-w-5xl text-center text-3xl font-extrabold leading-[1.1] tracking-tighter text-white sm:text-3xl lg:text-4xl xl:text-4xl">
            Host for Free.
          </h3>
          <h3 className="mx-auto max-w-5xl text-center text-3xl font-extrabold leading-[1.1] tracking-tighter text-white sm:text-3xl lg:text-4xl xl:text-4xl">
            5-minute setup.
          </h3>
        </div>

        <div className="w-full mx-auto mt-20 bg-blue-500 p-10">
          <h3 className="text-4xl font-extrabold leading-[1.1] tracking-tighter text-white sm:text-3xl lg:text-4xl xl:text-4xl">
            Our blog
          </h3>
          <div className="grid grid-cols-2 gap-10 mt-10">
            {allPosts.map(({ slug, publishedAt, title, description }) => (
              <Link key={slug} href={`/posts/${slug}`}>
                <a className="block p-6 max-w-sm bg-white rounded-lg border border-gray-200 shadow-md hover:bg-gray-100">
                  <small>{formatDate(publishedAt)}</small>
                  <h2 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">
                    {title}
                  </h2>
                  <p className="font-normal text-gray-700">{description}</p>
                </a>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

export async function getStaticProps() {
  const allPosts = getContentType('posts', [
    'slug',
    'publishedAt',
    'title',
    'description'
  ])
  return {
    props: {
      allPosts: allPosts || []
    }
  }
}
