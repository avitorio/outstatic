import { Check } from 'lucide-react'
import { ReactNode } from 'react'

type FeatureProps = {
  icon: ReactNode
  title: string
  video: string
  points: string[]
}

export default function Feature({ icon, title, video, points }: FeatureProps) {
  return (
    <section className="flex w-full flex-1 px-4 py-36 flex-col text-slate-800 mt-20 md:mt-0 bg-blue-50 items-center">
      <div className="container px-4 md:px-6 max-w-6xl">
        <div className="flex-col md:flex-row flex items-center justify-center gap-6 lg:gap-12">
          <div className="flex flex-col justify-center space-y-4 min-w-[24rem]">
            <div className="flex gap-3">
              {icon}
              <h2 className="text-3xl font-medium tracking-tighter sm:text-5xl">
                {title}
              </h2>
            </div>
            <p className="max-w-[600px] text-zinc-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-zinc-400"></p>
            <ul className="grid gap-2 py-4">
              {points.map((point) => (
                <li className="flex gap-2 items-center">
                  <Check size={18} />
                  {point}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white px-4 pt-4 border border-t-[3px] border-b-[5px] border-x-4 border-black rounded-cartoon2 md:rounded-cartoon overflow-hidden">
            <video
              controls={false}
              loop
              autoPlay
              muted
              className="w-full rounded-md max-w-1/2"
            >
              <source src={video} type="video/mp4" />
            </video>
          </div>
        </div>
      </div>
    </section>
  )
}
