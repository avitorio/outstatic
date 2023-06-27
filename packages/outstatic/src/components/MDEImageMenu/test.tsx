import { render, renderHook, screen } from '@testing-library/react'
import { useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

import MDEImageMenu from '.'

describe('<MDEImageMenu />', () => {
  it('should render the MDEImageMenu', () => {
    const { result } = renderHook(() =>
      useEditor({
        extensions: [StarterKit],
        content: 'Anything'
      })
    )
    render(
      <div>
        {result.current && (
          <MDEImageMenu editor={result.current} setImageSelected={() => {}} />
        )}
      </div>
    )

    expect(screen.getByRole('button', { name: /link/i })).t

    expect(
      screen.getByRole('button', { name: /alt text/i })
    ).toBeInTheDocument()

    expect(
      screen.getByRole('button', { name: /remove image/i })
    ).toBeInTheDocument()
  })
})
