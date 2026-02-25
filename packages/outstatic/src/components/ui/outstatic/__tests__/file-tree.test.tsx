import { fireEvent, render, screen } from '@testing-library/react'
import { Tree } from '../file-tree'

jest.mock('use-resize-observer', () => ({
  __esModule: true,
  default: () => ({
    ref: jest.fn(),
    width: 320,
    height: 240
  })
}))

describe('<Tree />', () => {
  it('allows selecting a root node with an empty id', () => {
    const onSelectChange = jest.fn()

    render(
      <Tree
        data={{
          id: '',
          name: 'root',
          children: [{ id: 'docs', name: 'docs' }]
        }}
        onSelectChange={onSelectChange}
      />
    )

    fireEvent.click(screen.getByText('root'))

    expect(onSelectChange).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '',
        name: 'root'
      })
    )
  })
})
