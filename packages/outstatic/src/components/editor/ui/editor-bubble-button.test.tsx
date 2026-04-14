import { createEvent, fireEvent, render, screen } from '@testing-library/react'
import { useEditor } from '../editor-context'
import { EditorBubbleButton } from './editor-bubble-button'

jest.mock('../editor-context', () => ({
  useEditor: jest.fn()
}))

const mockUseEditor = jest.mocked(useEditor)

describe('<EditorBubbleButton />', () => {
  const editor = {
    isActive: jest.fn().mockReturnValue(false)
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseEditor.mockReturnValue({ editor } as any)
  })

  it('prevents default on mousedown to keep the editor selection stable', () => {
    render(<EditorBubbleButton name="link">Link</EditorBubbleButton>)

    const button = screen.getByRole('button', { name: 'Link' })
    const event = createEvent.mouseDown(button)

    fireEvent(button, event)

    expect(event.defaultPrevented).toBe(true)
  })

  it('passes the active editor to onSelect when clicked', () => {
    const onSelect = jest.fn()

    render(
      <EditorBubbleButton name="link" onSelect={onSelect}>
        Link
      </EditorBubbleButton>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Link' }))

    expect(onSelect).toHaveBeenCalledWith(editor)
  })
})
