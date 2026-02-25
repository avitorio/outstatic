import { Document } from '@/types'
import { useDocumentUpdateEffect } from './use-document-update-effect'
import { useCollections } from './use-collections'
import { useGetDocument } from './use-get-document'
import { useOutstatic } from './use-outstatic'
import { renderHook } from '@testing-library/react'
import { UseFormReturn } from 'react-hook-form'

jest.mock('./use-collections', () => ({
  useCollections: jest.fn()
}))

jest.mock('./use-get-document', () => ({
  useGetDocument: jest.fn()
}))

jest.mock('./use-outstatic', () => ({
  useOutstatic: jest.fn()
}))

const mockUseCollections = useCollections as jest.Mock
const mockUseGetDocument = useGetDocument as jest.Mock
const mockUseOutstatic = useOutstatic as jest.Mock

const createMethods = () =>
  ({
    reset: jest.fn(),
    getValues: jest.fn(() => ({})),
    watch: jest.fn(() => ({
      unsubscribe: jest.fn()
    }))
  }) as unknown as UseFormReturn<Document, any, any>

const createProps = () => ({
  collection: 'posts',
  methods: createMethods(),
  slug: 'shared-slug',
  editor: null,
  setHasChanges: jest.fn(),
  setShowDelete: jest.fn(),
  setExtension: jest.fn(),
  setMetadata: jest.fn()
})

describe('useDocumentUpdateEffect', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockUseOutstatic.mockReturnValue({
      basePath: '',
      repoOwner: 'owner',
      repoSlug: 'repo',
      repoBranch: 'main',
      publicMediaPath: 'public/media',
      repoMediaPath: 'media/'
    })

    mockUseGetDocument.mockReturnValue({
      data: null
    })
  })

  it('keeps document query disabled until collection metadata resolves', () => {
    let collectionsData:
      | {
          title: string
          slug: string
          path: string
          children: []
        }[]
      | undefined

    mockUseCollections.mockImplementation(() => ({
      data: collectionsData
    }))

    const props = createProps()
    const { rerender } = renderHook(() => useDocumentUpdateEffect(props))

    expect(mockUseGetDocument).toHaveBeenCalledTimes(1)
    expect(mockUseGetDocument.mock.calls[0][0]).toEqual({
      filePath: 'shared-slug',
      enabled: false
    })

    collectionsData = [
      {
        title: 'Posts',
        slug: 'posts',
        path: 'outstatic/content/posts',
        children: []
      }
    ]

    rerender()

    expect(mockUseGetDocument).toHaveBeenCalledTimes(2)
    expect(mockUseGetDocument.mock.calls[1][0]).toEqual({
      filePath: 'outstatic/content/posts/shared-slug',
      enabled: true
    })
  })

  it('still enables document query for collections mapped to repo root', () => {
    mockUseCollections.mockReturnValue({
      data: [
        {
          title: 'Posts',
          slug: 'posts',
          path: '',
          children: []
        }
      ]
    })

    const props = createProps()
    renderHook(() => useDocumentUpdateEffect(props))

    expect(mockUseGetDocument).toHaveBeenCalledWith({
      filePath: 'shared-slug',
      enabled: true
    })
  })
})
