import { GET_DOCUMENTS } from '@/graphql/queries/documents'
import { MDExtensions } from '@/types'
import { OstDocument } from '@/types/public'
import { useQuery } from '@tanstack/react-query'
import matter from 'gray-matter'
import { useParams } from 'next/navigation'
import { useGetCollectionSchema } from './useGetCollectionSchema'
import useOutstatic from './useOutstatic'

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

type Document = OstDocument & {
  extension: MDExtensions
}

type FormattedData = Document & {
  [key: string]: any
}

export const useGetDocuments = ({
  enabled = true
}: { enabled?: boolean } = {}) => {
  const {
    repoOwner,
    repoSlug,
    repoBranch,
    session,
    ostContent,
    ostDetach,
    gqlClient
  } = useOutstatic()

  const params = useParams<{ ost: string[] }>()

  const { refetch } = useGetCollectionSchema({ enabled: false })

  return useQuery({
    queryKey: [`documents-${params?.ost}`, { repoOwner, repoSlug, repoBranch }],
    queryFn: async () => {
      const schema = ostDetach ? await refetch() : null

      const path = schema?.data?.path

      let contentPath = `${repoBranch}:${ostContent}/${params?.ost[0]}`

      if (path !== undefined) {
        if (path !== '') {
          contentPath = `${repoBranch}:${path}`
        } else {
          contentPath = `${repoBranch}:`
        }
      }

      const { repository } = await gqlClient.request(GET_DOCUMENTS, {
        owner: repoOwner || session?.user?.login || '',
        name: repoSlug,
        contentPath
      })

      const documents: Document[] = []
      const metadata = new Map<string, any>()

      if (repository?.object === null) return { documents: null, metadata }

      const { entries } = repository?.object as Tree

      if (entries) {
        entries.forEach(({ object, name }) => {
          if (/\.(md|mdx)$/.test(name)) {
            try {
              const { data } = matter(object.text)

              // Remove 'coverImage' from data
              const { coverImage, ...listData } = data

              // Format document details
              const formattedData: FormattedData = {
                ...(listData as Document),
                title: listData.title || name,
                slug: name.replace(/\.mdx?$/, ''), // Handles both .md and .mdx
                extension: name.split('.').pop() as MDExtensions
              }

              // Add publishedAt or date only if it's a valid date
              if (listData.publishedAt || listData.date) {
                const dateKey = listData.publishedAt ? 'publishedAt' : 'date'
                const dateValue = listData[dateKey]
                const parsedDate = new Date(dateValue)
                if (!isNaN(parsedDate.getTime())) {
                  // It's a valid date
                  formattedData[dateKey] = parsedDate.toLocaleDateString(
                    'en-US',
                    dateFormatOptions
                  )
                } else if (typeof dateValue === 'string') {
                  // It might be a pre-formatted date string
                  formattedData[dateKey] = dateValue
                }
              }

              if (listData.author?.name) {
                formattedData.author = listData.author.name
              }

              for (const [key, value] of Object.entries(formattedData)) {
                if (!metadata.has(key)) {
                  metadata.set(key, typeof value)
                }
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

      return { documents, metadata }
    },
    meta: {
      errorMessage: `Failed to fetch collection: ${params?.ost[0]}`
    },
    enabled
  })
}
