import { render } from '@testing-library/react'
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
      />
    )

    const input = container.querySelector('input[type="file"]')

    expect(input).toHaveAttribute('multiple')
  })
})
