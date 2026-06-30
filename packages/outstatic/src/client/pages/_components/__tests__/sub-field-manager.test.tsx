import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { SubFieldFormEntry, SubFieldManager } from '../sub-field-manager'

jest.mock('change-case', () => ({
  camelCase: (value: string) => {
    const words = value
      .trim()
      .split(/[\s_-]+/)
      .filter(Boolean)
      .map((word) => word.toLowerCase())

    if (words.length === 0) return ''

    return words
      .map((word, index) =>
        index === 0 ? word : `${word.charAt(0).toUpperCase()}${word.slice(1)}`
      )
      .join('')
  }
}))

const FieldsSnapshot = () => {
  const fields = useWatch({ name: 'fields' }) as SubFieldFormEntry[] | undefined

  return <pre data-testid="fields-json">{JSON.stringify(fields ?? [])}</pre>
}

const renderManager = () => {
  const Harness = () => {
    const methods = useForm<{ fields: SubFieldFormEntry[] }>({
      defaultValues: {
        fields: [
          {
            name: 'section',
            title: 'Section',
            fieldType: 'Object',
            fields: [
              {
                name: 'title',
                title: 'Title',
                fieldType: 'String'
              }
            ]
          }
        ]
      }
    })

    return (
      <FormProvider {...methods}>
        <button
          type="button"
          onClick={() =>
            methods.setValue('fields', [], {
              shouldDirty: true,
              shouldValidate: true
            })
          }
        >
          Clear root fields
        </button>
        <button
          type="button"
          onClick={() =>
            methods.setError('fields.0.fields' as any, {
              type: 'custom',
              message: 'Add at least one sub-field.'
            })
          }
        >
          Set nested error
        </button>
        <SubFieldManager />
        <FieldsSnapshot />
      </FormProvider>
    )
  }

  return render(<Harness />)
}

describe('<SubFieldManager />', () => {
  it('clamps the current path when the backing fields are removed', async () => {
    const user = userEvent.setup()

    renderManager()

    await user.click(screen.getByRole('button', { name: 'Object · 1' }))
    expect(screen.getByText('Level 2 / 3')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Clear root fields' }))

    await waitFor(() => {
      expect(screen.getByText('Level 1 / 3')).toBeInTheDocument()
    })
    expect(
      screen.queryByRole('button', { name: 'Section' })
    ).not.toBeInTheDocument()
    expect(screen.getByTestId('fields-json')).toHaveTextContent('[]')
  })

  it('surfaces nested sub-field validation errors', async () => {
    const user = userEvent.setup()

    renderManager()

    await user.click(screen.getByRole('button', { name: 'Set nested error' }))

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Add at least one sub-field.'
    )
  })
})
