import { GET_COLLECTIONS } from '@/graphql/queries/collections'
import { useOutstatic } from '@/utils/hooks/use-outstatic'
import { useQuery } from '@tanstack/react-query'
import { createCommitApi } from '../create-commit-api'
import useOid from './use-oid'
import { toast } from 'sonner'
import { useCreateCommit } from './use-create-commit'
import { GET_FILE } from '@/graphql/queries/file'
import { sentenceCase } from 'change-case'
import { stringifyError } from '@/utils/errors/stringify-error'

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

const SINGLETONS_COLLECTION_SLUG = '_singletons'

function filterSingletonsCollection(
  collections: CollectionType[] = []
): CollectionType[] {
  return collections.filter(
    (collection) => collection.slug !== SINGLETONS_COLLECTION_SLUG
  )
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
          const collections = filterSingletonsCollection(collectionsData ?? [])

          return collections
        }

        // Legacy bootstrap:
        // Before collections.json existed, Outstatic inferred collections from
        // folders under outstatic/content. We keep this fallback for older
        // installs, but `_singletons` is a system directory and must never be
        // treated as a collection.
        // We still generate collections.json here so legacy installs are
        // upgraded to the current source of truth.
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
            .filter(
              (entry) =>
                entry.type === 'tree' &&
                entry.name !== SINGLETONS_COLLECTION_SLUG
            )
            .map((entry) => ({
              title: sentenceCase(entry.name, {
                split: (str) => str.split(/([^A-Za-z0-9\.]+)/g).filter(Boolean)
              }),
              slug: entry.name,
              path: `${ostContent}/${entry.name}`,
              children: []
            })) as CollectionsType

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
        const errorToast = toast.error('Error fetching collections', {
          action: {
            label: 'Copy Logs',
            onClick: () => {
              navigator.clipboard.writeText(`Error: ${stringifyError(error)}`)
              toast.message('Logs copied to clipboard', {
                id: errorToast
              })
            }
          }
        })
        return []
      }
    },
    meta: {
      errorMessage: 'Failed to fetch collections'
    },
    enabled:
      enabled && !!repoOwner && !!repoSlug && !!repoBranch && !!ostContent
  })
}
