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
    this.result = `data:${file.type};base64,YWJj`
    this.onload?.({ target: this } as unknown as ProgressEvent<FileReader>)
  }
}

describe('useMediaLibraryUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks()
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

  it('uploads the first image file through the shared submit hook', async () => {
    submitMediaMock.mockResolvedValue(undefined)
    const file = new File(['image'], 'photo.png', { type: 'image/png' })
    const { result } = renderHook(() => useMediaLibraryUpload())

    await act(async () => {
      await result.current.handleFileUpload(createFileList([file]))
    })

    expect(mockToastPromise).toHaveBeenCalled()
    expect(submitMediaMock).toHaveBeenCalledWith({
      filename: 'photo.png',
      type: 'image',
      content: 'YWJj'
    })
    expect(result.current.isUploading).toBe(false)
  })

  it('rejects non-image files before attempting upload', async () => {
    const file = new File(['text'], 'notes.txt', { type: 'text/plain' })
    const { result } = renderHook(() => useMediaLibraryUpload())

    await act(async () => {
      await result.current.handleFileUpload(createFileList([file]))
    })

    expect(mockToastError).toHaveBeenCalledWith(
      'Only image files can be uploaded.'
    )
    expect(mockToastPromise).not.toHaveBeenCalled()
    expect(submitMediaMock).not.toHaveBeenCalled()
  })
})
