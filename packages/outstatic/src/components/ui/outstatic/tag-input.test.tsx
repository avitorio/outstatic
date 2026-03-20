import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { TagInput } from './tag-input'

jest.mock('change-case', () => ({
  camelCase: (value: string) => value.trim().toLowerCase()
}))

const TagInputForm = ({
  suggestions = []
}: {
  suggestions?: { label: string; value: string }[]
}) => {
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
      <TagInput id="values" label="Options" suggestions={suggestions} />
      <output>{JSON.stringify(values)}</output>
    </FormProvider>
  )
}

describe('<TagInput />', () => {
  it('creates options without requiring document context', async () => {
    const user = userEvent.setup()

    render(<TagInputForm />)

    await user.type(screen.getByRole('textbox', { name: 'Options' }), 'News')
    await user.keyboard('{Enter}')

    expect(screen.getByText(/"value":"news"/)).toBeInTheDocument()
  })

  it('selects an existing suggestion from the combobox list', async () => {
    const user = userEvent.setup()

    render(<TagInputForm suggestions={[{ label: 'News', value: 'news' }]} />)

    await user.click(screen.getByRole('textbox', { name: 'Options' }))
    await user.click(screen.getByText('News'))

    expect(screen.getByText(/"label":"News"/)).toBeInTheDocument()
  })

  it('reuses an exact suggestion match instead of creating a duplicate', async () => {
    const user = userEvent.setup()

    render(<TagInputForm suggestions={[{ label: 'News', value: 'news' }]} />)

    await user.type(screen.getByRole('textbox', { name: 'Options' }), 'News')
    await user.keyboard('{Enter}')

    expect(
      screen.getByText(/^\[\{"label":"News","value":"news"\}\]$/)
    ).toBeInTheDocument()
  })
})
