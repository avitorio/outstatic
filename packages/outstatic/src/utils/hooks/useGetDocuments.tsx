import { GET_DOCUMENTS } from '@/graphql/queries/documents'
import { useParams } from 'next/navigation'
import request from 'graphql-request'
import { useQuery } from '@tanstack/react-query'
import { useOutstaticNew } from './useOstData'
import matter from 'gray-matter'
import { OstDocument } from '@/types/public'
import { useGetDocument } from './useGetDocument'

const dateFormatOptions = {
  year: 'numeric' as const,
  month: 'long' as const,
  day: 'numeric' as const
}

type Tree = {
  entries: TreeEntry[]
}

type TreeEntry = {
  name: string
  object: {
    text: string
    commitUrl: string
  }
}

export const useGetDocuments = () => {
  const {
    repoOwner,
    repoSlug,
    repoBranch,
    monorepoPath,
    contentPath,
    session
  } = useOutstaticNew()

  const params = useParams<{ ost: string[] }>()

  const ostContent = `${repoBranch}:${
    monorepoPath ? monorepoPath + '/' : ''
  }${contentPath}/${params?.ost[0]}`

  const { data: schema, isPending } = useGetDocument({
    filePath: `${ostContent}/schema.json`,
    enabled: true
  })

  return useQuery({
    queryKey: [`documents-${params?.ost}`, { repoOwner, repoSlug, repoBranch }],
    queryFn: async () => {
      const object = schema
        ? (schema?.repository?.object as { text: string })
        : null
      const { path } = object ? JSON.parse(object?.text) : { path: '' }

      const { repository } = await request(
        'https://api.github.com/graphql',
        GET_DOCUMENTS,
        {
          owner: repoOwner,
          name: repoSlug,
          contentPath: path ? `${repoBranch}:${path}` : ostContent
        },
        {
          authorization: `Bearer ${session?.access_token}`
        }
      )

      if (repository?.object === null) return []

      let documents: OstDocument[] = []

      const { entries } = repository?.object as Tree

      if (entries) {
        entries.forEach(({ object, name }) => {
          if (/\.(md|mdx)$/.test(name)) {
            try {
              const { data } = matter(object.text)

              // Remove 'coverImage' from data
              const { coverImage, ...listData } = data

              // Format document details
              const formattedData = {
                ...(listData as OstDocument),
                title: listData.title || name,
                author: listData.author?.name || '',
                publishedAt: new Date(listData.publishedAt).toLocaleDateString(
                  'en-US',
                  dateFormatOptions
                ),
                slug: name.replace(/\.mdx?$/, '') // Handles both .md and .mdx
              }

              documents.push(formattedData)
            } catch (error) {
              console.error(`Error processing ${name}:`, error)
              // Handle the error as appropriate
            }
          }
        })

        documents.sort((a, b) => Number(b.publishedAt) - Number(a.publishedAt))
      }

      return documents
    },
    meta: {
      errorMessage: `Failed to fetch collection: ${params?.ost[0]}`
    },
    enabled: !isPending
  })
}
