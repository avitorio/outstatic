import { GraphQLError } from 'graphql'
import matter from 'gray-matter'
import Link from 'next/link'
import { singular } from 'pluralize'
import { useContext } from 'react'
import { AdminLayout, PostsTable } from '../components'
import { OutstaticContext } from '../context'
import { usePostsQuery } from '../graphql/generated'
import { Document } from '../types'
import { ostSignOut } from '../utils/auth/hooks'

type GQLErrorExtended = GraphQLError & { type: string }

type ListProps = {
  collection: string
}

export default function List({ collection }: ListProps) {
  const { repoOwner, repoSlug, contentPath, monorepoPath, session } =
    useContext(OutstaticContext)
  const { data, error } = usePostsQuery({
    variables: {
      owner: repoOwner || session?.user?.login || '',
      name: repoSlug || '',
      contentPath:
        `HEAD:${
          monorepoPath ? monorepoPath + '/' : ''
        }${contentPath}/${collection}` || ''
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

  let posts: Omit<Document, 'content'>[] = []

  const entries =
    data?.repository?.object?.__typename === 'Tree' &&
    data?.repository?.object?.entries

  if (entries) {
    entries.forEach((post) => {
      if (post.name.slice(-3) === '.md') {
        const {
          data: { title, publishedAt, status, author }
        } = matter(
          post?.object?.__typename === 'Blob' && post?.object?.text
            ? post?.object?.text
            : ''
        )
        posts.push({
          title,
          status,
          publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
          slug: post.name.replace('.md', ''),
          author
        })
      }
    })

    posts.sort((a, b) => Number(b.publishedAt) - Number(a.publishedAt))
  }

  return (
    <AdminLayout error={error}>
      <div className="mb-8 flex h-12 items-center">
        <h1 className="mr-12 text-2xl capitalize">{collection}</h1>
        <Link href={`/outstatic/${collection}/new`}>
          <a className="rounded-lg border px-5 py-2.5 text-sm font-medium focus:outline-none focus:ring-4 border-gray-600 bg-gray-800 text-white hover:border-gray-600 hover:bg-gray-700 focus:ring-gray-700 capitalize">
            New {singular(collection)}
          </a>
        </Link>
      </div>
      <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
        {posts.length > 0 && (
          <PostsTable posts={posts} collection={collection} />
        )}
      </div>
    </AdminLayout>
  )
}
