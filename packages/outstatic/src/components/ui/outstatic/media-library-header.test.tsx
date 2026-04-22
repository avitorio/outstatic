import { fireEvent, render, screen } from '@testing-library/react'
import { MediaLibraryHeader } from './media-library-header'

describe('<MediaLibraryHeader />', () => {
  it('allows selecting multiple image files', () => {
    const { container } = render(
      <MediaLibraryHeader
        isUploading={false}
        searchTerm=""
        setSearchTerm={() => {}}
        sortBy="date"
        setSortBy={() => {}}
        sortDirection="desc"
        setSortDirection={() => {}}
        handleFileUpload={() => {}}
        onOpenSettings={() => {}}
      />
    )

    const input = container.querySelector('input[type="file"]')

    expect(input).toHaveAttribute('multiple')
  })

  it('opens media settings from the header action', () => {
    const onOpenSettings = jest.fn()

    render(
      <MediaLibraryHeader
        isUploading={false}
        searchTerm=""
        setSearchTerm={() => {}}
        sortBy="date"
        setSortBy={() => {}}
        sortDirection="desc"
        setSortDirection={() => {}}
        handleFileUpload={() => {}}
        onOpenSettings={onOpenSettings}
      />
    )

    fireEvent.click(
      screen.getByRole('button', { name: /open media settings/i })
    )

    expect(onOpenSettings).toHaveBeenCalledTimes(1)
  })
})
