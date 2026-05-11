import { act, renderHook } from '@testing-library/react'
import { useOutstatic } from '@/utils/hooks/use-outstatic'
import { useCreateCommit } from './use-create-commit'
import { useGetConfig } from './use-get-config'
import { useGetMediaFiles } from './use-get-media-files'
import { useGetMetadata } from './use-get-metadata'
import { useGetSingletonSchema } from './use-get-singleton-schema'
import { useSingletons } from './use-singletons'
import useOid from './use-oid'
import matter from 'gray-matter'
import { toast } from 'sonner'
import {
  buildUpdatedSingletonsIndex,
  stageSingletonRename,
  default as useSubmitSingleton
} from './use-submit-singleton'
import { createCommitApi } from '@/utils/create-commit-api'
import {
  addReferencedMedia,
  buildMergedContent,
  createMetadataState,
  replaceConfigFile,
  replaceMediaFile,
  syncCustomFieldTags
} from './use-submit-entry-shared'

jest.mock('@/utils/hooks/use-outstatic', () => ({
  useOutstatic: jest.fn()
}))

jest.mock('./use-create-commit', () => ({
  useCreateCommit: jest.fn()
}))

jest.mock('./use-get-config', () => ({
  useGetConfig: jest.fn()
}))

jest.mock('./use-get-media-files', () => ({
  useGetMediaFiles: jest.fn()
}))

jest.mock('./use-get-metadata', () => ({
  useGetMetadata: jest.fn()
}))

jest.mock('./use-get-singleton-schema', () => ({
  useGetSingletonSchema: jest.fn()
}))

jest.mock('./use-singletons', () => ({
  useSingletons: jest.fn()
}))

jest.mock('./use-oid', () => ({
  __esModule: true,
  default: jest.fn()
}))

jest.mock('@/utils/create-commit-api', () => ({
  createCommitApi: jest.fn()
}))

jest.mock('./use-submit-entry-shared', () => ({
  addReferencedMedia: jest.fn(),
  buildMergedContent: jest.fn(),
  createMetadataState: jest.fn(),
  replaceConfigFile: jest.fn(),
  replaceMediaFile: jest.fn(),
  syncCustomFieldTags: jest.fn()
}))

jest.mock('gray-matter', () => jest.fn())

jest.mock('sonner', () => ({
  toast: {
    promise: jest.fn(),
    error: jest.fn()
  }
}))

const mockUseOutstatic = useOutstatic as jest.Mock
const mockUseCreateCommit = useCreateCommit as jest.Mock
const mockUseGetConfig = useGetConfig as jest.Mock
const mockUseGetMediaFiles = useGetMediaFiles as jest.Mock
const mockUseGetMetadata = useGetMetadata as jest.Mock
const mockUseGetSingletonSchema = useGetSingletonSchema as jest.Mock
const mockUseSingletons = useSingletons as jest.Mock
const mockUseOid = useOid as jest.Mock
const mockMatter = matter as unknown as jest.Mock
const mockToastPromise = toast.promise as jest.Mock
const mockToastError = toast.error as jest.Mock
const mockCreateCommitApi = createCommitApi as jest.Mock
const mockAddReferencedMedia = addReferencedMedia as jest.Mock
const mockBuildMergedContent = buildMergedContent as jest.Mock
const mockCreateMetadataState = createMetadataState as jest.Mock
const mockReplaceConfigFile = replaceConfigFile as jest.Mock
const mockReplaceMediaFile = replaceMediaFile as jest.Mock
const mockSyncCustomFieldTags = syncCustomFieldTags as jest.Mock

describe('useSubmitSingleton', () => {
  const mutateAsyncMock = jest.fn()
  const fetchOidMock = jest.fn()
  const refetchSchemaMock = jest.fn()
  const refetchMetadataMock = jest.fn()
  const refetchMediaMock = jest.fn()
  const refetchConfigMock = jest.fn()
  const refetchSingletonsMock = jest.fn()
  const replaceFileMock = jest.fn()
  const removeFileMock = jest.fn()
  const createInputMock = jest.fn()
  const setSlugMock = jest.fn()
  const setIsNewMock = jest.fn()
  const setShowDeleteMock = jest.fn()
  const setLoadingMock = jest.fn()
  const setCustomFieldsMock = jest.fn()
  const setHasChangesMock = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()

    mockUseOutstatic.mockReturnValue({
      repoOwner: 'acme',
      repoSlug: 'site',
      repoBranch: 'main',
      monorepoPath: '',
      ostContent: 'outstatic/content',
      basePath: '',
      publicMediaPath: 'public/images',
      repoMediaPath: 'outstatic/public/images',
      mediaJsonPath: 'outstatic/content/media.json',
      configJsonPath: 'outstatic/content/config.json'
    })

    mockUseCreateCommit.mockReturnValue({
      mutateAsync: mutateAsyncMock
    })
    mockUseGetConfig.mockReturnValue({
      refetch: refetchConfigMock
    })
    mockUseGetMediaFiles.mockReturnValue({
      refetch: refetchMediaMock
    })
    mockUseGetMetadata.mockReturnValue({
      refetch: refetchMetadataMock
    })
    mockUseGetSingletonSchema.mockReturnValue({
      refetch: refetchSchemaMock
    })
    mockUseSingletons.mockReturnValue({
      refetch: refetchSingletonsMock
    })
    mockUseOid.mockReturnValue(fetchOidMock)
    mockCreateCommitApi.mockReturnValue({
      replaceFile: replaceFileMock,
      removeFile: removeFileMock,
      createInput: createInputMock
    })

    mockBuildMergedContent.mockReturnValue('content-body')
    mockAddReferencedMedia.mockReturnValue({
      content: 'content-body',
      media: []
    })
    mockMatter.mockReturnValue({
      data: {
        title: 'About Us',
        status: 'published'
      }
    })
    mockSyncCustomFieldTags.mockReturnValue({
      customFields: {},
      hasNewTag: false
    })
    mockCreateMetadataState.mockReturnValue({
      metadata: [
        {
          collection: '_singletons',
          slug: 'about'
        },
        {
          collection: 'posts',
          slug: 'hello-world'
        }
      ],
      commit: 'commit-123'
    })
    mockReplaceMediaFile.mockResolvedValue(undefined)
    mockReplaceConfigFile.mockResolvedValue(undefined)
    fetchOidMock.mockResolvedValue('oid-123')
    refetchSchemaMock.mockResolvedValue({
      data: {
        title: 'About',
        type: 'object',
        properties: {}
      },
      isError: false
    })
    refetchMetadataMock.mockResolvedValue({
      data: {
        metadata: [],
        commitUrl: 'https://github.com/acme/site/commit/123'
      },
      isError: false
    })
    refetchSingletonsMock.mockResolvedValue({
      data: [
        {
          title: 'About',
          slug: 'about',
          directory: 'outstatic/content/_singletons',
          path: 'outstatic/content/_singletons/about.md',
          publishedAt: '2026-01-01T00:00:00.000Z',
          status: 'draft'
        }
      ]
    })
    createInputMock.mockReturnValue({ payload: 'commit-input' })
    mutateAsyncMock.mockResolvedValue({})
    mockToastPromise.mockImplementation(
      async (
        promise: Promise<unknown>,
        handlers?: {
          success?: (() => string) | string
        }
      ) => {
        const result = await promise
        if (typeof handlers?.success === 'function') {
          handlers.success()
        }
        return result
      }
    )
  })

  it('updates singletons.json and renames files when an existing singleton changes slug', async () => {
    const editor = {} as any

    const { result } = renderHook(() =>
      useSubmitSingleton({
        session: {
          user: {
            login: 'acme'
          }
        } as any,
        slug: 'about',
        setSlug: setSlugMock,
        isNew: false,
        setIsNew: setIsNewMock,
        setShowDelete: setShowDeleteMock,
        setLoading: setLoadingMock,
        files: [],
        customFields: {},
        setCustomFields: setCustomFieldsMock,
        setHasChanges: setHasChangesMock,
        editor,
        extension: 'md',
        documentMetadata: {},
        path: 'outstatic/content/_singletons'
      })
    )

    await act(async () => {
      await result.current({
        title: 'About Us',
        slug: 'about-us',
        status: 'published',
        publishedAt: new Date('2026-02-01T00:00:00.000Z')
      } as any)
    })

    expect(removeFileMock).toHaveBeenCalledWith(
      'outstatic/content/_singletons/about.md'
    )
    expect(removeFileMock).toHaveBeenCalledWith(
      'outstatic/content/_singletons/about.schema.json'
    )
    expect(replaceFileMock).toHaveBeenCalledWith(
      'outstatic/content/_singletons/about-us.md',
      'content-body'
    )
    expect(replaceFileMock).toHaveBeenCalledWith(
      'outstatic/content/_singletons/about-us.schema.json',
      JSON.stringify(
        {
          title: 'About',
          type: 'object',
          properties: {}
        },
        null,
        2
      ) + '\n'
    )
    expect(replaceFileMock).toHaveBeenCalledWith(
      'outstatic/content/singletons.json',
      JSON.stringify(
        [
          {
            title: 'About Us',
            slug: 'about-us',
            directory: 'outstatic/content/_singletons',
            path: 'outstatic/content/_singletons/about-us.md',
            publishedAt: '2026-02-01T00:00:00.000Z',
            status: 'published'
          }
        ],
        null,
        2
      ) + '\n'
    )
    expect(mutateAsyncMock).toHaveBeenCalledWith({ payload: 'commit-input' })
    expect(setSlugMock).toHaveBeenCalledWith('about-us')
    expect(setHasChangesMock).toHaveBeenCalledWith(false)
    expect(refetchSingletonsMock).toHaveBeenCalledTimes(2)
  })

  it('creates a new singleton and appends it to singletons.json', async () => {
    const editor = {} as any

    const { result } = renderHook(() =>
      useSubmitSingleton({
        session: {
          user: {
            login: 'acme'
          }
        } as any,
        slug: 'new',
        setSlug: setSlugMock,
        isNew: true,
        setIsNew: setIsNewMock,
        setShowDelete: setShowDeleteMock,
        setLoading: setLoadingMock,
        files: [],
        customFields: {},
        setCustomFields: setCustomFieldsMock,
        setHasChanges: setHasChangesMock,
        editor,
        extension: 'md',
        documentMetadata: {}
      })
    )

    await act(async () => {
      await result.current({
        title: 'Home Page',
        slug: 'home-page',
        status: 'published',
        publishedAt: new Date('2026-02-01T00:00:00.000Z')
      } as any)
    })

    expect(refetchSchemaMock).not.toHaveBeenCalled()
    expect(replaceFileMock).toHaveBeenCalledWith(
      'outstatic/content/_singletons/home-page.schema.json',
      JSON.stringify(
        {
          title: 'Home Page',
          type: 'object',
          properties: {}
        },
        null,
        2
      ) + '\n'
    )
    expect(replaceFileMock).toHaveBeenCalledWith(
      'outstatic/content/_singletons/home-page.md',
      'content-body'
    )
    expect(replaceFileMock).toHaveBeenCalledWith(
      'outstatic/content/singletons.json',
      JSON.stringify(
        [
          {
            title: 'About',
            slug: 'about',
            directory: 'outstatic/content/_singletons',
            path: 'outstatic/content/_singletons/about.md',
            publishedAt: '2026-01-01T00:00:00.000Z',
            status: 'draft'
          },
          {
            title: 'Home Page',
            slug: 'home-page',
            directory: 'outstatic/content/_singletons',
            path: 'outstatic/content/_singletons/home-page.md',
            publishedAt: '2026-02-01T00:00:00.000Z',
            status: 'published'
          }
        ],
        null,
        2
      ) + '\n'
    )
    expect(removeFileMock).not.toHaveBeenCalled()
    expect(setSlugMock).toHaveBeenCalledWith('home-page')
    expect(setHasChangesMock).toHaveBeenCalledWith(false)
  })

  it('does not remove existing files when saving without a slug change', async () => {
    const editor = {} as any

    const { result } = renderHook(() =>
      useSubmitSingleton({
        session: {
          user: {
            login: 'acme'
          }
        } as any,
        slug: 'about',
        setSlug: setSlugMock,
        isNew: false,
        setIsNew: setIsNewMock,
        setShowDelete: setShowDeleteMock,
        setLoading: setLoadingMock,
        files: [],
        customFields: {},
        setCustomFields: setCustomFieldsMock,
        setHasChanges: setHasChangesMock,
        editor,
        extension: 'md',
        documentMetadata: {},
        path: 'outstatic/content/_singletons'
      })
    )

    await act(async () => {
      await result.current({
        title: 'About Us',
        slug: 'about',
        status: 'published',
        publishedAt: new Date('2026-02-01T00:00:00.000Z')
      } as any)
    })

    expect(removeFileMock).not.toHaveBeenCalled()
    expect(setSlugMock).not.toHaveBeenCalled()
    expect(setHasChangesMock).toHaveBeenCalledWith(false)
  })

  it('shows an error and exits early when the slug already exists', async () => {
    const editor = {} as any
    refetchSingletonsMock.mockResolvedValue({
      data: [
        {
          title: 'About',
          slug: 'about',
          directory: 'outstatic/content/_singletons',
          path: 'outstatic/content/_singletons/about.md',
          publishedAt: '2026-01-01T00:00:00.000Z',
          status: 'draft'
        },
        {
          title: 'Contact',
          slug: 'contact',
          directory: 'outstatic/content/_singletons',
          path: 'outstatic/content/_singletons/contact.md',
          publishedAt: '2026-01-02T00:00:00.000Z',
          status: 'published'
        }
      ]
    })

    const { result } = renderHook(() =>
      useSubmitSingleton({
        session: {
          user: {
            login: 'acme'
          }
        } as any,
        slug: 'about',
        setSlug: setSlugMock,
        isNew: false,
        setIsNew: setIsNewMock,
        setShowDelete: setShowDeleteMock,
        setLoading: setLoadingMock,
        files: [],
        customFields: {},
        setCustomFields: setCustomFieldsMock,
        setHasChanges: setHasChangesMock,
        editor,
        extension: 'md',
        documentMetadata: {},
        path: 'outstatic/content/_singletons'
      })
    )

    await act(async () => {
      await result.current({
        title: 'Contact',
        slug: 'contact',
        status: 'published',
        publishedAt: new Date('2026-02-01T00:00:00.000Z')
      } as any)
    })

    expect(mockToastError).toHaveBeenCalledWith(
      'A singleton with slug "contact" already exists.'
    )
    expect(refetchSchemaMock).not.toHaveBeenCalled()
    expect(replaceFileMock).not.toHaveBeenCalled()
    expect(mutateAsyncMock).not.toHaveBeenCalled()
    expect(setLoadingMock).toHaveBeenNthCalledWith(1, true)
    expect(setLoadingMock).toHaveBeenNthCalledWith(2, false)
  })

  it('resets loading and skips success side effects when commit creation fails', async () => {
    const editor = {} as any
    const error = new Error('commit failed')
    mutateAsyncMock.mockRejectedValue(error)
    const consoleSpy = jest
      .spyOn(console, 'log')
      .mockImplementation(() => undefined)

    const { result } = renderHook(() =>
      useSubmitSingleton({
        session: {
          user: {
            login: 'acme'
          }
        } as any,
        slug: 'about',
        setSlug: setSlugMock,
        isNew: false,
        setIsNew: setIsNewMock,
        setShowDelete: setShowDeleteMock,
        setLoading: setLoadingMock,
        files: [],
        customFields: {},
        setCustomFields: setCustomFieldsMock,
        setHasChanges: setHasChangesMock,
        editor,
        extension: 'md',
        documentMetadata: {},
        path: 'outstatic/content/_singletons'
      })
    )

    await act(async () => {
      await result.current({
        title: 'About Us',
        slug: 'about-us',
        status: 'published',
        publishedAt: new Date('2026-02-01T00:00:00.000Z')
      } as any)
    })

    expect(setLoadingMock).toHaveBeenCalledWith(false)
    expect(setHasChangesMock).not.toHaveBeenCalled()
    expect(setShowDeleteMock).not.toHaveBeenCalled()
    expect(setIsNewMock).not.toHaveBeenCalled()
    expect(consoleSpy).toHaveBeenCalledWith({ error })

    consoleSpy.mockRestore()
  })

  describe('commit message', () => {
    const renderSubmit = (
      overrides: {
        slug?: string
        isNew?: boolean
        documentMetadata?: Record<string, any>
      } = {}
    ) =>
      renderHook(() =>
        useSubmitSingleton({
          session: { user: { login: 'acme' } } as any,
          slug: overrides.slug ?? 'about',
          setSlug: setSlugMock,
          isNew: overrides.isNew ?? false,
          setIsNew: setIsNewMock,
          setShowDelete: setShowDeleteMock,
          setLoading: setLoadingMock,
          files: [],
          customFields: {},
          setCustomFields: setCustomFieldsMock,
          setHasChanges: setHasChangesMock,
          editor: {} as any,
          extension: 'md',
          documentMetadata: overrides.documentMetadata ?? {},
          path: 'outstatic/content/_singletons'
        })
      )

    const getCommitMessage = () =>
      mockCreateCommitApi.mock.calls[0][0].message as string

    it('emits a publish message when transitioning from draft to published', async () => {
      const { result } = renderSubmit({
        documentMetadata: { status: 'draft' }
      })

      await act(async () => {
        await result.current({
          title: 'About Us',
          slug: 'about',
          status: 'published',
          publishedAt: new Date('2026-02-01T00:00:00.000Z')
        } as any)
      })

      expect(getCommitMessage()).toBe(
        'publish "About Us" [outstatic:content]'
      )
    })

    it('emits an unpublish message when transitioning from published to draft', async () => {
      const { result } = renderSubmit({
        documentMetadata: { status: 'published' }
      })

      await act(async () => {
        await result.current({
          title: 'About Us',
          slug: 'about',
          status: 'draft',
          publishedAt: new Date('2026-02-01T00:00:00.000Z')
        } as any)
      })

      expect(getCommitMessage()).toBe(
        'unpublish "About Us" [outstatic:content]'
      )
    })

    it('emits a create message with the next status when isNew is true', async () => {
      const { result } = renderSubmit({
        slug: 'new',
        isNew: true,
        documentMetadata: {}
      })

      await act(async () => {
        await result.current({
          title: 'Home Page',
          slug: 'home-page',
          status: 'published',
          publishedAt: new Date('2026-02-01T00:00:00.000Z')
        } as any)
      })

      expect(getCommitMessage()).toBe(
        'create published "Home Page" [outstatic:content]'
      )
    })

    it('emits an update message with a rename note when the slug changes on a published singleton', async () => {
      const { result } = renderSubmit({
        documentMetadata: { status: 'published' }
      })

      await act(async () => {
        await result.current({
          title: 'About Us',
          slug: 'about-us',
          status: 'published',
          publishedAt: new Date('2026-02-01T00:00:00.000Z')
        } as any)
      })

      expect(getCommitMessage()).toBe(
        'update published "About Us" (renamed from about) [outstatic:content]'
      )
    })

    it('emits an update message without a rename note when the slug is unchanged', async () => {
      const { result } = renderSubmit({
        documentMetadata: { status: 'published' }
      })

      await act(async () => {
        await result.current({
          title: 'About',
          slug: 'about',
          status: 'published',
          publishedAt: new Date('2026-02-01T00:00:00.000Z')
        } as any)
      })

      expect(getCommitMessage()).toBe(
        'update published "About" [outstatic:content]'
      )
    })
  })
})

describe('buildUpdatedSingletonsIndex', () => {
  it('appends a new singleton entry when creating a singleton', () => {
    expect(
      buildUpdatedSingletonsIndex({
        singletons: [
          {
            title: 'About',
            slug: 'about',
            directory: 'outstatic/content/_singletons',
            path: 'outstatic/content/_singletons/about.md'
          }
        ],
        isNew: true,
        oldSlug: 'new',
        nextEntry: {
          title: 'Home',
          slug: 'home',
          directory: 'outstatic/content/_singletons',
          path: 'outstatic/content/_singletons/home.md'
        }
      })
    ).toEqual([
      {
        title: 'About',
        slug: 'about',
        directory: 'outstatic/content/_singletons',
        path: 'outstatic/content/_singletons/about.md'
      },
      {
        title: 'Home',
        slug: 'home',
        directory: 'outstatic/content/_singletons',
        path: 'outstatic/content/_singletons/home.md'
      }
    ])
  })
})

describe('stageSingletonRename', () => {
  it('removes the existing content and schema when the slug changes', () => {
    const capi = {
      removeFile: jest.fn()
    } as any

    stageSingletonRename({
      capi,
      oldContentPath: 'outstatic/content/_singletons/about.md',
      oldSchemaPath: 'outstatic/content/_singletons/about.schema.json',
      didSlugChange: true
    })

    expect(capi.removeFile).toHaveBeenCalledWith(
      'outstatic/content/_singletons/about.md'
    )
    expect(capi.removeFile).toHaveBeenCalledWith(
      'outstatic/content/_singletons/about.schema.json'
    )
  })

  it('does nothing when the slug stays the same', () => {
    const capi = {
      removeFile: jest.fn()
    } as any

    stageSingletonRename({
      capi,
      oldContentPath: 'outstatic/content/_singletons/about.md',
      oldSchemaPath: 'outstatic/content/_singletons/about.schema.json',
      didSlugChange: false
    })

    expect(capi.removeFile).not.toHaveBeenCalled()
  })
})
