import { render, renderHook, screen } from '@testing-library/react'
import { useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

import MDEInsertImage from '.'

describe('<MDEInsertImage />', () => {
  it('should render the MDEInsertImage', () => {
    const { result } = renderHook(() =>
      useEditor({
        extensions: [StarterKit],
        content: 'Anything'
      })
    )
    render(
      <div>
        {result.current && (
          <MDEInsertImage editor={result.current} setImageMenu={() => {}} />
        )}
      </div>
    )

    expect(
      screen.getByRole('button', { name: /from link/i })
    ).toBeInTheDocument()
  })
})
