import { createEvent, fireEvent, render, screen } from '@testing-library/react'
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

    expect(screen.getByText('Drop media to upload')).toBeInTheDocument()

    fireEvent.drop(dropzone, { dataTransfer })

    expect(onFileDrop).toHaveBeenCalledWith(files)
    expect(screen.queryByText('Drop media to upload')).not.toBeInTheDocument()
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

    const dragEnterEvent = createEvent.dragEnter(dropzone, { dataTransfer })
    const dragOverEvent = createEvent.dragOver(dropzone, { dataTransfer })
    const dropEvent = createEvent.drop(dropzone, { dataTransfer })

    fireEvent(dropzone, dragEnterEvent)
    fireEvent(dropzone, dragOverEvent)
    fireEvent(dropzone, dropEvent)

    expect(screen.queryByText('Drop media to upload')).not.toBeInTheDocument()
    expect(onFileDrop).not.toHaveBeenCalled()
    expect(dragEnterEvent.defaultPrevented).toBe(true)
    expect(dragOverEvent.defaultPrevented).toBe(true)
    expect(dropEvent.defaultPrevented).toBe(true)
    expect(dataTransfer.dropEffect).toBe('none')
  })

  it('forwards pasted files', () => {
    const onFileDrop = jest.fn()
    const onFilePaste = jest.fn()
    const file = new File(['image'], 'photo.png', { type: 'image/png' })

    render(
      <MediaLibraryDropzone onFileDrop={onFileDrop} onFilePaste={onFilePaste}>
        <div>Media content</div>
      </MediaLibraryDropzone>
    )

    fireEvent.paste(document.body, {
      clipboardData: { files: createFileList([file]), items: [] }
    })

    expect(onFilePaste).toHaveBeenCalledWith([file])
  })

  it('names pasted files that arrive without a filename', () => {
    const onFileDrop = jest.fn()
    const onFilePaste = jest.fn()
    const file = new File(['image'], '', { type: 'image/png' })

    render(
      <MediaLibraryDropzone onFileDrop={onFileDrop} onFilePaste={onFilePaste}>
        <div>Media content</div>
      </MediaLibraryDropzone>
    )

    fireEvent.paste(document.body, {
      clipboardData: { files: createFileList([file]), items: [] }
    })

    const [pastedFiles] = onFilePaste.mock.calls[0]

    expect(pastedFiles).toHaveLength(1)
    expect(pastedFiles[0].name).toMatch(/^pasted-\d+-0\.png$/)
  })

  it('ignores pastes without files', () => {
    const onFileDrop = jest.fn()
    const onFilePaste = jest.fn()

    render(
      <MediaLibraryDropzone onFileDrop={onFileDrop} onFilePaste={onFilePaste}>
        <div>Media content</div>
      </MediaLibraryDropzone>
    )

    fireEvent.paste(document.body, {
      clipboardData: { files: createFileList([]), items: [] }
    })

    expect(onFilePaste).not.toHaveBeenCalled()
  })

  it('ignores pasted files when disabled', () => {
    const onFileDrop = jest.fn()
    const onFilePaste = jest.fn()
    const file = new File(['image'], 'photo.png', { type: 'image/png' })

    render(
      <MediaLibraryDropzone
        disabled
        onFileDrop={onFileDrop}
        onFilePaste={onFilePaste}
      >
        <div>Media content</div>
      </MediaLibraryDropzone>
    )

    fireEvent.paste(document.body, {
      clipboardData: { files: createFileList([file]), items: [] }
    })

    expect(onFilePaste).not.toHaveBeenCalled()
  })

  it('ignores pastes coming from an unrelated dialog', () => {
    const onFileDrop = jest.fn()
    const onFilePaste = jest.fn()
    const file = new File(['image'], 'photo.png', { type: 'image/png' })

    render(
      <>
        <MediaLibraryDropzone onFileDrop={onFileDrop} onFilePaste={onFilePaste}>
          <div>Media content</div>
        </MediaLibraryDropzone>
        <div role="dialog">
          <input aria-label="Settings" />
        </div>
      </>
    )

    fireEvent.paste(screen.getByLabelText('Settings'), {
      clipboardData: { files: createFileList([file]), items: [] }
    })

    expect(onFilePaste).not.toHaveBeenCalled()
  })
})
