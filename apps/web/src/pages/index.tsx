import Head from 'next/head'
import { getContentType } from 'outstatic/server'
import ContentGrid from '../components/ContentGrid'
import Content from '../interfaces/content'

type HomeProps = {
  allPosts: Content[]
}

export default function Home({ allPosts }: HomeProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <Head>
        <title>Web - Outstatic Example</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="mx-auto w-auto px-4 pt-16 pb-8 sm:pt-24 lg:px-8">
        <h1 className="mx-auto max-w-5xl text-center text-6xl font-extrabold leading-[1.1] tracking-tighter text-black sm:text-7xl lg:text-8xl xl:text-8xl mb-4">
          Outstatic
        </h1>
        <h2 className="mx-auto max-w-5xl text-center text-4xl font-extrabold leading-[1.1] tracking-tighter text-black sm:text-3xl lg:text-4xl xl:text-4xl">
          A Static CMS for Next.js
        </h2>
        <div className="mx-auto mt-5 max-w-xl sm:flex sm:justify-center md:mt-8">
          <a href="/docs/getting-started">
            <div className="flex w-full items-center justify-center rounded-md border border-transparent bg-black px-8 py-3 text-base font-medium text-white no-underline hover:bg-gray-700 md:py-3 md:px-10 md:text-lg md:leading-6">
              Get Started
              <span className="ml-2">→</span>
            </div>
          </a>
        </div>
        <div className="grid grid-cols-4 mt-20">
          <h3 className="mx-auto max-w-5xl text-center text-3xl font-extrabold leading-[1.1] tracking-tighter text-black sm:text-3xl lg:text-4xl xl:text-4xl">
            Open Source.
          </h3>
          <h3 className="mx-auto max-w-5xl text-center text-3xl font-extrabold leading-[1.1] tracking-tighter text-black sm:text-3xl lg:text-4xl xl:text-4xl">
            Host for Free.
          </h3>
          <h3 className="mx-auto max-w-5xl text-center text-3xl font-extrabold leading-[1.1] tracking-tighter text-black sm:text-3xl lg:text-4xl xl:text-4xl">
            Own your data.
          </h3>
          <h3 className="mx-auto max-w-5xl text-center text-3xl font-extrabold leading-[1.1] tracking-tighter text-black sm:text-3xl lg:text-4xl xl:text-4xl">
            5-minute setup.
          </h3>
        </div>

        <div className="px-4 py-16 mx-auto sm:pt-20 sm:pb-24 lg:max-w-7xl lg:pt-24">
          <ContentGrid items={allPosts} contentType="posts" title="Our blog" />
        </div>
      </main>
    </div>
  )
}

export const getStaticProps = async () => {
  const allPosts = getContentType('posts', [
    'title',
    'publishedAt',
    'slug',
    'coverImage',
    'description',
    'author'
  ])

  return {
    props: { allPosts }
  }
}
