import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { TagInput } from './tag-input'

jest.mock('change-case', () => ({
  camelCase: (value: string) => value.trim().toLowerCase()
}))

jest.mock('./creatable-select', () => ({
  CreatableSelect: ({
    onCreateOption
  }: {
    onCreateOption?: (inputValue: string) => void
  }) => (
    <button type="button" onClick={() => onCreateOption?.('News')}>
      Create option
    </button>
  )
}))

const TagInputForm = () => {
  const methods = useForm<{ values: { label: string; value: string }[] }>({
    defaultValues: {
      values: []
    }
  })
  const values = useWatch({
    control: methods.control,
    name: 'values'
  })

  return (
    <FormProvider {...methods}>
      <TagInput id="values" label="Options" />
      <output>{JSON.stringify(values)}</output>
    </FormProvider>
  )
}

describe('<TagInput />', () => {
  it('creates options without requiring document context', async () => {
    const user = userEvent.setup()

    render(<TagInputForm />)

    await user.click(screen.getByRole('button', { name: 'Create option' }))

    expect(screen.getByText(/"value":"news"/)).toBeInTheDocument()
  })
})
