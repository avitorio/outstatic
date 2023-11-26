import Feature from '@/components/Features'
import Hero from '@/components/Hero'
import HomeVideo from '@/components/HomeVideo'
import Navbar from '@/components/Navbar'
import { Sparkles } from 'lucide-react'
import Image from 'next/image'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2 max-w-screen overflow-hidden">
      <Navbar />
      <main className="flex w-full flex-1 flex-col items-center justify-center text-slate-800 mt-5 md:mt-10">
        <Hero />
        <Feature
          icon={<Sparkles size={48} />}
          title="AI Completion"
          video="https://res.cloudinary.com/dpek791br/video/upload/v1700147120/outstatic-feature-1_jrw4zg.mp4"
          points={[
            'Speed Up Your Writing.',
            'Enhanced Accuracy & Consistency.',
            'Creative suggestions.'
          ]}
        />
        <HomeVideo />
        <section className="mb-20">
          <div className="flex flex-col items-center">
            <div className="flex flex-col md:flex-row justify-center items-center md:gap-10 min-w-[270px] md:min-w-[700px] px-4">
              <span className="text-2xl">Powered by:</span>
              <div className="flex justify-center items-center gap-6 md:gap-10">
                <Image
                  src="/images/nextjs-logo.svg"
                  width={100}
                  height={96}
                  alt="Vercel"
                />
                <Image
                  src="/images/vercel-logo.svg"
                  width={100}
                  height={96}
                  alt="Vercel"
                />
                <Image
                  src="/images/github-logo.svg"
                  width={100}
                  height={96}
                  alt="Vercel"
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="flex h-24 w-full items-center justify-center border-t text-slate-800">
        Created by&nbsp;
        <a
          className="hover:underline font-semibold text-slate-800"
          href="https://x.com/andrevitorio"
          target="_blank"
          rel="noreferrer"
        >
          Andre Vitorio
        </a>
        , design by&nbsp;
        <a
          className="hover:underline font-semibold text-slate-800"
          href="https://pacy.co"
          target="_blank"
          rel="noreferrer"
        >
          Pacy
        </a>
        .
      </footer>
    </div>
  )
}
