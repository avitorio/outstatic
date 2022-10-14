import Link from 'next/link'
import { useState } from 'react'
import { Document } from '../../types'
import DeletePostButton from '../DeletePostButton'

type PostTableProps = {
  posts: Omit<Document, 'content'>[]
  collection: string
}
const options = {
  year: 'numeric' as const,
  month: 'long' as const,
  day: 'numeric' as const
}

const PostsTable = (props: PostTableProps) => {
  const [posts, setPosts] = useState(props.posts)

  return (
    <table className="w-full text-left text-sm text-gray-500">
      <thead className="bg-gray-50 text-xs uppercase text-gray-700 border-b">
        <tr>
          <th scope="col" className="px-6 py-3">
            TITLE
          </th>
          <th scope="col" className="px-6 py-3">
            STATUS
          </th>
          <th scope="col" className="px-6 py-3">
            DATE
          </th>
          <th scope="col" className="px-6 py-3" />
        </tr>
      </thead>
      <tbody>
        {posts &&
          posts.map(({ slug, title, status, publishedAt }) => (
            <tr key={slug} className="border-b bg-white hover:bg-gray-50">
              <th
                scope="row"
                className="relative whitespace-nowrap px-6 py-4 text-base font-semibold text-gray-900 group"
              >
                <Link href={`/outstatic/${props.collection}/${slug}`}>
                  <a className="group-hover:text-blue-500">
                    <div>
                      {title}
                      <div className="absolute top-0 bottom-0 left-0 right-40 cursor-pointer" />
                    </div>
                  </a>
                </Link>
              </th>
              <td className="px-6 py-4 text-base font-semibold capitalize text-gray-900">
                {status}
              </td>
              <td className="px-6 py-4 text-base font-semibold text-gray-900">
                {publishedAt.toLocaleDateString('en-US', options)}
              </td>
              <td className="px-6 py-4 text-right">
                <DeletePostButton
                  slug={slug}
                  disabled={false}
                  onComplete={() =>
                    setPosts(posts.filter((p) => p.slug !== slug))
                  }
                  collection={props.collection}
                />
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  )
}

export default PostsTable
