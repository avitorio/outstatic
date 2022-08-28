import Link from 'next/link'
import { useState } from 'react'
import { PostType } from '../../types'
import DeletePostButton from '../DeletePostButton'

type PostTableProps = {
  posts: Omit<PostType, 'content'>[]
  contentType: string
}
const options = {
  year: 'numeric' as const,
  month: 'long' as const,
  day: 'numeric' as const
}

const PostsTable = (props: PostTableProps) => {
  const [posts, setPosts] = useState(props.posts)

  return (
    <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
      <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
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
            <tr
              key={slug}
              className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-600"
            >
              <th
                scope="row"
                className="whitespace-nowrap px-6 py-4 text-base font-semibold text-gray-900 dark:text-white"
              >
                <Link href={`/outstatic/${props.contentType}/${slug}`}>
                  {title}
                </Link>
              </th>
              <td className="px-6 py-4 text-base font-semibold capitalize text-gray-900 dark:text-white">
                {status}
              </td>
              <td className="px-6 py-4 text-base font-semibold text-gray-900 dark:text-white">
                {publishedAt.toLocaleDateString('en-US', options)}
              </td>
              <td className="px-6 py-4 text-right">
                <DeletePostButton
                  slug={slug}
                  disabled={false}
                  onComplete={() =>
                    setPosts(posts.filter(p => p.slug !== slug))
                  }
                  contentType={props.contentType}
                />
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  )
}

export default PostsTable
