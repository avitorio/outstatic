import { fireEvent, render } from '@testing-library/react'
import { useEditor } from '@/components/editor/editor-context'
import AISelectorCommands from './ai-selector-commands'

jest.mock('@/components/editor/editor-context', () => ({
  useEditor: jest.fn()
}))

jest.mock('@/components/ui/shadcn/command', () => ({
  CommandList: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CommandGroup: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CommandItem: ({
    children,
    className
  }: {
    children: React.ReactNode
    className?: string
  }) => <div className={className}>{children}</div>,
  CommandSeparator: () => <hr />
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

    render(<AISelectorCommands onSelect={jest.fn()} onClose={onClose} />)

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renders command icons with black color', () => {
    const { container } = render(
      <AISelectorCommands onSelect={jest.fn()} onClose={jest.fn()} />
    )

    const icons = container.querySelectorAll('svg')
    expect(icons.length).toBeGreaterThan(0)
    icons.forEach((icon) => {
      expect(icon).toHaveClass('text-black')
    })
  })
})
