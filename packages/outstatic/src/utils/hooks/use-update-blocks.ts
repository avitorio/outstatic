import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createCommitApi } from '@/utils/create-commit-api'
import { createOutstaticCommitMessage } from '@/utils/commit-message'
import { useOutstatic } from '@/utils/hooks/use-outstatic'
import { stringifyBlocks } from '@/utils/metadata/stringify'
import { Block, BlocksSchema } from '@/utils/metadata/types'
import { useCreateCommit } from './use-create-commit'
import { useGetBlocks } from './use-get-blocks'
import useOid from './use-oid'

type BlockCommitAction = 'create' | 'update' | 'delete'

const createEmptyBlocksSchema = (): BlocksSchema => ({
  commit: '',
  generated: '',
  blocks: []
})

export function useUpdateBlocks() {
  const queryClient = useQueryClient()
  const createCommit = useCreateCommit()
  const { repoOwner, repoSlug, repoBranch, session, blocksJsonPath } =
    useOutstatic()
  const fetchOid = useOid()
  const { refetch } = useGetBlocks({
    enabled: false
  })

  const persistBlocks = useCallback(
    async ({
      blocks,
      action,
      label
    }: {
      blocks: Block[]
      action: BlockCommitAction
      label?: string
    }) => {
      const oid = await fetchOid()
      const owner = repoOwner || session?.user?.login || ''

      const commitApi = createCommitApi({
        message: createOutstaticCommitMessage({
          scope: 'config',
          action,
          target: 'blocks',
          label
        }),
        owner,
        oid: oid ?? '',
        name: repoSlug,
        branch: repoBranch
      })

      const nextSchema: BlocksSchema = {
        ...createEmptyBlocksSchema(),
        blocks
      }

      commitApi.replaceFile(blocksJsonPath, stringifyBlocks(nextSchema))

      const commitPromise = createCommit.mutateAsync(commitApi.createInput())

      toast.promise(commitPromise, {
        loading: 'Updating blocks...',
        success: 'Blocks updated successfully',
        error: 'Failed to update blocks'
      })

      await commitPromise

      await queryClient.invalidateQueries({ queryKey: ['blocks'] })
    },
    [
      blocksJsonPath,
      createCommit,
      fetchOid,
      queryClient,
      repoBranch,
      repoOwner,
      repoSlug,
      session
    ]
  )

  const getCurrentBlocks = useCallback(async () => {
    const { data, isError } = await refetch()

    if (isError) {
      throw new Error('Failed to fetch blocks')
    }

    return data?.blocks ?? createEmptyBlocksSchema()
  }, [refetch])

  const addBlock = useCallback(
    async (block: Block) => {
      const current = await getCurrentBlocks()
      await persistBlocks({
        blocks: [...current.blocks, block],
        action:
          current.blocks.length === 0 && !current.commit ? 'create' : 'update',
        label: block.name
      })
    },
    [getCurrentBlocks, persistBlocks]
  )

  const updateBlock = useCallback(
    async (previousName: string, block: Block) => {
      const current = await getCurrentBlocks()
      await persistBlocks({
        blocks: current.blocks.map((item) =>
          item.name === previousName ? block : item
        ),
        action: 'update',
        label: block.name
      })
    },
    [getCurrentBlocks, persistBlocks]
  )

  const deleteBlock = useCallback(
    async (blockName: string) => {
      const current = await getCurrentBlocks()
      await persistBlocks({
        blocks: current.blocks.filter((item) => item.name !== blockName),
        action: 'delete',
        label: blockName
      })
    },
    [getCurrentBlocks, persistBlocks]
  )

  return {
    addBlock,
    updateBlock,
    deleteBlock
  }
}
