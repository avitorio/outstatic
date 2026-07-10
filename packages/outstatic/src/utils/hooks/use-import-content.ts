import type { ContentSuggestion } from '@/types/content-scan'
import { createCommitApi } from '@/utils/create-commit-api'
import { createOutstaticCommitMessage } from '@/utils/commit-message'
import { stringifyError } from '@/utils/errors/stringify-error'
import { useCollections } from '@/utils/hooks/use-collections'
import { useCreateCommit } from '@/utils/hooks/use-create-commit'
import useOid from '@/utils/hooks/use-oid'
import { useOutstatic } from '@/utils/hooks/use-outstatic'
import { useRebuildMetadata } from '@/utils/hooks/use-rebuild-metadata'
import { useSingletons } from '@/utils/hooks/use-singletons'
import { composeImportFiles } from '@/utils/import-content'

export function useImportContent() {
  const { repoOwner, repoSlug, repoBranch, session, ostContent } = useOutstatic()
  const fetchOid = useOid()
  const mutation = useCreateCommit()
  const rebuildMetadata = useRebuildMetadata()
  const { refetch: refetchCollections } = useCollections({ enabled: false })
  const { refetch: refetchSingletons } = useSingletons({ enabled: false })

  return async (selections: ContentSuggestion[], singletons: ContentSuggestion[]) => {
    try {
      const [oid, collectionsResult, singletonsResult] = await Promise.all([
        fetchOid(), refetchCollections(), refetchSingletons()
      ])
      if (!oid) throw new Error('Failed to read the repository head.')
      const composed = composeImportFiles({
        selections,
        singletons,
        existingCollections: collectionsResult.data ?? [],
        existingSingletons: singletonsResult.data ?? [],
        ostContent
      })
      if (composed.files.length <= 2) return composed

      const commit = createCommitApi({
        message: createOutstaticCommitMessage({
          scope: 'config', action: 'create', target: 'collections',
          label: `import ${selections.length + singletons.length} content groups`
        }),
        owner: repoOwner || session?.user.login || '',
        name: repoSlug,
        branch: repoBranch,
        oid
      })
      composed.files.forEach((file) => commit.replaceFile(file.path, file.content))
      await mutation.mutateAsync(commit.createInput())
      if (selections.length > 0 || singletons.length > 0) {
        await rebuildMetadata()
      }
      return composed
    } catch (error) {
      throw new Error(stringifyError(error))
    }
  }
}
