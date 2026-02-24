import { useOutstatic } from '@/utils/hooks/useOutstatic'
import { useQuery } from '@tanstack/react-query'
import { createCommitApi } from '../createCommitApi'
import useOid from './useOid'
import { toast } from 'sonner'
import { useCreateCommit } from './useCreateCommit'
import { GET_FILE } from '@/graphql/queries/file'
import { useGetDocuments } from './useGetDocuments'
import { SingletonsType } from '@/types/singleton'

type UseGetSingletonsOptions = {
  enabled?: boolean
}

const MD_MDX_REGEXP = /\.mdx?$/i

export function useSingletons(options?: UseGetSingletonsOptions) {
  const { enabled = true } = options ?? {}
  const { repoOwner, repoSlug, repoBranch, isPending, gqlClient, ostContent } =
    useOutstatic()
  const fetchOid = useOid()
  const mutation = useCreateCommit()
  const { refetch: refetchDocuments } = useGetDocuments({
    enabled: false,
    collection: '_singletons'
  })

  return useQuery({
    queryKey: ['singletons', { repoOwner, repoSlug, repoBranch, ostContent }],
    queryFn: async (): Promise<SingletonsType> => {
      try {
        const singletonsJson =
          isPending || !repoOwner || !repoSlug || !repoBranch
            ? null
            : await gqlClient.request(GET_FILE, {
                owner: repoOwner,
                name: repoSlug,
                filePath: `${repoBranch}:${ostContent}/singletons.json` || ''
              })

        let singletonsData: SingletonsType = null

        const singletonsObject = singletonsJson?.repository?.object as {
          text?: string
        }

        if (singletonsObject?.text) {
          singletonsData = JSON.parse(singletonsObject.text)
          const singletons = singletonsData ?? []

          return singletons
        }

        // If the singletons.json file doesn't exist, fetch the singletons from the outstatic folder
        // and create the singletons.json file
        if (singletonsJson === null || singletonsObject === null) {
          const { data } = await refetchDocuments()

          if (!data || data.documents === null) {
            return []
          }

          // Filter for .md/.mdx files (blobs) and extract singleton info
          const singletons =
            data.documents?.map((entry) => {
              const slug = entry.slug.replace(MD_MDX_REGEXP, '')
              return {
                title: entry.title,
                slug,
                path: `${ostContent}/_singletons/${entry.slug}.${entry.extension}`,
                directory: `${ostContent}/_singletons`,
                publishedAt: entry.publishedAt,
                status: entry.status
              }
            }) ?? []

          const oid = await fetchOid()

          if (!oid) {
            throw new Error('No oid found')
          }

          const commitApi = createCommitApi({
            message: 'chore: Updates singletons',
            owner: repoOwner,
            name: repoSlug,
            branch: repoBranch,
            oid
          })

          commitApi.replaceFile(
            `${ostContent}/singletons.json`,
            JSON.stringify(singletons, null, 2)
          )

          const payload = commitApi.createInput()

          toast.promise(mutation.mutateAsync(payload), {
            loading: 'Updating singletons',
            success: 'Singletons updated',
            error: 'Error updating singletons'
          })

          return singletons
        }
        return []
      } catch (error) {
        console.error('Error fetching singletons:', error)
        toast.error('Error fetching singletons')
        return []
      }
    },
    enabled:
      enabled && !!repoOwner && !!repoSlug && !!repoBranch && !!ostContent,
    staleTime: 1000 * 60 * 60 // 1 hour
  })
}
