import { render, screen } from '@testing-library/react'
import MediaLibrary from './media-library'
import { useGetMediaFiles } from '@/utils/hooks/use-get-media-files'
import { useMediaLibraryUpload } from '@/utils/hooks/use-media-library-upload'
import { useOutstatic } from '@/utils/hooks/use-outstatic'

jest.mock('@/utils/hooks/use-outstatic')
jest.mock('@/utils/hooks/use-get-media-files')
jest.mock('@/utils/hooks/use-media-library-upload')
jest.mock('@/utils/hooks/use-create-commit', () => ({
  useCreateCommit: () => ({
    mutateAsync: jest.fn()
  })
}))
jest.mock('@/utils/hooks/use-oid', () => jest.fn(() => jest.fn()))
jest.mock('@/components/admin-layout', () => ({
  AdminLayout: ({
    children,
    title
  }: {
    children: React.ReactNode
    title?: string
  }) => (
    <div data-testid="admin-layout" data-title={title}>
      {children}
    </div>
  )
}))
jest.mock('@/client/pages/settings/_components/media-settings', () => ({
  MediaSettings: () => <div data-testid="media-settings" />
}))
jest.mock('@/components/ui/outstatic/media-settings-dialog', () => ({
  MediaSettingsDialog: () => null
}))
jest.mock('@/components/ui/outstatic/media-library-dropzone', () => ({
  MediaLibraryDropzone: ({
    children
  }: {
    children: React.ReactNode
  }) => <div data-testid="media-library-dropzone">{children}</div>
}))
jest.mock('@/components/ui/outstatic/media-library-header', () => ({
  ALL_MEDIA_SOURCE_VALUE: '__all_media__',
  MediaLibraryHeader: () => <div data-testid="media-library-header" />
}))

const mockUseOutstatic = useOutstatic as jest.Mock
const mockUseGetMediaFiles = useGetMediaFiles as jest.Mock
const mockUseMediaLibraryUpload = useMediaLibraryUpload as jest.Mock

const baseOutstaticConfig = {
  basePath: '/outstatic',
  media: undefined,
  repoOwner: 'andre',
  repoSlug: 'outstatic',
  repoBranch: 'canary'
}

const mockMediaData = {
  media: {
    generated: '2024-01-01T00:00:00.000Z',
    media: [
      {
        filename: 'hero.png',
        alt: 'Hero image',
        type: 'image',
        publishedAt: '2024-01-01T00:00:00.000Z',
        __outstatic: {
          path: 'public/uploads/hero.png'
        }
      }
    ]
  },
  commitUrl: 'https://github.com/andre/outstatic/commit/123'
}

describe('MediaLibrary', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseOutstatic.mockReturnValue(baseOutstaticConfig)
    mockUseGetMediaFiles.mockReturnValue({
      data: null,
      isLoading: false,
      refetch: jest.fn()
    })
    mockUseMediaLibraryUpload.mockReturnValue({
      handleFileUpload: jest.fn(),
      isUploading: false
    })
  })

  it('renders without crashing when media is undefined', () => {
    render(<MediaLibrary />)

    expect(screen.getByTestId('admin-layout')).toHaveAttribute(
      'data-title',
      'Media Library'
    )
    expect(screen.getByTestId('media-library-header')).toBeInTheDocument()
    expect(screen.getByTestId('media-settings')).toBeInTheDocument()
    expect(
      screen.queryByTestId('media-library-dropzone')
    ).not.toBeInTheDocument()
  })

  it('only renders the source label when more than one media source is configured', () => {
    mockUseGetMediaFiles.mockReturnValue({
      data: mockMediaData,
      isLoading: false,
      refetch: jest.fn()
    })

    mockUseOutstatic.mockReturnValue({
      ...baseOutstaticConfig,
      media: [
        {
          name: 'images',
          label: 'Images',
          input: 'public/uploads',
          output: '/uploads'
        }
      ]
    })

    const { rerender } = render(<MediaLibrary />)

    expect(screen.getByText('hero.png')).toBeInTheDocument()
    expect(screen.queryByText('Images')).not.toBeInTheDocument()

    mockUseOutstatic.mockReturnValue({
      ...baseOutstaticConfig,
      media: [
        {
          name: 'images',
          label: 'Images',
          input: 'public/uploads',
          output: '/uploads'
        },
        {
          name: 'docs',
          label: 'Documents',
          input: 'public/documents',
          output: '/documents'
        }
      ]
    })

    rerender(<MediaLibrary />)

    expect(screen.getByText('Images')).toBeInTheDocument()
  })
})
