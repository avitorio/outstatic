import { GET_DOCUMENTS } from '@/graphql/queries/documents'
import { useParams } from 'next/navigation'
import request from 'graphql-request'
import { useQuery } from '@tanstack/react-query'
import { useOutstaticNew } from './useOstData'
import matter from 'gray-matter'
import { OstDocument } from '@/types/public'

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

  return useQuery({
    queryKey: [
      `documents-${params?.ost}`,
      { repoOwner, repoSlug, repoBranch, contentPath }
    ],
    queryFn: async () => {
      const { repository } = await request(
        'https://api.github.com/graphql',
        GET_DOCUMENTS,
        // variables are type-checked too!
        {
          owner: repoOwner,
          name: repoSlug,
          contentPath: `${repoBranch}:${
            monorepoPath ? monorepoPath + '/' : ''
          }${contentPath}/${params?.ost[0]}`
        },
        {
          authorization: `Bearer ${session?.access_token}`
        }
      )

      if (repository?.object === null) throw new Error('Ouch.')

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
    }
  })
}
