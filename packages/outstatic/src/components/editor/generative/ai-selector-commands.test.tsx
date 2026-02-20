import { fireEvent, render } from '@testing-library/react'
import { useEditor } from '@/components/editor/editor-context'
import { Command } from '@/components/ui/shadcn/command'
import AISelectorCommands from './ai-selector-commands'

jest.mock('@/components/editor/editor-context', () => ({
  useEditor: jest.fn()
}))

const mockUseEditor = useEditor as unknown as jest.Mock

describe('AISelectorCommands', () => {
  const editor = {
    state: {
      selection: {
        content: jest.fn(),
        from: 1
      }
    },
    storage: {
      markdown: {
        serializer: {
          serialize: jest.fn()
        }
      }
    }
  } as any

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseEditor.mockReturnValue({ editor })
  })

  it('closes the selector when Escape is pressed', () => {
    const onClose = jest.fn()

    render(
      <Command>
        <AISelectorCommands onSelect={jest.fn()} onClose={onClose} />
      </Command>
    )

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renders command icons with black color', () => {
    const { container } = render(
      <Command>
        <AISelectorCommands onSelect={jest.fn()} onClose={jest.fn()} />
      </Command>
    )

    const icons = container.querySelectorAll('svg')
    expect(icons.length).toBeGreaterThan(0)
    icons.forEach((icon) => {
      expect(icon).toHaveClass('text-black')
    })
  })
})
