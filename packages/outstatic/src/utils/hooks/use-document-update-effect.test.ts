import { Document } from '@/types'
import { useDocumentUpdateEffect } from './use-document-update-effect'
import { useCollections } from './use-collections'
import { useGetDocument } from './use-get-document'
import { useOutstatic } from './use-outstatic'
import { renderHook } from '@testing-library/react'
import { UseFormReturn } from 'react-hook-form'
import matter from 'gray-matter'
import { parseContent } from '@/utils/parse-content'

jest.mock('gray-matter', () => jest.fn())
jest.mock('@/utils/parse-content', () => ({
  parseContent: jest.fn()
}))

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
const mockMatter = matter as jest.Mock
const mockParseContent = parseContent as jest.Mock

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

    mockMatter.mockImplementation((mdDocument: string) => ({
      data: {
        title: mdDocument,
        publishedAt: '2024-01-01T00:00:00.000Z'
      },
      content: `${mdDocument}-content`
    }))

    mockParseContent.mockImplementation(({ content }) => `parsed:${content}`)
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

  it('re-parses and applies a new document when slug changes without unmounting', async () => {
    const methods = createMethods()
    const editor = {
      commands: {
        setContent: jest.fn(),
        focus: jest.fn()
      }
    }

    mockUseCollections.mockReturnValue({
      data: [
        {
          title: 'Posts',
          slug: 'posts',
          path: 'outstatic/content/posts',
          children: []
        }
      ]
    })

    mockUseGetDocument.mockImplementation(
      ({ filePath }: { filePath: string; enabled: boolean }) => ({
        data:
          filePath === 'outstatic/content/posts/first-post'
            ? {
                mdDocument: 'first-doc',
                extension: 'md'
              }
            : {
                mdDocument: 'second-doc',
                extension: 'md'
              }
      })
    )

    const props = {
      ...createProps(),
      methods,
      editor: editor as any,
      slug: 'first-post'
    }

    const { rerender } = renderHook(
      ({ currentProps }) => useDocumentUpdateEffect(currentProps),
      {
        initialProps: { currentProps: props }
      }
    )

    await Promise.resolve()

    expect(mockMatter).toHaveBeenNthCalledWith(1, 'first-doc')
    expect(mockParseContent).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ content: 'first-doc-content' })
    )
    expect(methods.reset).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        slug: 'first-post',
        content: 'parsed:first-doc-content'
      })
    )
    expect(editor.commands.setContent).toHaveBeenNthCalledWith(
      1,
      'parsed:first-doc-content'
    )

    rerender({
      currentProps: {
        ...props,
        slug: 'second-post'
      }
    })

    await Promise.resolve()

    expect(mockMatter).toHaveBeenNthCalledWith(2, 'second-doc')
    expect(mockParseContent).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ content: 'second-doc-content' })
    )
    expect(methods.reset).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        slug: 'second-post',
        content: 'parsed:second-doc-content'
      })
    )
    expect(editor.commands.setContent).toHaveBeenNthCalledWith(
      2,
      'parsed:second-doc-content'
    )
  })
})
