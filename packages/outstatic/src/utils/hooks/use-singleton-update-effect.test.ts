import { Document } from '@/types'
import { parseContent } from '@/utils/parse-content'
import { renderHook, waitFor } from '@testing-library/react'
import { Editor } from '@tiptap/react'
import { UseFormReturn } from 'react-hook-form'
import { useGetSingleton } from './use-get-singleton'
import { useOutstatic } from './use-outstatic'
import { useSingletonUpdateEffect } from './use-singleton-update-effect'
import { useSingletons } from './use-singletons'

jest.mock('@/utils/parse-content', () => ({
  parseContent: jest.fn()
}))

jest.mock('./use-get-singleton', () => ({
  useGetSingleton: jest.fn()
}))

jest.mock('./use-outstatic', () => ({
  useOutstatic: jest.fn()
}))

jest.mock('./use-singletons', () => ({
  useSingletons: jest.fn()
}))

const mockParseContent = parseContent as jest.Mock
const mockUseGetSingleton = useGetSingleton as jest.Mock
const mockUseOutstatic = useOutstatic as jest.Mock
const mockUseSingletons = useSingletons as jest.Mock

const createMethods = () =>
  ({
    reset: jest.fn(),
    getValues: jest.fn(() => ({})),
    watch: jest.fn(() => ({
      unsubscribe: jest.fn()
    }))
  }) as unknown as UseFormReturn<Document, any, any>

const createEditor = () =>
  ({
    commands: {
      setContent: jest.fn(),
      focus: jest.fn()
    }
  }) as unknown as Editor

describe('useSingletonUpdateEffect', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockUseOutstatic.mockReturnValue({
      basePath: '',
      repoOwner: 'owner',
      repoSlug: 'repo',
      repoBranch: 'main',
      media: undefined,
      publicMediaPath: 'public/media',
      repoMediaPath: 'media/'
    })

    mockUseSingletons.mockReturnValue({
      data: [
        {
          title: 'Settings',
          slug: 'settings',
          path: 'content/_singletons/settings.md',
          directory: 'content/_singletons',
          publishedAt: '2024-01-01T00:00:00.000Z',
          status: 'published'
        },
        {
          title: 'Home',
          slug: 'home',
          path: 'content/_singletons/home.mdx',
          directory: 'content/site',
          publishedAt: '2024-02-01T00:00:00.000Z',
          status: 'draft'
        }
      ]
    })

    mockUseGetSingleton.mockImplementation(
      ({ slug }: { slug: string; enabled?: boolean }) => {
        if (slug === 'settings') {
          return {
            data: {
              mdDocument:
                '---\ntitle: Settings\npublishedAt: 2024-01-01T00:00:00.000Z\nstatus: published\nhero: old\n---\nFirst body',
              extension: 'md'
            }
          }
        }

        if (slug === 'home') {
          return {
            data: {
              mdDocument:
                '---\ntitle: Home\npublishedAt: 2024-02-02T00:00:00.000Z\nstatus: draft\nhero: new\n---\nSecond body',
              extension: 'mdx'
            }
          }
        }

        return { data: null }
      }
    )

    mockParseContent.mockImplementation(
      ({ content }: { content: string }) => `parsed:${content}`
    )
  })

  it('re-parses and reapplies singleton state when slug changes in place', async () => {
    const methods = createMethods()
    const editor = createEditor()
    const setHasChanges = jest.fn()
    const setShowDelete = jest.fn()
    const setExtension = jest.fn()
    const setMetadata = jest.fn()
    const setSingletonContentPath = jest.fn()

    const { rerender } = renderHook(
      ({ slug }) =>
        useSingletonUpdateEffect({
          slug,
          methods,
          editor,
          setHasChanges,
          setShowDelete,
          setExtension,
          setMetadata,
          setSingletonContentPath
        }),
      {
        initialProps: { slug: 'settings' }
      }
    )

    await waitFor(() => {
      expect(methods.reset).toHaveBeenCalledWith({
        title: 'Settings',
        publishedAt: new Date('2024-01-01T00:00:00.000Z'),
        status: 'published',
        hero: 'old',
        content: 'parsed:First body',
        slug: 'settings'
      })
    })

    expect(setMetadata).toHaveBeenCalledWith({
      title: 'Settings',
      publishedAt: '2024-01-01T00:00:00.000Z',
      status: 'published',
      hero: 'old'
    })
    expect(setSingletonContentPath).toHaveBeenCalledWith('content/_singletons')
    expect(editor.commands.setContent).toHaveBeenCalledWith('parsed:First body')
    expect(setShowDelete).toHaveBeenCalledWith(true)
    expect(setExtension).toHaveBeenCalledWith('md')
    expect(setHasChanges).toHaveBeenCalledWith(false)

    rerender({ slug: 'home' })

    await waitFor(() => {
      expect(methods.reset).toHaveBeenLastCalledWith({
        title: 'Home',
        publishedAt: new Date('2024-02-02T00:00:00.000Z'),
        status: 'draft',
        hero: 'new',
        content: 'parsed:Second body',
        slug: 'home'
      })
    })

    expect(setMetadata).toHaveBeenLastCalledWith({
      title: 'Home',
      publishedAt: '2024-02-02T00:00:00.000Z',
      status: 'draft',
      hero: 'new'
    })
    expect(setSingletonContentPath).toHaveBeenLastCalledWith('content/site')
    expect(editor.commands.setContent).toHaveBeenLastCalledWith(
      'parsed:Second body'
    )
    expect(setExtension).toHaveBeenLastCalledWith('mdx')
    expect(setShowDelete).toHaveBeenCalledTimes(2)
    expect(setHasChanges).toHaveBeenCalledTimes(2)
    expect(mockParseContent).toHaveBeenCalledTimes(2)
  })
})
