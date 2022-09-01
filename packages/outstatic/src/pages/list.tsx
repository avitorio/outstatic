import { GraphQLError } from 'graphql'
import matter from 'gray-matter'
import Link from 'next/link'
import { singular } from 'pluralize'
import { useContext } from 'react'
import { AdminLayout, PostsTable } from '../components'
import { OutstaticContext } from '../context'
import { usePostsQuery } from '../graphql/generated'
import { PostType } from '../types'
import { ostSignOut } from '../utils/auth/hooks'

type GQLErrorExtended = GraphQLError & { type: string }

type ListProps = {
  contentType: string
}

export default function List({ contentType }: ListProps) {
  const { repoOwner, repoSlug, contentPath, monorepoPath, session } =
    useContext(OutstaticContext)
  const { data, error } = usePostsQuery({
    variables: {
      owner: repoOwner || session?.user?.name || '',
      name: repoSlug || '',
      contentPath:
        `HEAD:${
          monorepoPath ? monorepoPath + '/' : ''
        }${contentPath}/${contentType}` || ''
    },
    fetchPolicy: 'network-only',
    onError: ({ graphQLErrors }) => {
      if (
        graphQLErrors &&
        (graphQLErrors?.[0] as GQLErrorExtended)?.type === 'NOT_FOUND'
      ) {
        ostSignOut()
        return null
      }
      return null
    }
  })

  let posts: Omit<PostType, 'content'>[] = []

  const entries =
    data?.repository?.object?.__typename === 'Tree' &&
    data?.repository?.object?.entries

  if (entries) {
    entries.forEach((post) => {
      if (post.name.slice(-3) === '.md') {
        const {
          data: { title, publishedAt, status }
        } = matter(
          post?.object?.__typename === 'Blob' && post?.object?.text
            ? post?.object?.text
            : ''
        )
        posts.push({
          title,
          status,
          publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
          slug: post.name.replace('.md', '')
        })
      }
    })

    posts.sort((a, b) => Number(b.publishedAt) - Number(a.publishedAt))
  }

  return (
    <AdminLayout error={error}>
      <div className="mb-8 flex h-12 items-center">
        <h1 className="mr-12 text-2xl capitalize">{contentType}</h1>
        <Link href={`/outstatic/${contentType}/new`}>
          <a className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:border-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-700 capitalize">
            New {singular(contentType)}
          </a>
        </Link>
      </div>
      <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
        {posts.length > 0 && (
          <PostsTable posts={posts} contentType={contentType} />
        )}
      </div>
    </AdminLayout>
  )
}
