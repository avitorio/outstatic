import { fireEvent, render, screen } from '@testing-library/react'
import {
  ALL_MEDIA_SOURCE_VALUE,
  MediaLibraryHeader
} from './media-library-header'

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

  it('uses Add Media copy and accepts all extensions in all-media mode', () => {
    const { container } = render(
      <MediaLibraryHeader
        isUploading={false}
        searchTerm=""
        setSearchTerm={() => {}}
        sortBy="date"
        setSortBy={() => {}}
        sortDirection="desc"
        setSortDirection={() => {}}
        mediaSources={[
          {
            name: 'images',
            label: 'Images',
            input: 'media/images',
            output: '/media/images',
            categories: ['image']
          },
          {
            name: 'docs',
            label: 'Documents',
            input: 'media/docs',
            output: '/media/docs',
            categories: ['document']
          }
        ]}
        selectedSourceName={ALL_MEDIA_SOURCE_VALUE}
        setSelectedSourceName={() => {}}
        handleFileUpload={() => {}}
      />
    )

    expect(screen.getByText('Add Media')).toBeInTheDocument()
    const input = container.querySelector('input[type="file"]')
    const accept = input?.getAttribute('accept')

    expect(accept).toContain('.png')
    expect(accept).toContain('.pdf')
  })
})
