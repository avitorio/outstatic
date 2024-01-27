import { Shapes, Smile, Sparkles } from 'lucide-react'
import Link from 'next/link'
import Feature from './Feature'

export default function FeaturesSection() {
  return (
    <section className="flex w-full flex-1 px-4 py-24 md:py-36 flex-col text-slate-800 mt-16 md:mb-24 items-center">
      <div className="flex flex-col max-w-2xl text-center z-10">
        <h2 className="font-lora text-3xl md:text-6xl font-medium mb-8">
          A full featured content editor for your site
        </h2>
        <p className="text-lg md:text-xl">
          Complete with custom fields, AI Completion, easy data fetching & more!
        </p>
      </div>
      <Feature
        icon={<Smile />}
        title="Quick & Easy Setup"
        video="https://res.cloudinary.com/dpek791br/video/upload/v1706372153/outstatic-feature-1_jrw_bykpf6.mp4"
      >
        <p>
          Your CMS without the complexity of databases or additional
          infrastructure.{' '}
        </p>
        <p>
          <Link
            className="underline"
            href="/docs/getting-started#adding-outstatic-to-a-nextjs-website"
          >
            Add Outstatic to Next.js
          </Link>{' '}
          or{' '}
          <Link
            className="underline"
            href="/docs/getting-started#deploy-with-vercel"
          >
            deploy a new site
          </Link>{' '}
          in less than 5 minutes.
        </p>
      </Feature>
      <Feature
        icon={<Shapes size={48} />}
        title="Custom Fields"
        video="https://res.cloudinary.com/dpek791br/video/upload/v1706392006/outstatic-feature-2_br1psz.mp4"
        roundedCartoon="rounded-cartoon2 md:rounded-cartoon -rotate-[0.5deg]"
      >
        <p>Tailor your site with ease.</p>
        <p>
          Add Custom Fields for expanded content management. From metadata to
          product details, the possibilities are endless.
        </p>
      </Feature>
      <Feature
        icon={<Sparkles size={48} />}
        title="AI Completion"
        video="https://res.cloudinary.com/dpek791br/video/upload/v1700147120/outstatic-feature-1_jrw4zg.mp4"
      >
        <p>Streamline your workflow with intelligence.</p>
        <p>
          Activate AI Completion to transform ideas into content instantly.
          Perfect for drafting articles or generating creative copy, setup is
          swift and seamless.
        </p>
      </Feature>
    </section>
  )
}
