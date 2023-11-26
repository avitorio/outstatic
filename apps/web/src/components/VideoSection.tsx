import Image from 'next/image'
import Link from 'next/link'
import HomeVideo from './HomeVideo'

export const VideoSection = () => (
  <section className="w-full mb-20 md:px-0">
    <div className="px-4 flex flex-col items-center mb-10">
      <div className="block max-w-[320px] md:max-w-[700px] mb-2 md:mb-4">
        <Image
          src="/images/write-publish-live.svg"
          width={700}
          height={96}
          alt="Write, Publish, It's live!"
          className="w-full min-w-[320px] md:min-w-[700px] mt-8"
        />
      </div>
      <p className="mt-2 text-xl text-slate-800 mb-8">
        Get a complete dashboard to manage your Next.js static website. <br />
        Check out our demo below, or{' '}
        <Link href="/docs/getting-started" className="underline font-semibold">
          get&nbsp;started
        </Link>
        .
      </p>
    </div>
    <div className="relative w-full flex flex-col items-center justify-center">
      <div className="w-full absolute pointer-events-none">
        <div className="relative w-full h-screen">
          <Image src="/images/line-bg-home.svg" fill alt="Line background" />
        </div>
      </div>
      <div className="w-full absolute pointer-events-none left-0 top-60 hidden xl:block">
        <div className="relative w-full h-screen">
          <Image
            src="/images/boy-laptop.png"
            width={250}
            height={250}
            alt="boy with laptop"
            className="absolute right-[calc(50%-680px)]"
          />
        </div>
      </div>
      <HomeVideo />
    </div>
  </section>
)
