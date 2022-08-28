import { render, renderHook } from '@testing-library/react'
import { useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

import MDEFloatingMenu from '.'

describe('<MDEFloatingMenu />', () => {
  it('should render the heading', () => {
    const { result } = renderHook(() =>
      useEditor({
        extensions: [StarterKit],
        content: 'Anything'
      })
    )

    render(
      <div>{result.current && <MDEFloatingMenu editor={result.current} />}</div>
    )
  })
})
