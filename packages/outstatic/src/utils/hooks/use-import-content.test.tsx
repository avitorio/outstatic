import { act, renderHook } from '@testing-library/react'
import type { ContentSuggestion } from '@/types/content-scan'
import { createCommitApi } from '@/utils/create-commit-api'
import { composeImportFiles } from '@/utils/import-content'
import { useCollections } from './use-collections'
import { useCreateCommit } from './use-create-commit'
import { useImportContent } from './use-import-content'
import useOid from './use-oid'
import { useOutstatic } from './use-outstatic'
import { useRebuildMetadata } from './use-rebuild-metadata'
import { useSingletons } from './use-singletons'

jest.mock('@/utils/create-commit-api', () => ({ createCommitApi: jest.fn() }))
jest.mock('@/utils/import-content', () => ({ composeImportFiles: jest.fn() }))
jest.mock('./use-collections', () => ({ useCollections: jest.fn() }))
jest.mock('./use-create-commit', () => ({ useCreateCommit: jest.fn() }))
jest.mock('./use-oid', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('./use-outstatic', () => ({ useOutstatic: jest.fn() }))
jest.mock('./use-rebuild-metadata', () => ({ useRebuildMetadata: jest.fn() }))
jest.mock('./use-singletons', () => ({ useSingletons: jest.fn() }))

const mockCreateCommitApi = createCommitApi as jest.Mock
const mockComposeImportFiles = composeImportFiles as jest.Mock
const mockUseCollections = useCollections as jest.Mock
const mockUseCreateCommit = useCreateCommit as jest.Mock
const mockUseOid = useOid as jest.Mock
const mockUseOutstatic = useOutstatic as jest.Mock
const mockUseRebuildMetadata = useRebuildMetadata as jest.Mock
const mockUseSingletons = useSingletons as jest.Mock

const selection = { id: 'posts' } as ContentSuggestion

describe('useImportContent', () => {
  const fetchOid = jest.fn()
  const refetchCollections = jest.fn()
  const refetchSingletons = jest.fn()
  const mutateAsync = jest.fn()
  const rebuildMetadata = jest.fn()
  const replaceFile = jest.fn()
  const createInput = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseOutstatic.mockReturnValue({
      repoOwner: 'acme',
      repoSlug: 'site',
      repoBranch: 'main',
      session: null,
      ostContent: 'outstatic/content'
    })
    mockUseOid.mockReturnValue(fetchOid)
    mockUseCollections.mockReturnValue({ refetch: refetchCollections })
    mockUseSingletons.mockReturnValue({ refetch: refetchSingletons })
    mockUseCreateCommit.mockReturnValue({ mutateAsync })
    mockUseRebuildMetadata.mockReturnValue(rebuildMetadata)
    mockCreateCommitApi.mockReturnValue({ replaceFile, createInput })
    fetchOid.mockResolvedValue('oid-1')
    refetchCollections.mockResolvedValue({ data: [] })
    refetchSingletons.mockResolvedValue({ data: [] })
    createInput.mockReturnValue({ input: 'commit' })
    mutateAsync.mockResolvedValue(undefined)
    rebuildMetadata.mockResolvedValue(undefined)
  })

  it('commits imported schemas and rebuilds metadata', async () => {
    mockComposeImportFiles.mockReturnValue({
      files: [
        { path: 'outstatic/content/posts/schema.json', content: '{}' },
        { path: 'outstatic/content/collections.json', content: '[]' },
        { path: 'outstatic/content/singletons.json', content: '[]' }
      ],
      skipped: [],
      hasSchemaChanges: true
    })
    const { result } = renderHook(() => useImportContent())

    await act(async () => {
      await expect(result.current([selection], [])).resolves.toMatchObject({
        committed: true
      })
    })

    expect(mockCreateCommitApi).toHaveBeenCalledWith(
      expect.objectContaining({ owner: 'acme', name: 'site', oid: 'oid-1' })
    )
    expect(replaceFile).toHaveBeenCalledTimes(3)
    expect(mutateAsync).toHaveBeenCalledWith({ input: 'commit' })
    expect(rebuildMetadata).toHaveBeenCalledTimes(1)
  })

  it('does not commit or rebuild metadata when all selections are skipped', async () => {
    mockComposeImportFiles.mockReturnValue({
      files: [
        { path: 'outstatic/content/collections.json', content: '[]' },
        { path: 'outstatic/content/singletons.json', content: '[]' }
      ],
      skipped: ['content/posts'],
      hasSchemaChanges: false
    })
    const { result } = renderHook(() => useImportContent())

    await act(async () => {
      await expect(result.current([selection], [])).resolves.toMatchObject({
        committed: false
      })
    })

    expect(mockCreateCommitApi).not.toHaveBeenCalled()
    expect(mutateAsync).not.toHaveBeenCalled()
    expect(rebuildMetadata).not.toHaveBeenCalled()
  })
})
