import { ReactElement, ReactNode, cloneElement } from 'react'

type FeatureProps = {
  icon: ReactElement
  title: string
  video: string
  roundedCartoon?: string
  children?: ReactNode
}

export default function Feature({
  icon,
  title,
  video,
  children,
  roundedCartoon = 'rounded-cartoon md:rounded-cartoon2'
}: FeatureProps) {
  const newIcon = cloneElement(icon, { className: 'w-8 h-8 md:w-12 md:h-12' })
  return (
    <div className="container flex-col-reverse md:flex-row md:odd:flex-row-reverse flex md:items-center justify-center gap-6 lg:gap-12 md:px-6 max-w-6xl mt-24">
      <div className="flex flex-col md:justify-center space-y-4 md:min-w-[24rem]">
        <div className="flex gap-3 items-center mb-2">
          {newIcon}
          <h2 className="text-2xl font-medium tracking-tighter sm:text-4xl">
            {title}
          </h2>
        </div>
        {children}
      </div>
      <div
        className={`bg-white border border-t-[3px] border-b-[5px] border-x-4 border-black overflow-hidden ${roundedCartoon}`}
      >
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
  )
}
