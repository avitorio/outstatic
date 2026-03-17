import { GET_FILE } from '@/graphql/queries/file'
import { useOutstatic } from '@/utils/hooks/use-outstatic'
import { useQuery } from '@tanstack/react-query'
import {
  FieldSchemaTarget,
  FieldSchemaType,
  getFieldSchemaQueryKey,
  getFieldSchemaRequestPath
} from './field-schema'

export const useFieldSchema = ({
  target,
  enabled = true
}: {
  target: FieldSchemaTarget
  enabled?: boolean
}) => {
  const { repoOwner, repoSlug, repoBranch, ostContent, session, gqlClient } =
    useOutstatic()

  const filePath = getFieldSchemaRequestPath(target, ostContent, repoBranch)

  return useQuery({
    queryKey: getFieldSchemaQueryKey(target, ostContent, repoBranch),
    queryFn: async (): Promise<FieldSchemaType> => {
      try {
        const { repository } = await gqlClient.request(GET_FILE, {
          owner: repoOwner || session?.user?.login || '',
          name: repoSlug,
          filePath
        })

        if (!repository || repository.object === null) {
          return null
        }

        const { text } = repository.object as { text: string }
        return JSON.parse(text)
      } catch (error) {
        if (target.kind === 'singleton') {
          return null
        }

        throw error
      }
    },
    meta: {
      errorMessage: `Failed to fetch ${target.kind} schema for: ${target.slug}`
    },
    enabled: enabled && !(target.kind === 'singleton' && target.isNew)
  })
}
