import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import {
  SortableSelect,
  SortableSelectOption,
  reorderSortableOptions
} from './sortable-select'

const allOptions: SortableSelectOption[] = [
  { id: 'title', label: 'Title', value: 'title' },
  { id: 'status', label: 'Status', value: 'status' },
  { id: 'slug', label: 'Slug', value: 'slug' }
]

const Harness = ({
  initialSelected = allOptions.slice(0, 2),
  onBlur = jest.fn(),
  onChangeList = jest.fn()
}: {
  initialSelected?: SortableSelectOption[]
  onBlur?: jest.Mock
  onChangeList?: jest.Mock
}) => {
  const [selected, setSelected] = useState(initialSelected)

  return (
    <>
      <SortableSelect
        selected={selected}
        setSelected={setSelected}
        allOptions={allOptions}
        onChangeList={onChangeList}
        onBlur={onBlur}
      />
      <output data-testid="selected">{JSON.stringify(selected)}</output>
      <button type="button">Outside</button>
    </>
  )
}

describe('SortableSelect', () => {
  it('adds a new option from the command list', async () => {
    const user = userEvent.setup()
    const onChangeList = jest.fn()

    render(<Harness onChangeList={onChangeList} />)

    await user.click(screen.getByText('Slug'))

    expect(screen.getByTestId('selected')).toHaveTextContent('"slug"')
    expect(onChangeList).toHaveBeenLastCalledWith([
      { id: 'title', label: 'Title', value: 'title' },
      { id: 'status', label: 'Status', value: 'status' },
      { id: 'slug', label: 'Slug', value: 'slug' }
    ])
  })

  it('removes a selected option from the chip list', async () => {
    const user = userEvent.setup()
    const onChangeList = jest.fn()

    render(<Harness onChangeList={onChangeList} />)

    await user.click(screen.getByRole('button', { name: 'Remove Status' }))

    expect(screen.getByTestId('selected')).not.toHaveTextContent('"status"')
    expect(onChangeList).toHaveBeenLastCalledWith([
      { id: 'title', label: 'Title', value: 'title' }
    ])
  })

  it('calls onBlur when focus leaves the picker', () => {
    const onBlur = jest.fn()

    render(<Harness onBlur={onBlur} />)

    const input = screen.getByRole('textbox', { name: 'Filter columns' })
    const outsideButton = screen.getByRole('button', { name: 'Outside' })

    fireEvent.blur(input, { relatedTarget: outsideButton })

    expect(onBlur).toHaveBeenCalled()
  })
})

describe('reorderSortableOptions', () => {
  it('reorders items when both ids are present', () => {
    expect(
      reorderSortableOptions(allOptions, 'slug', 'title').map(
        (option) => option.id
      )
    ).toEqual(['slug', 'title', 'status'])
  })

  it('returns the original array when the drop target is missing', () => {
    expect(reorderSortableOptions(allOptions, 'slug')).toBe(allOptions)
  })
})
