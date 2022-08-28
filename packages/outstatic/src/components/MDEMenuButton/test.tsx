import { render, screen, renderHook } from '@testing-library/react'
import { useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

import MDEButton from '.'

describe('<MDEButton />', () => {
  it('should render the button', () => {
    const { result } = renderHook(() =>
      useEditor({
        extensions: [StarterKit],
        content: 'Anything'
      })
    )

    render(
      <>
        {result.current && (
          <MDEButton name="bold" onClick={() => {}} editor={result.current}>
            Bold
          </MDEButton>
        )}
      </>
    )

    expect(screen.getByText(/bold/i)).toBeInTheDocument()
  })
})
