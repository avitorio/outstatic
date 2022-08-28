import { render, renderHook, screen } from '@testing-library/react'
import { useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

import MDEImageMenu from '.'

describe('<MDEImageMenu />', () => {
  it('should render the heading', () => {
    const { result } = renderHook(() =>
      useEditor({
        extensions: [StarterKit],
        content: 'Anything'
      })
    )
    render(
      <div>
        {result.current && (
          <MDEImageMenu editor={result.current} setImageMenu={() => {}} />
        )}
      </div>
    )

    expect(
      screen.getByRole('button', { name: /from link/i })
    ).toBeInTheDocument()
  })
})
