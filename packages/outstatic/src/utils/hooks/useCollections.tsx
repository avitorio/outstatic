import { GET_COLLECTIONS } from '@/graphql/queries/collections'
import { useOutstatic } from '@/utils/hooks/useOutstatic'
import { useQuery } from '@tanstack/react-query'
import { createCommitApi } from '../createCommitApi'
import useOid from './useOid'
import { toast } from 'sonner'
import { useCreateCommit } from './useCreateCommit'
import { GET_FILE } from '@/graphql/queries/file'
import { sentenceCase } from 'change-case'

export type CollectionType = {
  title: string
  slug: string
  path: string
  children: CollectionType[]
}

type CollectionsType = CollectionType[] | null

type UseCollectionsOptions = {
  enabled?: boolean
}

export function useCollections(options?: UseCollectionsOptions) {
  const { enabled = true } = options ?? {}
  const { repoOwner, repoSlug, repoBranch, isPending, gqlClient, ostContent } =
    useOutstatic()
  const fetchOid = useOid()
  const mutation = useCreateCommit()

  return useQuery({
    queryKey: ['collections', { repoOwner, repoSlug, repoBranch, ostContent }],
    queryFn: async (): Promise<CollectionsType> => {
      try {
        const collectionJson =
          isPending || !repoOwner || !repoSlug || !repoBranch
            ? null
            : await gqlClient.request(GET_FILE, {
                owner: repoOwner,
                name: repoSlug,
                filePath: `${repoBranch}:${ostContent}/collections.json` || ''
              })

        let collectionsData: CollectionsType = null

        const collectionsObject = collectionJson?.repository?.object as {
          text?: string
        }

        if (collectionsObject?.text) {
          collectionsData = JSON.parse(collectionsObject.text)
          const collections = collectionsData ?? []

          return collections
        }

        // If the collections.json file doesn't exist, fetch the collections from the outstatic folder
        // and create the collections.json file
        if (collectionJson === null || collectionsObject === null) {
          const data =
            isPending || !repoOwner || !repoSlug || !repoBranch
              ? null
              : await gqlClient.request(GET_COLLECTIONS, {
                  owner: repoOwner,
                  name: repoSlug,
                  contentPath: `${repoBranch}:${ostContent}` || ''
                })

          if (!data || data?.repository?.object === null) {
            // We couldn't find the outstatic folder, so we return an empty array
            return [] as CollectionsType
          }

          const { entries } = data?.repository?.object as {
            entries: { name: string; type: string }[]
          }

          collectionsData = entries
            .map((entry) =>
              entry.type === 'tree'
                ? {
                    title: sentenceCase(entry.name, {
                      split: (str) =>
                        str.split(/([^A-Za-z0-9\.]+)/g).filter(Boolean)
                    }),
                    slug: entry.name,
                    path: `${ostContent}/${entry.name}`,
                    children: []
                  }
                : undefined
            )
            .filter(Boolean) as CollectionsType

          const oid = await fetchOid()

          if (!oid) {
            throw new Error('No oid found')
          }

          const commitApi = createCommitApi({
            message: 'chore: Updates collections',
            owner: repoOwner,
            name: repoSlug,
            branch: repoBranch,
            oid
          })

          commitApi.replaceFile(
            `${ostContent}/collections.json`,
            JSON.stringify(collectionsData, null, 2)
          )

          const payload = commitApi.createInput()

          toast.promise(mutation.mutateAsync(payload), {
            loading: 'Updating collections',
            success: 'Collections updated',
            error: 'Error updating collections'
          })

          return collectionsData
        }
        return []
      } catch (error) {
        console.error('Error fetching collections:', error)
        toast.error('Error fetching collections')
        return []
      }
    },
    enabled:
      enabled && !!repoOwner && !!repoSlug && !!repoBranch && !!ostContent
  })
}
