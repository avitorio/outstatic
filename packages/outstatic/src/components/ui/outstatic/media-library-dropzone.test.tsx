import { fireEvent, render, screen } from '@testing-library/react'
import { MediaLibraryDropzone } from './media-library-dropzone'

const createFileList = (files: File[]) =>
  Object.assign(files, {
    item: (index: number) => files[index] ?? null,
    length: files.length
  }) as unknown as FileList

describe('<MediaLibraryDropzone />', () => {
  it('shows a drop target and forwards dropped files', () => {
    const onFileDrop = jest.fn()
    const file = new File(['image'], 'photo.png', { type: 'image/png' })
    const files = createFileList([file])

    render(
      <MediaLibraryDropzone onFileDrop={onFileDrop}>
        <div>Media content</div>
      </MediaLibraryDropzone>
    )

    const dropzone = screen.getByTestId('media-library-dropzone')
    const dataTransfer = {
      files,
      types: ['Files'],
      dropEffect: 'none'
    }

    fireEvent.dragEnter(dropzone, { dataTransfer })

    expect(screen.getByText('Drop image to upload')).toBeInTheDocument()

    fireEvent.drop(dropzone, { dataTransfer })

    expect(onFileDrop).toHaveBeenCalledWith(files)
    expect(screen.queryByText('Drop image to upload')).not.toBeInTheDocument()
  })

  it('ignores dropped files when disabled', () => {
    const onFileDrop = jest.fn()
    const file = new File(['image'], 'photo.png', { type: 'image/png' })
    const files = createFileList([file])

    render(
      <MediaLibraryDropzone disabled onFileDrop={onFileDrop}>
        <div>Media content</div>
      </MediaLibraryDropzone>
    )

    const dropzone = screen.getByTestId('media-library-dropzone')
    const dataTransfer = {
      files,
      types: ['Files'],
      dropEffect: 'none'
    }

    fireEvent.dragEnter(dropzone, { dataTransfer })
    fireEvent.drop(dropzone, { dataTransfer })

    expect(screen.queryByText('Drop image to upload')).not.toBeInTheDocument()
    expect(onFileDrop).not.toHaveBeenCalled()
  })
})
