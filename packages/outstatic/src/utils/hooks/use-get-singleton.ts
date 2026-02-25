import { GET_FILE } from '@/graphql/queries/file'
import { MDExtensions } from '@/types'
import { useOutstatic } from '@/utils/hooks/use-outstatic'
import { useQuery } from '@tanstack/react-query'
import { useSingletons } from './use-singletons'

type SingletonData = {
  mdDocument: string
  extension: MDExtensions
} | null

export const useGetSingleton = ({
  slug,
  enabled = false
}: {
  slug: string
  enabled?: boolean
}) => {
  const { repoOwner, repoSlug, repoBranch, session, gqlClient } = useOutstatic()
  const { data: singletons, isPending: singletonsPending } = useSingletons()

  const singleton = singletons?.find((s) => s.slug === slug)
  const filePath = singleton?.path

  return useQuery({
    queryKey: ['singleton', { slug, filePath }],
    queryFn: async (): Promise<SingletonData> => {
      if (!filePath) throw new Error('Singleton not found in singletons.json')

      const extension = filePath.endsWith('.mdx') ? 'mdx' : 'md'

      const response = await gqlClient.request(GET_FILE, {
        owner: repoOwner || session?.user?.login || '',
        name: repoSlug,
        filePath: `${repoBranch}:${filePath}`
      })

      const fileObject = response?.repository?.object as {
        text?: string
      } | null

      if (!fileObject?.text) {
        return null
      }

      return { mdDocument: fileObject.text, extension }
    },
    meta: {
      errorMessage: `Failed to fetch singleton: ${slug}`
    },
    enabled: enabled && !singletonsPending && !!filePath
  })
}
