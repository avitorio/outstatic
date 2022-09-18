import type Content from '../interfaces/content'
import Link from 'next/link'
import DateFormatter from './DateFormatter'
import Image from 'next/image'

type Props = {
  contentType: 'posts' | 'projects'
  title?: string
  items: Content[]
}

const ContentGrid = ({ title = 'More', items, contentType }: Props) => {
  return (
    <section id={contentType}>
      <h2 className="mb-8 text-5xl md:text-6xl font-bold tracking-tighter leading-tight">
        {title}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 sm:gap-x-6 lg:gap-x-8 gap-y-5 sm:gap-y-6 lg:gap-y-8 mb-8">
        {items.map((item) => (
          <Link
            key={item.slug}
            as={`/${contentType}/${item.slug}`}
            href={`/${contentType}/[slug]`}
          >
            <div className="cursor-pointer border project-card rounded-md md:w-full scale-100 hover:scale-[1.02] active:scale-[0.97] motion-safe:transform-gpu transition duration-100 motion-reduce:hover:scale-100 hover:shadow">
              <div className="sm:mx-0 relative">
                <Image
                  src={item.coverImage}
                  alt={`Cover Image for ${item.title}`}
                  width={350}
                  height={item.description ? 180 : 350}
                  layout="responsive"
                  objectFit="cover"
                />
                {contentType === 'projects' && (
                  <h4 className="p-2 bg-opacity-80 bg-white text-center whitespace-nowrap font-bold text-3xl absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 shadow-lg rounded-lg">
                    {item.title}
                  </h4>
                )}
              </div>
              {contentType === 'posts' && (
                <div className="p-4">
                  <h3 className="text-xl mb-2 leading-snug font-bold">
                    <Link as={`/posts/${item.slug}`} href="/posts/[slug]">
                      <a className="hover:underline">{item.title}</a>
                    </Link>
                  </h3>
                  <div className="text-md mb-4 text-slate-700">
                    <DateFormatter dateString={item.publishedAt} />
                  </div>
                  <p className="text-lg leading-relaxed mb-4">
                    {item.description}
                  </p>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default ContentGrid
