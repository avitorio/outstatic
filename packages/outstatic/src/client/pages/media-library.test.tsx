import {
  fireEvent,
  render,
  screen,
  waitFor,
  within
} from '@testing-library/react'
import { decode as fromBase64 } from 'js-base64'
import MediaLibrary from './media-library'
import { useGetMediaFiles } from '@/utils/hooks/use-get-media-files'
import { useMediaLibraryUpload } from '@/utils/hooks/use-media-library-upload'
import { useOutstatic } from '@/utils/hooks/use-outstatic'

const mockMutateAsync = jest.fn()
const mockFetchOid = jest.fn()
const mockToastInfo = jest.fn()
const mockToastPromise = jest.fn(
  (promise: Promise<unknown>, _options?: unknown) => promise
)

jest.mock('@/utils/hooks/use-outstatic')
jest.mock('@/utils/hooks/use-get-media-files')
jest.mock('@/utils/hooks/use-media-library-upload')
jest.mock('@/utils/hooks/use-create-commit', () => ({
  useCreateCommit: () => ({
    mutateAsync: mockMutateAsync
  })
}))
jest.mock('@/utils/hooks/use-oid', () => jest.fn(() => mockFetchOid))
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    info: (message: string) => mockToastInfo(message),
    promise: (promise: Promise<unknown>, options: unknown) =>
      mockToastPromise(promise, options),
    success: jest.fn()
  }
}))
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
  MediaLibraryDropzone: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="media-library-dropzone">{children}</div>
  )
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
  repoBranch: 'canary',
  mediaJsonPath: 'outstatic/media/media.json'
}

const mockMediaData = {
  media: {
    commit: 'abc123',
    generated: '2024-01-01T00:00:00.000Z',
    media: [
      {
        filename: 'logo.png',
        alt: 'Logo',
        type: 'image',
        publishedAt: '2024-01-04T00:00:00.000Z',
        __outstatic: {
          hash: 'logo-hash',
          path: 'public/uploads/logo.png'
        }
      },
      {
        filename: 'gallery.png',
        alt: 'Gallery image',
        type: 'image',
        publishedAt: '2024-01-03T00:00:00.000Z',
        __outstatic: {
          hash: 'gallery-hash',
          path: 'public/uploads/gallery.png'
        }
      },
      {
        filename: 'hero.png',
        alt: 'Hero image',
        type: 'image',
        publishedAt: '2024-01-01T00:00:00.000Z',
        __outstatic: {
          hash: 'hero-hash',
          path: 'public/uploads/hero.png'
        }
      },
      {
        filename: 'report.pdf',
        alt: 'Quarterly report',
        type: 'document',
        source: 'docs',
        publishedAt: '2024-01-02T00:00:00.000Z',
        __outstatic: {
          hash: 'report-hash',
          path: 'public/documents/report.pdf'
        }
      }
    ]
  },
  commitUrl: 'https://github.com/andre/outstatic/commit/123'
}

const mockMediaDataWithVideo = {
  ...mockMediaData,
  media: {
    ...mockMediaData.media,
    media: [
      {
        filename: 'clip.mp4',
        alt: 'Launch clip',
        type: 'video',
        source: 'videos',
        publishedAt: '2024-01-05T00:00:00.000Z',
        __outstatic: {
          hash: 'clip-hash',
          path: 'public/videos/clip.mp4'
        }
      },
      ...mockMediaData.media.media
    ]
  }
}

describe('MediaLibrary', () => {
  const refetchMedia = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseOutstatic.mockReturnValue(baseOutstaticConfig)
    mockMutateAsync.mockResolvedValue({})
    mockFetchOid.mockResolvedValue('oid-123')
    mockToastPromise.mockImplementation((promise) => promise)
    refetchMedia.mockResolvedValue({ data: mockMediaData })
    mockUseGetMediaFiles.mockReturnValue({
      data: null,
      isLoading: false,
      refetch: refetchMedia
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
      refetch: refetchMedia
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

    expect(screen.getAllByText('Images')).not.toHaveLength(0)
  })

  it('shows the bulk toolbar after selecting one media item', () => {
    mockUseGetMediaFiles.mockReturnValue({
      data: mockMediaData,
      isLoading: false,
      refetch: refetchMedia
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

    render(<MediaLibrary />)

    fireEvent.click(screen.getByRole('button', { name: 'Select hero.png' }))

    expect(screen.getByText('1 Item Selected')).toBeInTheDocument()
    expect(screen.queryByTestId('media-library-header')).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Deselect hero.png' })
    ).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(mockToastInfo).toHaveBeenCalledWith(
      'Shift-click to select multiple items.'
    )
  })

  it('opens an image preview dialog from the media item click target', () => {
    mockUseGetMediaFiles.mockReturnValue({
      data: mockMediaData,
      isLoading: false,
      refetch: refetchMedia
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

    render(<MediaLibrary />)

    fireEvent.click(screen.getByRole('button', { name: 'Preview hero.png' }))

    const dialog = screen.getByRole('dialog', { name: 'Preview hero.png' })

    expect(
      within(dialog).getByRole('img', { name: 'Hero image' })
    ).toHaveAttribute(
      'src',
      '/outstatic/api/outstatic/media/andre/outstatic/canary/public/uploads/hero.png?v=hero-hash'
    )
    expect(screen.queryByText('1 Item Selected')).not.toBeInTheDocument()
  })

  it('opens a video preview dialog from the media item click target', () => {
    mockUseGetMediaFiles.mockReturnValue({
      data: mockMediaDataWithVideo,
      isLoading: false,
      refetch: refetchMedia
    })
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
          name: 'videos',
          label: 'Videos',
          input: 'public/videos',
          output: '/videos'
        }
      ]
    })

    render(<MediaLibrary />)

    fireEvent.click(screen.getByRole('button', { name: 'Preview clip.mp4' }))

    const dialog = screen.getByRole('dialog', { name: 'Preview clip.mp4' })
    const video = within(dialog).getByLabelText('Preview clip.mp4')

    expect(video.tagName.toLowerCase()).toBe('video')
    expect(video).toHaveAttribute('controls')
    expect(video).toHaveAttribute(
      'src',
      '/outstatic/api/outstatic/media/andre/outstatic/canary/public/videos/clip.mp4?v=clip-hash'
    )
  })

  it('updates the bulk toolbar count when selecting multiple media items', () => {
    mockUseGetMediaFiles.mockReturnValue({
      data: mockMediaData,
      isLoading: false,
      refetch: refetchMedia
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

    render(<MediaLibrary />)

    fireEvent.click(screen.getByRole('button', { name: 'Select hero.png' }))
    fireEvent.click(screen.getByRole('button', { name: 'Select report.pdf' }))

    expect(screen.getByText('2 Items Selected')).toBeInTheDocument()
  })

  it('previews and selects a visible range while shift is held', () => {
    mockUseGetMediaFiles.mockReturnValue({
      data: mockMediaData,
      isLoading: false,
      refetch: refetchMedia
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

    render(<MediaLibrary />)

    fireEvent.click(screen.getByRole('button', { name: 'Select logo.png' }))
    fireEvent.keyDown(window, { key: 'Shift' })
    fireEvent.mouseEnter(screen.getByTestId('media-card-hero.png'), {
      shiftKey: true
    })

    expect(screen.getByTestId('media-card-gallery.png')).toHaveAttribute(
      'data-selection-preview',
      'true'
    )
    expect(screen.getByTestId('media-card-report.pdf')).toHaveAttribute(
      'data-selection-preview',
      'true'
    )
    expect(screen.getByTestId('media-card-hero.png')).toHaveAttribute(
      'data-selection-preview',
      'true'
    )

    fireEvent.mouseLeave(screen.getByTestId('media-card-hero.png'), {
      shiftKey: true
    })

    expect(screen.getByTestId('media-card-gallery.png')).toHaveAttribute(
      'data-selection-preview',
      'true'
    )
    expect(screen.getByTestId('media-card-report.pdf')).toHaveAttribute(
      'data-selection-preview',
      'true'
    )
    expect(screen.getByTestId('media-card-hero.png')).toHaveAttribute(
      'data-selection-preview',
      'true'
    )

    fireEvent.click(screen.getByAltText('Hero image'), {
      shiftKey: true
    })

    expect(screen.getByText('4 Items Selected')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Deselect gallery.png' })
    ).toHaveAttribute('aria-pressed', 'true')
    expect(
      screen.getByRole('button', { name: 'Deselect report.pdf' })
    ).toHaveAttribute('aria-pressed', 'true')
    fireEvent.keyUp(window, { key: 'Shift' })
  })

  it('clears selected media from the bulk toolbar action', () => {
    mockUseGetMediaFiles.mockReturnValue({
      data: mockMediaData,
      isLoading: false,
      refetch: refetchMedia
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

    render(<MediaLibrary />)

    fireEvent.click(screen.getByRole('button', { name: 'Select hero.png' }))
    fireEvent.click(
      screen.getByRole('button', { name: 'Clear selected media' })
    )

    expect(screen.queryByText('1 Item Selected')).not.toBeInTheDocument()
    expect(screen.getByTestId('media-library-header')).toBeInTheDocument()
  })

  it('clears selected media when pressing escape', () => {
    mockUseGetMediaFiles.mockReturnValue({
      data: mockMediaData,
      isLoading: false,
      refetch: refetchMedia
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

    render(<MediaLibrary />)

    fireEvent.click(screen.getByRole('button', { name: 'Select hero.png' }))
    fireEvent.click(screen.getByRole('button', { name: 'Select report.pdf' }))
    fireEvent.keyDown(window, { key: 'Escape' })

    expect(screen.queryByText('2 Items Selected')).not.toBeInTheDocument()
    expect(screen.getByTestId('media-library-header')).toBeInTheDocument()
  })

  it('opens a confirmation dialog from the bulk delete action', () => {
    mockUseGetMediaFiles.mockReturnValue({
      data: mockMediaData,
      isLoading: false,
      refetch: refetchMedia
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

    render(<MediaLibrary />)

    fireEvent.click(screen.getByRole('button', { name: 'Select hero.png' }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete Items' }))

    expect(screen.getByText('Delete Media Items')).toBeInTheDocument()
    expect(
      screen.getByText(/delete 1 selected media item/i)
    ).toBeInTheDocument()
  })

  it('submits one commit for bulk media deletion', async () => {
    mockUseGetMediaFiles.mockReturnValue({
      data: mockMediaData,
      isLoading: false,
      refetch: refetchMedia
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

    render(<MediaLibrary />)

    fireEvent.click(screen.getByRole('button', { name: 'Select hero.png' }))
    fireEvent.click(screen.getByRole('button', { name: 'Select report.pdf' }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete Items' }))

    const dialog = screen.getByRole('alertdialog')
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Delete Items' })
    )

    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledTimes(1))

    const input = mockMutateAsync.mock.calls[0][0]

    expect(input.message.headline).toBe('chore: remove 2 media files')
    expect(input.fileChanges.deletions).toEqual([
      { path: 'public/uploads/hero.png' },
      { path: 'public/documents/report.pdf' }
    ])
    expect(input.fileChanges.additions).toHaveLength(1)
    expect(input.fileChanges.additions[0].path).toBe(
      'outstatic/media/media.json'
    )

    const nextMedia = JSON.parse(
      fromBase64(input.fileChanges.additions[0].contents)
    )
    expect(
      nextMedia.media.map(
        (mediaFile: { filename: string }) => mediaFile.filename
      )
    ).toEqual(['gallery.png', 'logo.png'])
    expect(mockToastPromise).toHaveBeenCalledWith(
      expect.any(Promise),
      expect.objectContaining({
        loading: 'Deleting 2 media items...',
        success: '2 media items deleted successfully'
      })
    )
  })
})
