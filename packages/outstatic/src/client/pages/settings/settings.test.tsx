import { fireEvent, render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import Settings from './settings'

const mockUpdateConfig = jest.fn()
const mockUseCollections = jest.fn()
const mockUseRebuildMetadata = jest.fn()
const mockUseGetConfig = jest.fn()

jest.mock('@/utils/hooks/use-collections', () => ({
  useCollections: () => mockUseCollections()
}))

jest.mock('@/utils/hooks/use-rebuild-metadata', () => ({
  useRebuildMetadata: () => mockUseRebuildMetadata()
}))

jest.mock('@/utils/hooks/use-get-config', () => ({
  useGetConfig: () => mockUseGetConfig()
}))
jest.mock('@/utils/hooks/use-update-config', () => ({
  useUpdateConfig: () => mockUpdateConfig
}))

jest.mock('@/components/admin-layout', () => ({
  AdminLayout: ({ children, title }: { children: any; title?: string }) => (
    <div data-testid="admin-layout" data-title={title}>
      {children}
    </div>
  )
}))

jest.mock('@/components/ui/outstatic/github-repo-search', () => ({
  GitHubRepoSearch: () => <div data-testid="github-repo-search" />
}))

jest.mock('./_components/media-settings', () => ({
  MediaSettings: () => <div data-testid="media-settings" />
}))

const hasMaximumUpdateDepthError = (calls: unknown[][]) =>
  calls.some((call) =>
    call.some((arg) => {
      if (typeof arg === 'string') {
        return arg.includes('Maximum update depth exceeded')
      }

      if (arg instanceof Error) {
        return arg.message.includes('Maximum update depth exceeded')
      }

      if (
        arg &&
        typeof arg === 'object' &&
        'message' in arg &&
        typeof (arg as { message: unknown }).message === 'string'
      ) {
        return (arg as { message: string }).message.includes(
          'Maximum update depth exceeded'
        )
      }

      return false
    })
  )

describe('Settings page', () => {
  const mockRebuildMetadata = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseCollections.mockReturnValue({
      data: [{ slug: 'posts', title: 'Posts' }]
    })
    mockUseRebuildMetadata.mockReturnValue(mockRebuildMetadata)
    mockUseGetConfig.mockReturnValue({
      data: { mdExtension: 'md' },
      isPending: false
    })
  })

  it('renders settings sections', () => {
    render(<Settings />)

    expect(screen.getByTestId('admin-layout')).toHaveAttribute(
      'data-title',
      'Settings'
    )
    expect(
      screen.getByRole('heading', { level: 2, name: 'Repository' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: 'Media Library' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: 'Documents' })
    ).toBeInTheDocument()
    expect(screen.getByTestId('github-repo-search')).toBeInTheDocument()
    expect(screen.getByTestId('media-settings')).toBeInTheDocument()
  })

  it('shows metadata actions when collections exist', () => {
    render(<Settings />)

    const rebuildButton = screen.getByRole('button', {
      name: 'Rebuild Metadata'
    })
    fireEvent.click(rebuildButton)

    expect(mockRebuildMetadata).toHaveBeenCalledWith({
      onComplete: expect.any(Function)
    })
    expect(screen.getByRole('button', { name: 'Rebuilding...' })).toBeDisabled()
  })

  it('hides metadata card when there are no collections', () => {
    mockUseCollections.mockReturnValue({
      data: []
    })

    render(<Settings />)

    expect(
      screen.queryByRole('button', { name: 'Rebuild Metadata' })
    ).not.toBeInTheDocument()
  })

  it('does not trigger maximum update depth errors on render', () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    render(
      <StrictMode>
        <Settings />
      </StrictMode>
    )

    expect(screen.getByRole('combobox')).toHaveTextContent('Markdown (.md)')
    expect(hasMaximumUpdateDepthError(consoleErrorSpy.mock.calls)).toBe(false)

    consoleErrorSpy.mockRestore()
  })
})
