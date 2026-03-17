import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import type { ReactNode } from 'react'
import { CustomFieldRenderer } from './custom-field-renderer'
import type { SelectCustomField } from '@/types'

jest.mock('@/components/document-settings-image-selection', () => ({
  DocumentSettingsImageSelection: () => <div />
}))

jest.mock('@/components/ui/outstatic/date-time-picker-form', () => ({
  DateTimePickerForm: () => <div />
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
  defaultValues = {}
}: {
  field?: SelectCustomField
  defaultValues?: Record<string, unknown>
}) {
  const methods = useForm({ defaultValues })
  const currentValue = useWatch({
    control: methods.control,
    name: 'category'
  })

  return (
    <FormProvider {...methods}>
      <div data-testid="current-value">{String(currentValue ?? '')}</div>
      <CustomFieldRenderer
        name="category"
        field={field}
        control={methods.control}
        errors={{}}
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
})
