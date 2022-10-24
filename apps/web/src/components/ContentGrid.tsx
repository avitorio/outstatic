import { Document } from '@/interfaces/document'
import Link from 'next/link'
import Image from 'next/image'
import formatDate from '@/lib/formatDate'

type Props = {
  collection: 'posts' | 'projects'
  title?: string
  items: Document[]
}

const ContentGrid = ({ title = 'More', items, collection }: Props) => {
  return (
    <section id={collection}>
      <h2 className="mb-8 text-5xl md:text-6xl font-bold tracking-tighter leading-tight">
        {title}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 sm:gap-x-6 lg:gap-x-8 gap-y-5 sm:gap-y-6 lg:gap-y-8 mb-8">
        {items.map((item) => (
          <Link
            key={item.slug}
            as={`/${collection}/${item.slug}`}
            href={`/${collection}/[slug]`}
          >
            <div className="bg-white cursor-pointer border project-card rounded-md md:w-full scale-100 hover:scale-[1.02] active:scale-[0.97] motion-safe:transform-gpu transition duration-100 motion-reduce:hover:scale-100 hover:shadow overflow-hidden">
              <div className="sm:mx-0 relative">
                <Image
                  src={item.coverImage}
                  alt={`Cover Image for ${item.title}`}
                  width={350}
                  height={item.description ? 180 : 350}
                  layout="responsive"
                  objectFit="cover"
                />
                {collection === 'projects' && (
                  <h4 className="p-2 bg-opacity-80 bg-white text-center whitespace-nowrap font-bold text-3xl absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 shadow-lg rounded-lg">
                    {item.title}
                  </h4>
                )}
              </div>
              {collection === 'posts' && (
                <div className="p-4">
                  <h3 className="text-xl mb-2 leading-snug font-bold">
                    <Link as={`/posts/${item.slug}`} href="/posts/[slug]">
                      <a className="hover:underline">{item.title}</a>
                    </Link>
                  </h3>
                  <div className="text-md mb-4 text-slate-700">
                    Written on{' '}
                    <time dateTime={item.publishedAt}>
                      {formatDate(item.publishedAt)}
                    </time>{' '}
                    by {item.author.name}.
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
