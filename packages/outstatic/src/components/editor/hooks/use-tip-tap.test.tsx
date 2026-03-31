import { act, render } from '@testing-library/react'
import { useEditor } from '@tiptap/react'
import { useCompletion } from '@ai-sdk/react'
import { useDebouncedCallback } from 'use-debounce'
import { useOutstatic } from '@/utils/hooks/use-outstatic'
import { useUpgradeDialog } from '@/components/ui/outstatic/upgrade-dialog-context'
import { getPrevText } from '@/components/editor/utils/get-prev-text'
import { useTipTap } from './use-tip-tap'

jest.mock('@/components/editor/extensions/index', () => ({
  getTiptapExtensions: jest.fn(() => [])
}))

jest.mock('@tiptap/extension-placeholder', () => ({
  __esModule: true,
  default: {
    configure: jest.fn(() => ({ name: 'placeholder' }))
  }
}))

jest.mock('@tiptap/react', () => ({
  useEditor: jest.fn()
}))

jest.mock('@ai-sdk/react', () => ({
  useCompletion: jest.fn()
}))

jest.mock('use-debounce', () => ({
  useDebouncedCallback: jest.fn()
}))

jest.mock('@/utils/hooks/use-outstatic', () => ({
  useOutstatic: jest.fn()
}))

jest.mock('@/components/ui/outstatic/upgrade-dialog-context', () => ({
  useUpgradeDialog: jest.fn()
}))

jest.mock('@/components/editor/utils/get-prev-text', () => ({
  getPrevText: jest.fn()
}))

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    message: jest.fn()
  }
}))

const mockUseEditor = useEditor as unknown as jest.Mock
const mockUseCompletion = useCompletion as unknown as jest.Mock
const mockUseDebouncedCallback = useDebouncedCallback as unknown as jest.Mock
const mockUseOutstatic = useOutstatic as unknown as jest.Mock
const mockUseUpgradeDialog = useUpgradeDialog as unknown as jest.Mock
const mockGetPrevText = getPrevText as unknown as jest.Mock

function HookHarness({ setValue }: { setValue: jest.Mock }) {
  useTipTap({ setValue })
  return null
}

const countEventCalls = (spy: jest.SpyInstance, eventType: string) =>
  spy.mock.calls.filter(([event]) => event === eventType).length

describe('useTipTap AI gating', () => {
  const complete = jest.fn()
  const stop = jest.fn()
  const openUpgradeDialog = jest.fn()
  const setValue = jest.fn()

  const editor = {
    state: {
      selection: {
        from: 10
      }
    },
    commands: {
      deleteRange: jest.fn(),
      addClass: jest.fn(),
      removeClass: jest.fn()
    },
    getHTML: jest.fn(() => ''),
    getText: jest.fn(() => 'Existing text'),
    isEmpty: false
  } as any

  let capturedOnUpdate: ((args: any) => void) | undefined

  beforeEach(() => {
    jest.clearAllMocks()
    capturedOnUpdate = undefined

    mockUseOutstatic.mockReturnValue({
      hasAIProviderKey: false,
      isPro: false,
      basePath: '/outstatic'
    })

    mockUseUpgradeDialog.mockReturnValue({
      openUpgradeDialog
    })

    mockUseCompletion.mockReturnValue({
      complete,
      completion: '',
      isLoading: false,
      stop
    })

    mockUseDebouncedCallback.mockImplementation(
      (callback: (...args: any[]) => unknown) => callback
    )

    mockUseEditor.mockImplementation((config: any) => {
      capturedOnUpdate = config.onUpdate
      return editor
    })

    mockGetPrevText.mockReturnValue('++')
  })

  it('opens upgrade dialog for ++ when AI access is not available', () => {
    render(<HookHarness setValue={setValue} />)

    expect(capturedOnUpdate).toBeDefined()

    act(() => {
      capturedOnUpdate?.({ editor })
    })

    expect(editor.commands.deleteRange).toHaveBeenCalledWith({
      from: 8,
      to: 10
    })
    expect(openUpgradeDialog).toHaveBeenCalledTimes(1)
    expect(complete).not.toHaveBeenCalled()
    expect(mockGetPrevText).toHaveBeenCalledTimes(1)
  })

  it('starts completion for ++ when AI access is available', () => {
    mockUseOutstatic.mockReturnValue({
      hasAIProviderKey: true,
      isPro: false,
      basePath: '/outstatic'
    })

    mockGetPrevText.mockImplementation(
      (_editor: unknown, options: { chars: number }) => {
        if (options.chars === 2) {
          return '++'
        }
        return 'Existing text'
      }
    )

    render(<HookHarness setValue={setValue} />)

    act(() => {
      capturedOnUpdate?.({ editor })
    })

    expect(openUpgradeDialog).not.toHaveBeenCalled()
    expect(complete).toHaveBeenCalledWith('Existing text', {
      body: { option: 'continue', command: '' }
    })
  })

  it('attaches and removes global listeners only during loading', () => {
    const loadingState = { isLoading: false }

    mockUseCompletion.mockImplementation(() => ({
      complete,
      completion: '',
      isLoading: loadingState.isLoading,
      stop
    }))

    const addDocumentListenerSpy = jest.spyOn(document, 'addEventListener')
    const removeDocumentListenerSpy = jest.spyOn(
      document,
      'removeEventListener'
    )
    const addWindowListenerSpy = jest.spyOn(window, 'addEventListener')
    const removeWindowListenerSpy = jest.spyOn(window, 'removeEventListener')

    const { rerender } = render(<HookHarness setValue={setValue} />)

    const keydownAddsBefore = countEventCalls(addDocumentListenerSpy, 'keydown')
    const mouseDownAddsBefore = countEventCalls(
      addWindowListenerSpy,
      'mousedown'
    )
    const keydownRemovesBefore = countEventCalls(
      removeDocumentListenerSpy,
      'keydown'
    )
    const mouseDownRemovesBefore = countEventCalls(
      removeWindowListenerSpy,
      'mousedown'
    )

    act(() => {
      loadingState.isLoading = true
      rerender(<HookHarness setValue={setValue} />)
    })

    expect(countEventCalls(addDocumentListenerSpy, 'keydown')).toBe(
      keydownAddsBefore + 1
    )
    expect(countEventCalls(addWindowListenerSpy, 'mousedown')).toBe(
      mouseDownAddsBefore + 1
    )

    act(() => {
      loadingState.isLoading = false
      rerender(<HookHarness setValue={setValue} />)
    })

    expect(countEventCalls(removeDocumentListenerSpy, 'keydown')).toBe(
      keydownRemovesBefore + 1
    )
    expect(countEventCalls(removeWindowListenerSpy, 'mousedown')).toBe(
      mouseDownRemovesBefore + 1
    )

    addDocumentListenerSpy.mockRestore()
    removeDocumentListenerSpy.mockRestore()
    addWindowListenerSpy.mockRestore()
    removeWindowListenerSpy.mockRestore()
  })
})
