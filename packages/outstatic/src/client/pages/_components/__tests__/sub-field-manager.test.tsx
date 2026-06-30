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
            methods.setValue('fields.0.fields', [], {
              shouldDirty: true,
              shouldValidate: true
            })
          }
        >
          Clear nested fields
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

    await user.click(screen.getByRole('button', { name: 'Sub-fields' }))
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

  it('shows missing sub-field errors on the object row tooltip', async () => {
    const user = userEvent.setup()

    renderManager()

    await user.click(
      screen.getByRole('button', { name: 'Clear nested fields' })
    )

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    const objectButton = screen.getByRole('button', { name: 'Sub-fields' })
    expect(objectButton).toHaveAttribute('aria-invalid', 'true')
    expect(objectButton).toHaveClass('bg-destructive')
    expect(objectButton.closest('.border-destructive')).not.toBeInTheDocument()

    await user.hover(objectButton)

    expect(
      await screen.findAllByText('Add at least one sub-field')
    ).not.toHaveLength(0)
    expect(
      screen.queryByText('Add at least one sub-field.')
    ).not.toBeInTheDocument()
  })

  it('keeps non-empty sub-field validation errors in the alert', async () => {
    const user = userEvent.setup()

    const Harness = () => {
      const methods = useForm<{ fields: SubFieldFormEntry[] }>({
        defaultValues: {
          fields: [
            {
              name: '',
              title: '',
              fieldType: 'String'
            }
          ]
        }
      })

      return (
        <FormProvider {...methods}>
          <button
            type="button"
            onClick={() =>
              methods.setError('fields.0.name' as any, {
                type: 'custom',
                message: 'Sub-field name is required.'
              })
            }
          >
            Set name error
          </button>
          <SubFieldManager />
        </FormProvider>
      )
    }

    render(<Harness />)

    await user.click(screen.getByRole('button', { name: 'Set name error' }))

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Sub-field name is required.'
    )
  })
})
