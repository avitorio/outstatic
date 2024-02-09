import { render, renderHook } from '@testing-library/react'
import { useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

import MDEMenu from '.'

jest.mock('change-case', () => {
  return {
    sentenceCase: (str: string) => str
  }
})

describe('<MDEMenu />', () => {
  it('should render the heading', () => {
    const { result } = renderHook(() =>
      useEditor({
        extensions: [StarterKit],
        content: 'Anything'
      })
    )

    render(<div>{result.current && <MDEMenu editor={result.current} />}</div>)
  })
})
