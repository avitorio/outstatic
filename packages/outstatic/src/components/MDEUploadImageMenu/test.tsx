import { render, renderHook, screen } from '@testing-library/react'
import { useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

import MDEUploadImageMenu from '.'

describe('<MDEUploadImageMenu />', () => {
  it('should render the MDEUploadImageMenu', () => {
    const { result } = renderHook(() =>
      useEditor({
        extensions: [StarterKit],
        content: 'Anything'
      })
    )
    render(
      <div>
        {result.current && (
          <MDEUploadImageMenu editor={result.current} setImageMenu={() => {}} />
        )}
      </div>
    )

    expect(
      screen.getByRole('button', { name: /from link/i })
    ).toBeInTheDocument()
  })
})
