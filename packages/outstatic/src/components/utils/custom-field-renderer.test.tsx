import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { CustomFieldRenderer } from './custom-field-renderer'
import type { CustomFieldsType, SelectCustomField } from '@/types'

jest.mock('@/components/document-settings-image-selection', () => ({
  DocumentSettingsImageSelection: () => <div />
}))

jest.mock('@/components/ui/outstatic/date-time-picker-form', () => ({
  DateTimePickerForm: ({ id }: { id: string }) => {
    const { FormControl, FormField, FormItem, FormMessage } =
      jest.requireActual<typeof import('@/components/ui/shadcn/form')>(
        '@/components/ui/shadcn/form'
      )
    const { useFormContext } =
      jest.requireActual<typeof import('react-hook-form')>('react-hook-form')
    const { control } = useFormContext()

    return (
      <FormField
        control={control}
        name={id}
        render={({ field }: { field: { value?: string } }) => (
          <FormItem>
            <FormControl>
              <div data-testid={`date-picker-${id}`}>{field.value ?? ''}</div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    )
  }
}))

jest.mock('@/components/ui/outstatic/tag-input', () => ({
  TagInput: () => <div />
}))

jest.mock('@/components/ui/shadcn/accordion', () => ({
  Accordion: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  AccordionItem: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  AccordionTrigger: ({ children }: { children: ReactNode }) => (
    <button type="button">{children}</button>
  ),
  AccordionContent: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  )
}))

jest.mock('@/components/ui/shadcn/select', () => {
  const React = jest.requireActual<typeof import('react')>('react')
  const SelectContext = React.createContext<{
    onValueChange?: (value: string) => void
    value?: string
  }>({})

  const Select = ({
    children,
    onValueChange,
    value
  }: {
    children: ReactNode
    onValueChange?: (value: string) => void
    value?: string
  }) => (
    <SelectContext.Provider value={{ onValueChange, value }}>
      <div>{children}</div>
    </SelectContext.Provider>
  )

  const SelectTrigger = ({ children, ...props }: { children: ReactNode }) => (
    <button
      type="button"
      role="combobox"
      aria-controls="mock-select-listbox"
      aria-expanded="false"
      {...props}
    >
      {children}
    </button>
  )

  const SelectValue = ({ placeholder }: { placeholder?: string }) => {
    const { value } = React.useContext(SelectContext)
    return <span>{value ?? placeholder ?? ''}</span>
  }

  const SelectContent = ({ children }: { children: ReactNode }) => (
    <div id="mock-select-listbox">{children}</div>
  )

  const SelectItem = ({
    children,
    value
  }: {
    children: ReactNode
    value: string
  }) => {
    const { onValueChange } = React.useContext(SelectContext)
    return (
      <button type="button" onClick={() => onValueChange?.(value)}>
        {children}
      </button>
    )
  }

  return {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem
  }
})

const selectField: SelectCustomField = {
  title: 'Category',
  fieldType: 'Select',
  dataType: 'string',
  values: [
    { label: 'News', value: 'news' },
    { label: 'Guides', value: 'guides' }
  ]
}

function RendererHarness({
  field = selectField,
  name = 'category',
  errorMessage,
  defaultValues = {}
}: {
  field?: CustomFieldsType[string]
  name?: string
  errorMessage?: string
  defaultValues?: Record<string, unknown>
}) {
  const methods = useForm({ defaultValues })
  useEffect(() => {
    if (errorMessage) {
      methods.setError(name, { type: 'manual', message: errorMessage })
    }
  }, [errorMessage, methods, name])

  const currentValue = useWatch({
    control: methods.control,
    name
  })

  return (
    <FormProvider {...methods}>
      <div data-testid="current-value">{String(currentValue ?? '')}</div>
      <CustomFieldRenderer
        name={name}
        field={field}
        control={methods.control}
        errors={errorMessage ? { [name]: { message: errorMessage } } : {}}
      />
    </FormProvider>
  )
}

describe('CustomFieldRenderer', () => {
  it('stores the raw option value for a select field', async () => {
    const user = userEvent.setup()

    render(<RendererHarness />)

    await user.click(screen.getByRole('button', { name: 'News' }))

    expect(screen.getByTestId('current-value')).toHaveTextContent('news')
  })

  it('allows clearing an optional select field', async () => {
    const user = userEvent.setup()

    render(<RendererHarness defaultValues={{ category: 'news' }} />)

    await user.click(screen.getByRole('button', { name: 'Clear selection' }))

    expect(screen.getByTestId('current-value')).toHaveTextContent('')
  })

  it('does not render a clear action for required select fields', () => {
    render(
      <RendererHarness
        field={{ ...selectField, required: true }}
        defaultValues={{ category: 'news' }}
      />
    )

    expect(
      screen.queryByRole('button', { name: 'Clear selection' })
    ).not.toBeInTheDocument()
    expect(screen.getByTestId('current-value')).toHaveTextContent('news')
  })

  it('renders a single error message for date fields', async () => {
    const dateField: CustomFieldsType[string] = {
      title: 'Birthday',
      fieldType: 'Date',
      dataType: 'date',
      required: true
    }

    render(
      <RendererHarness
        name="birthday"
        field={dateField}
        errorMessage="Birthday is a required field."
      />
    )

    await screen.findByText('Birthday is a required field.')

    expect(screen.getAllByText('Birthday is a required field.')).toHaveLength(1)
  })
})
