import { act, renderHook } from '@testing-library/react'
import { toast } from 'sonner'
import useSubmitMedia from './use-submit-media'
import { useMediaLibraryUpload } from './use-media-library-upload'

jest.mock('./use-submit-media', () => ({
  __esModule: true,
  default: jest.fn()
}))

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    promise: jest.fn()
  }
}))

const mockUseSubmitMedia = useSubmitMedia as jest.Mock
const mockToastError = toast.error as jest.Mock
const mockToastPromise = toast.promise as jest.Mock
const submitMediaMock = jest.fn()
const imageSource = {
  name: 'images',
  label: 'Images',
  input: 'media',
  output: '/media',
  categories: ['image']
} as const
const documentSource = {
  name: 'docs',
  label: 'Documents',
  input: 'media/docs',
  output: '/media/docs',
  categories: ['document']
} as const

const createFileList = (files: File[]) =>
  Object.assign(files, {
    item: (index: number) => files[index] ?? null,
    length: files.length
  }) as unknown as FileList

class MockFileReader {
  result: string | ArrayBuffer | null = null
  error: DOMException | null = null
  onload: ((event: ProgressEvent<FileReader>) => void) | null = null
  onerror: ((event: ProgressEvent<FileReader>) => void) | null = null

  readAsDataURL(file: File) {
    if (file.name.includes('broken')) {
      this.error = new DOMException('Failed to read file')
      this.onerror?.({ target: this } as unknown as ProgressEvent<FileReader>)
      return
    }

    this.result = `data:${file.type};base64,YWJj`
    this.onload?.({ target: this } as unknown as ProgressEvent<FileReader>)
  }
}

describe('useMediaLibraryUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
    mockUseSubmitMedia.mockReturnValue(submitMediaMock)
    mockToastPromise.mockImplementation((promise: Promise<unknown>) => promise)

    Object.defineProperty(window, 'FileReader', {
      configurable: true,
      writable: true,
      value: MockFileReader
    })
    ;(global as typeof globalThis).FileReader =
      MockFileReader as unknown as typeof FileReader
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('uploads a single image through the shared submit hook', async () => {
    submitMediaMock.mockResolvedValue(undefined)
    const file = new File(['image'], 'photo.png', { type: 'image/png' })
    const { result } = renderHook(() =>
      useMediaLibraryUpload({ source: imageSource })
    )

    await act(async () => {
      await result.current.handleFileUpload(createFileList([file]))
    })

    expect(mockToastPromise).toHaveBeenCalled()
    expect(submitMediaMock).toHaveBeenCalledWith({
      files: [
        {
          filename: 'photo.png',
          type: 'image',
          content: 'YWJj'
        }
      ],
      source: imageSource
    })
    expect(mockToastPromise).toHaveBeenCalledWith(
      submitMediaMock.mock.results[0]?.value,
      expect.objectContaining({
        loading: 'Uploading 1 image...',
        success: 'Uploaded 1 image.',
        error: 'Failed to upload 1 image.'
      })
    )
    expect(result.current.isUploading).toBe(false)
  })

  it('uploads multiple valid images in one batch', async () => {
    submitMediaMock.mockResolvedValue(undefined)
    const firstFile = new File(['image'], 'photo.png', { type: 'image/png' })
    const secondFile = new File(['image'], 'second.png', { type: 'image/png' })
    const { result } = renderHook(() =>
      useMediaLibraryUpload({ source: imageSource })
    )

    await act(async () => {
      await result.current.handleFileUpload(
        createFileList([firstFile, secondFile])
      )
    })

    expect(submitMediaMock).toHaveBeenCalledWith({
      files: [
        {
          filename: 'photo.png',
          type: 'image',
          content: 'YWJj'
        },
        {
          filename: 'second.png',
          type: 'image',
          content: 'YWJj'
        }
      ],
      source: imageSource
    })
    expect(mockToastPromise).toHaveBeenCalledWith(
      submitMediaMock.mock.results[0]?.value,
      expect.objectContaining({
        loading: 'Uploading 2 images...',
        success: 'Uploaded 2 images.',
        error: 'Failed to upload 2 images.'
      })
    )
  })

  it('uploads valid images and summarizes skipped invalid files', async () => {
    submitMediaMock.mockResolvedValue(undefined)
    const validFile = new File(['image'], 'photo.png', { type: 'image/png' })
    const invalidFile = new File(['text'], 'notes.txt', { type: 'text/plain' })
    const oversizedFile = new File(
      [new Uint8Array(20 * 1024 * 1024 + 1)],
      'large.png',
      { type: 'image/png' }
    )
    const { result } = renderHook(() =>
      useMediaLibraryUpload({ source: imageSource })
    )

    await act(async () => {
      await result.current.handleFileUpload(
        createFileList([validFile, invalidFile, oversizedFile])
      )
    })

    expect(submitMediaMock).toHaveBeenCalledWith({
      files: [
        {
          filename: 'photo.png',
          type: 'image',
          content: 'YWJj'
        }
      ],
      source: imageSource
    })
    expect(mockToastPromise).toHaveBeenCalledWith(
      submitMediaMock.mock.results[0]?.value,
      expect.objectContaining({
        loading: 'Uploading 1 image...',
        success:
          'Uploaded 1 image. Skipped 1 invalid file and 1 oversized file.',
        error: 'Failed to upload 1 image.'
      })
    )
  })

  it('rejects batches larger than the upload limit', async () => {
    const files = Array.from(
      { length: 11 },
      (_, index) =>
        new File(['image'], `photo-${index}.png`, { type: 'image/png' })
    )
    const { result } = renderHook(() =>
      useMediaLibraryUpload({ source: imageSource })
    )

    await act(async () => {
      await result.current.handleFileUpload(createFileList(files))
    })

    expect(mockToastError).toHaveBeenCalledWith(
      'You can upload up to 10 images at once.'
    )
    expect(mockToastPromise).not.toHaveBeenCalled()
    expect(submitMediaMock).not.toHaveBeenCalled()
  })

  it('skips unreadable files and uploads the rest', async () => {
    submitMediaMock.mockResolvedValue(undefined)
    const validFile = new File(['image'], 'photo.png', { type: 'image/png' })
    const unreadableFile = new File(['image'], 'broken.png', {
      type: 'image/png'
    })
    const { result } = renderHook(() =>
      useMediaLibraryUpload({ source: imageSource })
    )

    await act(async () => {
      await result.current.handleFileUpload(
        createFileList([validFile, unreadableFile])
      )
    })

    expect(submitMediaMock).toHaveBeenCalledWith({
      files: [
        {
          filename: 'photo.png',
          type: 'image',
          content: 'YWJj'
        }
      ],
      source: imageSource
    })
    expect(mockToastPromise).toHaveBeenCalledWith(
      submitMediaMock.mock.results[0]?.value,
      expect.objectContaining({
        success: 'Uploaded 1 image. Skipped 1 unreadable file.'
      })
    )
  })

  it('shows a single summary error when no files can be uploaded', async () => {
    const invalidFile = new File(['text'], 'notes.txt', { type: 'text/plain' })
    const oversizedFile = new File(
      [new Uint8Array(20 * 1024 * 1024 + 1)],
      'large.png',
      { type: 'image/png' }
    )
    const unreadableFile = new File(['image'], 'broken.png', {
      type: 'image/png'
    })
    const { result } = renderHook(() =>
      useMediaLibraryUpload({ source: imageSource })
    )

    await act(async () => {
      await result.current.handleFileUpload(
        createFileList([invalidFile, oversizedFile, unreadableFile])
      )
    })

    expect(mockToastError).toHaveBeenCalledWith(
      'No images were uploaded. Skipped 1 invalid file, 1 oversized file, and 1 unreadable file.'
    )
    expect(mockToastPromise).not.toHaveBeenCalled()
    expect(submitMediaMock).not.toHaveBeenCalled()
  })

  it('routes all-media uploads to matching sources by extension', async () => {
    submitMediaMock.mockResolvedValue(undefined)
    const imageFile = new File(['image'], 'photo.png', { type: 'image/png' })
    const documentFile = new File(['document'], 'paper.pdf', {
      type: 'application/pdf'
    })
    const { result } = renderHook(() =>
      useMediaLibraryUpload({ sources: [imageSource, documentSource] })
    )

    await act(async () => {
      await result.current.handleFileUpload(
        createFileList([imageFile, documentFile])
      )
    })

    expect(submitMediaMock).toHaveBeenCalledTimes(2)
    expect(submitMediaMock).toHaveBeenCalledWith({
      files: [
        {
          filename: 'photo.png',
          type: 'image',
          content: 'YWJj'
        }
      ],
      source: imageSource
    })
    expect(submitMediaMock).toHaveBeenCalledWith({
      files: [
        {
          filename: 'paper.pdf',
          type: 'document',
          content: 'YWJj'
        }
      ],
      source: documentSource
    })
    expect(mockToastPromise).toHaveBeenCalledWith(
      expect.any(Promise),
      expect.objectContaining({
        loading: 'Uploading 2 files...',
        success: 'Uploaded 2 files.',
        error: 'Failed to upload 2 files.'
      })
    )
  })
})
