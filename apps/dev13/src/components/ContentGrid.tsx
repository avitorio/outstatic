import type { Document } from '../interfaces/document'
import Link from 'next/link'
import Image from 'next/image'

type Props = {
  collection: 'posts' | 'projects'
  title?: string
  items: Document[]
  priority?: boolean
}

const ContentGrid = ({
  title = 'More',
  items,
  collection,
  priority = false
}: Props) => {
  return (
    <section id={collection}>
      <h2 className="mb-8 text-5xl md:text-6xl font-bold tracking-tighter leading-tight">
        {title}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 sm:gap-x-6 lg:gap-x-8 gap-y-5 sm:gap-y-6 lg:gap-y-8 mb-8">
        {items.map((item, id) => (
          <Link
            key={item.slug}
            as={`/${collection}/${item.slug}`}
            href={`/${collection}/[slug]`}
          >
            <div className="cursor-pointer border project-card rounded-md md:w-full scale-100 hover:scale-[1.02] active:scale-[0.97] motion-safe:transform-gpu transition duration-100 motion-reduce:hover:scale-100 hover:shadow overflow-hidden">
              <div className="sm:mx-0">
                <Image
                  src={item.coverImage}
                  alt={`Cover Image for ${item.title}`}
                  className="object-cover object-center w-full h-auto"
                  width={0}
                  height={0}
                  sizes="(min-width: 768px) 347px, 192px"
                  priority={priority && id <= 2}
                />
                {collection === 'projects' && (
                  <h2 className="p-2 bg-opacity-80 bg-white text-center whitespace-nowrap font-bold text-3xl absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 shadow-lg rounded-lg">
                    {item.title}
                  </h2>
                )}
              </div>
              {collection === 'posts' && (
                <div className="p-4">
                  <h3 className="text-xl mb-2 leading-snug font-bold hover:underline">
                    {item.title}
                  </h3>
                  <div className="text-md mb-4 text-slate-700"></div>
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
