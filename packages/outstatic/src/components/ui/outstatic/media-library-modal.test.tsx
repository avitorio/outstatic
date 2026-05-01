import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MediaLibraryModal from './media-library-modal'
import { useGetMediaFiles } from '@/utils/hooks/use-get-media-files'
import { useMediaLibraryUpload } from '@/utils/hooks/use-media-library-upload'
import { useOutstatic } from '@/utils/hooks/use-outstatic'

jest.mock('@/utils/hooks/use-outstatic')
jest.mock('@/utils/hooks/use-get-media-files')
jest.mock('@/utils/hooks/use-media-library-upload')
jest.mock('@/client/pages/settings/_components/media-settings', () => ({
  MediaSettings: () => <div data-testid="media-settings" />
}))
jest.mock('@/components/delete-media-button', () => ({
  DeleteMediaButton: () => null
}))
jest.mock('@/components/ui/shadcn/dialog', () => ({
  Dialog: ({ open, children }: any) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>
}))
jest.mock('@/components/ui/outstatic/media-library-dropzone', () => ({
  MediaLibraryDropzone: ({ children }: any) => (
    <div data-testid="media-library-dropzone">{children}</div>
  )
}))
jest.mock('@/components/ui/outstatic/media-library-header', () => ({
  MediaLibraryHeader: ({
    mediaSources = [],
    selectedSourceName = '',
    setSelectedSourceName
  }: any) => (
    <select
      aria-label="Image source"
      value={selectedSourceName}
      onChange={(event) => setSelectedSourceName?.(event.currentTarget.value)}
    >
      {mediaSources.map((source: any) => (
        <option key={source.name} value={source.name}>
          {source.label}
        </option>
      ))}
    </select>
  )
}))

const mockUseOutstatic = useOutstatic as jest.Mock
const mockUseGetMediaFiles = useGetMediaFiles as jest.Mock
const mockUseMediaLibraryUpload = useMediaLibraryUpload as jest.Mock

const imageSources = [
  {
    name: 'images',
    label: 'Images',
    input: 'public/images',
    output: '/images',
    categories: ['image']
  },
  {
    name: 'avatars',
    label: 'Avatars',
    input: 'public/avatars',
    output: '/avatars',
    categories: ['image']
  }
]

const mediaData = {
  media: {
    generated: '2024-01-01T00:00:00.000Z',
    media: [
      {
        filename: 'hero.png',
        alt: 'Hero image',
        type: 'image',
        source: 'images',
        publishedAt: '2024-01-01T00:00:00.000Z',
        __outstatic: {
          path: 'public/images/hero.png'
        }
      },
      {
        filename: 'avatar.png',
        alt: 'Avatar image',
        type: 'image',
        source: 'avatars',
        publishedAt: '2024-01-02T00:00:00.000Z',
        __outstatic: {
          path: 'public/avatars/avatar.png'
        }
      }
    ]
  }
}

describe('<MediaLibraryModal />', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseOutstatic.mockReturnValue({
      basePath: '/outstatic',
      media: imageSources,
      repoOwner: 'owner',
      repoSlug: 'repo',
      repoBranch: 'canary'
    })
    mockUseGetMediaFiles.mockReturnValue({
      data: mediaData,
      isLoading: false,
      refetch: jest.fn()
    })
    mockUseMediaLibraryUpload.mockReturnValue({
      handleFileUpload: jest.fn(),
      isUploading: false
    })
  })

  it('defaults to the first image source and clears the selected image when the source changes', async () => {
    const user = userEvent.setup()
    const onSelect = jest.fn()
    const onOpenChange = jest.fn()

    render(
      <MediaLibraryModal open onOpenChange={onOpenChange} onSelect={onSelect} />
    )

    const sourceSelect = screen.getByLabelText('Image source')
    const selectButton = screen.getByRole('button', { name: 'Select' })

    expect(sourceSelect).toHaveValue('images')
    expect(screen.getByText('hero.png')).toBeInTheDocument()
    expect(screen.queryByText('avatar.png')).not.toBeInTheDocument()

    await user.click(screen.getByText('hero.png'))

    expect(selectButton).toBeEnabled()

    await user.selectOptions(sourceSelect, 'avatars')

    expect(sourceSelect).toHaveValue('avatars')
    expect(screen.queryByText('hero.png')).not.toBeInTheDocument()
    expect(screen.getByText('avatar.png')).toBeInTheDocument()
    expect(selectButton).toBeDisabled()

    await user.click(screen.getByText('avatar.png'))
    await user.click(selectButton)

    expect(onSelect).toHaveBeenCalledWith(
      '/outstatic/api/outstatic/media/owner/repo/canary/public/avatars/avatar.png'
    )
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
