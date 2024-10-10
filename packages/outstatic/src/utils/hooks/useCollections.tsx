import { GET_COLLECTIONS } from '@/graphql/queries/collections'
import useOutstatic from '@/utils/hooks/useOutstatic'
import { useQuery } from '@tanstack/react-query'
import { createCommitApi } from '../createCommitApi'
import useOid from './useOid'
import { toast } from 'sonner'
import { useCreateCommit } from './useCreateCommit'
import { GET_FILE } from '@/graphql/queries/file'

type CollectionType = {
  name: string
  path: string
  children: CollectionType[]
}

export type CollectionsType = CollectionType[] | null

type UseCollectionsOptions = {
  enabled?: boolean
  detailed?: boolean
}

export type DetailedReturnType = {
  collections: string[]
  fullData: CollectionsType
}

type UseCollectionsReturnType<T extends boolean> = T extends true
  ? DetailedReturnType
  : string[]

export const useCollections = <T extends boolean = false>(
  options?: UseCollectionsOptions & { detailed?: T }
) => {
  const { enabled = true, detailed = false as T } = options ?? {}
  const { repoOwner, repoSlug, repoBranch, isPending, gqlClient, ostContent } =
    useOutstatic()
  const fetchOid = useOid()
  const mutation = useCreateCommit()

  return useQuery({
    queryKey: [
      'collections',
      { repoOwner, repoSlug, repoBranch, ostContent, detailed }
    ],
    queryFn: async (): Promise<UseCollectionsReturnType<T>> => {
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
          const collections = detailed
            ? {
                collections:
                  collectionsData?.map((collection) => collection.name) ?? [],
                fullData: collectionsData ?? []
              }
            : collectionsData?.map((collection) => collection.name) ?? []

          return collections as UseCollectionsReturnType<T>
        }

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
            const collections = detailed
              ? {
                  collections: [],
                  fullData: []
                }
              : []

            return collections as unknown as UseCollectionsReturnType<T>
          }

          const { entries } = data?.repository?.object as {
            entries: { name: string; type: string }[]
          }

          collectionsData = entries
            .map((entry) =>
              entry.type === 'tree'
                ? {
                    name: entry.name,
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

          const collections = detailed
            ? {
                collections:
                  collectionsData?.map((collection) => collection.name) ?? [],
                fullData: collectionsData ?? []
              }
            : collectionsData?.map((collection) => collection.name) ?? []

          return collections as UseCollectionsReturnType<T>
        }
        return [] as unknown as UseCollectionsReturnType<T>
      } catch (error) {
        console.error('Error fetching collections:', error)
        toast.error('Error fetching collections')
        return [] as unknown as UseCollectionsReturnType<T>
      }
    },
    enabled:
      enabled && !!repoOwner && !!repoSlug && !!repoBranch && !!ostContent
  })
}
