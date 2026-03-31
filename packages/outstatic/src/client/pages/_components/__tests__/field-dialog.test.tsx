import type { ComponentProps } from 'react'
import {
  createEvent,
  fireEvent,
  render,
  screen,
  waitFor
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FieldDialog } from '../field-dialog'
import { useFieldSchemaCommit } from '@/utils/hooks/use-field-schema-commit'
import { useOutstatic } from '@/utils/hooks/use-outstatic'

jest.mock('@/utils/hooks/use-field-schema-commit')
jest.mock('@/utils/hooks/use-outstatic')
jest.mock('@/components/ui/outstatic/tag-input', () => ({
  TagInput: ({
    id,
    label = 'Options',
    description
  }: {
    id: string
    label?: string
    description?: string
  }) => {
    const { useFormContext } =
      jest.requireActual<typeof import('react-hook-form')>('react-hook-form')
    const { register, setValue } = useFormContext()

    return (
      <div data-tag-input-root>
        <span>{label}</span>
        {description ? <span>{description}</span> : null}
        <input aria-label={`${label} input`} />
        <input type="hidden" {...register(id)} />
        <button
          type="button"
          onClick={() =>
            setValue(id, [{ label: 'News', value: 'news' }], {
              shouldValidate: true
            })
          }
        >
          Add option
        </button>
      </div>
    )
  },
  preventTagInputEnterSubmit: (event: {
    key: string
    target: EventTarget | null
    preventDefault: () => void
  }) => {
    if (
      event.key === 'Enter' &&
      event.target instanceof HTMLElement &&
      event.target.closest('[data-tag-input-root]')
    ) {
      event.preventDefault()
    }
  }
}))
jest.mock('@/components/ui/shadcn/select', () => {
  const React = jest.requireActual<typeof import('react')>('react')
  const SelectContext = React.createContext<{
    onValueChange?: (value: string) => void
  }>({})

  const Select = ({
    children,
    onValueChange
  }: {
    children: any
    onValueChange?: (value: string) => void
    value?: string
    disabled?: boolean
  }) => (
    <SelectContext.Provider value={{ onValueChange }}>
      <div>{children}</div>
    </SelectContext.Provider>
  )

  const SelectTrigger = ({ children, ...props }: { children: any }) => (
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

  const SelectValue = ({ placeholder }: { placeholder?: string }) => (
    <span>{placeholder ?? ''}</span>
  )

  const SelectContent = ({ children }: { children: any }) => (
    <div id="mock-select-listbox">{children}</div>
  )

  const SelectItem = ({
    children,
    value
  }: {
    children: any
    value: string
  }) => {
    const { onValueChange } = React.useContext(SelectContext)
    return (
      <button
        type="button"
        role="option"
        aria-selected="false"
        onClick={() => onValueChange?.(value)}
      >
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
jest.mock('@hookform/resolvers/zod', () => ({
  zodResolver: () => (values: Record<string, unknown>) => {
    const fallbackFieldType =
      values.title === 'Tags' ? 'Tags' : ('String' as const)
    const fieldType =
      typeof values.fieldType === 'string'
        ? values.fieldType
        : fallbackFieldType
    const selectHasOptions =
      Array.isArray(values.values) && values.values.length > 0

    return {
      values: {
        ...values,
        fieldType
      },
      errors:
        fieldType === 'Select' && !selectHasOptions
          ? {
              values: {
                type: 'custom',
                message: 'Add at least one option for a Select field.'
              }
            }
          : {}
    }
  }
}))
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

const mockUseOutstatic = useOutstatic as jest.Mock
const mockUseFieldSchemaCommit = useFieldSchemaCommit as jest.Mock

const hasUncontrolledInputWarning = (calls: unknown[][]) =>
  calls.some((call) =>
    call.some(
      (arg) =>
        typeof arg === 'string' &&
        arg.includes(
          'A component is changing an uncontrolled input to be controlled'
        )
    )
  )

describe('<FieldDialog />', () => {
  let mockSetHasChanges: jest.Mock
  let mockCommit: jest.Mock

  const renderDialog = (
    overrides: Partial<ComponentProps<typeof FieldDialog>> = {}
  ) => {
    const props: ComponentProps<typeof FieldDialog> = {
      mode: 'add',
      open: true,
      onOpenChange: jest.fn(),
      target: {
        kind: 'collection',
        slug: 'posts',
        title: 'Posts'
      },
      customFields: {},
      setCustomFields: jest.fn(),
      ...overrides
    }

    return {
      ...render(<FieldDialog {...props} />),
      props
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockSetHasChanges = jest.fn()
    mockCommit = jest.fn().mockResolvedValue(true)

    mockUseOutstatic.mockReturnValue({
      setHasChanges: mockSetHasChanges
    })
    mockUseFieldSchemaCommit.mockReturnValue(mockCommit)
  })

  it('renders add mode for a singleton target and keeps description controlled', async () => {
    const user = userEvent.setup()

    renderDialog({
      target: {
        kind: 'singleton',
        slug: 'about',
        title: 'About'
      }
    })

    expect(screen.getByText('Add Custom Field to About')).toBeInTheDocument()

    const descriptionInput = screen.getByPlaceholderText(
      'Ex: Add a category'
    ) as HTMLInputElement
    expect(descriptionInput).toHaveValue('')

    await user.type(descriptionInput, 'Singleton field description')
    expect(descriptionInput).toHaveValue('Singleton field description')
  })

  it('does not log uncontrolled-to-controlled warning when typing description', async () => {
    const user = userEvent.setup()
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    renderDialog()

    await user.type(
      screen.getByPlaceholderText('Ex: Add a category'),
      'Description'
    )

    expect(hasUncontrolledInputWarning(consoleErrorSpy.mock.calls)).toBe(false)
    consoleErrorSpy.mockRestore()
  })

  it('shows save-first modal for unsaved singletons', () => {
    renderDialog({
      target: {
        kind: 'singleton',
        slug: 'new',
        title: 'About',
        isNew: true
      }
    })

    expect(screen.getByText('Save your singleton first')).toBeInTheDocument()
    expect(
      screen.queryByPlaceholderText('Ex: Category')
    ).not.toBeInTheDocument()
  })

  it('disables field name when a field title is prefilled', () => {
    renderDialog({ fieldTitle: 'Category' })

    const titleInput = screen.getByPlaceholderText(
      'Ex: Category'
    ) as HTMLInputElement
    expect(titleInput).toHaveValue('Category')
    expect(titleInput).toBeDisabled()
  })

  it('closes dialog and clears change state when canceling', async () => {
    const user = userEvent.setup()
    const onOpenChange = jest.fn()

    renderDialog({ onOpenChange })

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(mockSetHasChanges).toHaveBeenCalledWith(false)
  })

  it('updates frontend field key preview as title changes', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.type(screen.getByPlaceholderText('Ex: Category'), 'SEO Title')

    await waitFor(() =>
      expect(
        screen.getByText(
          (_, element) =>
            element?.tagName.toLowerCase() === 'code' &&
            element.textContent?.toLowerCase() === 'seoTitle'.toLowerCase()
        )
      ).toBeInTheDocument()
    )
  })

  it('blocks saving a select field without options', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.type(screen.getByPlaceholderText('Ex: Category'), 'Category')
    await user.click(screen.getByRole('option', { name: 'Select' }))
    await user.click(screen.getByRole('button', { name: 'Add' }))

    await waitFor(() => expect(mockCommit).not.toHaveBeenCalled())
  })

  it('shows tag suggestions input and submits seeded values when adding a tags field', async () => {
    const user = userEvent.setup()
    const setCustomFields = jest.fn()

    renderDialog({ setCustomFields })

    await user.type(screen.getByPlaceholderText('Ex: Category'), 'Topics')
    await user.click(screen.getByRole('option', { name: 'Tags' }))

    expect(screen.getByText('Your tags')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Add starter tags to seed suggestions for editors. Documents can still use other tags.'
      )
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Add option' }))
    fireEvent.submit(document.querySelector('form') as HTMLFormElement)

    await waitFor(() => expect(mockCommit).toHaveBeenCalledTimes(1))
    expect(mockCommit).toHaveBeenCalledWith({
      action: 'add',
      customFields: {
        topics: {
          title: 'Topics',
          fieldType: 'Tags',
          dataType: 'array',
          description: '',
          required: false,
          values: [{ label: 'News', value: 'news' }]
        }
      },
      fieldName: 'topics'
    })
    expect(setCustomFields).toHaveBeenCalledWith({
      topics: {
        title: 'Topics',
        fieldType: 'Tags',
        dataType: 'array',
        description: '',
        required: false,
        values: [{ label: 'News', value: 'news' }]
      }
    })
  })

  it('prevents enter inside the options input from submitting the dialog', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.type(screen.getByPlaceholderText('Ex: Category'), 'Category')
    await user.click(screen.getByRole('option', { name: 'Select' }))

    const optionsInput = screen.getByLabelText('Options input')
    const enterEvent = createEvent.keyDown(optionsInput, { key: 'Enter' })

    fireEvent(optionsInput, enterEvent)

    expect(enterEvent.defaultPrevented).toBe(true)
    expect(mockCommit).not.toHaveBeenCalled()
  })

  it('blocks reserved field names', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.type(screen.getByPlaceholderText('Ex: Category'), 'Title')
    await user.click(screen.getByRole('option', { name: 'String' }))
    await user.click(screen.getByRole('button', { name: 'Add' }))

    await waitFor(() => expect(mockCommit).not.toHaveBeenCalled())
    expect(screen.getByText('Add Custom Field to Posts')).toBeInTheDocument()
  })

  it('blocks duplicate field names', async () => {
    const user = userEvent.setup()
    renderDialog({
      customFields: {
        heroTitle: {
          title: 'Hero Title',
          fieldType: 'String',
          dataType: 'string'
        }
      }
    })

    await user.type(screen.getByPlaceholderText('Ex: Category'), 'Hero Title')
    await user.click(screen.getByRole('option', { name: 'String' }))
    fireEvent.submit(document.querySelector('form') as HTMLFormElement)

    await waitFor(() => expect(mockCommit).not.toHaveBeenCalled())
    expect(screen.getByText('Add Custom Field to Posts')).toBeInTheDocument()
  })

  it('submits add mode and updates fields for a singleton target', async () => {
    const user = userEvent.setup()
    const setCustomFields = jest.fn()
    const target = {
      kind: 'singleton' as const,
      slug: 'about',
      title: 'About'
    }

    renderDialog({
      target,
      setCustomFields
    })

    expect(mockUseFieldSchemaCommit).toHaveBeenCalledWith(target)

    await user.type(screen.getByPlaceholderText('Ex: Category'), 'Hero Title')
    await user.click(screen.getByRole('option', { name: 'String' }))
    fireEvent.submit(document.querySelector('form') as HTMLFormElement)

    await waitFor(() => expect(mockCommit).toHaveBeenCalledTimes(1))
    expect(mockCommit).toHaveBeenCalledWith({
      action: 'add',
      customFields: {
        heroTitle: {
          title: 'Hero Title',
          fieldType: 'String',
          dataType: 'string',
          description: '',
          required: false
        }
      },
      fieldName: 'heroTitle'
    })
    expect(setCustomFields).toHaveBeenCalledWith({
      heroTitle: {
        title: 'Hero Title',
        fieldType: 'String',
        dataType: 'string',
        description: '',
        required: false
      }
    })
  })

  it('keeps the add dialog open and re-enables submit when the commit fails', async () => {
    const user = userEvent.setup()
    const onOpenChange = jest.fn()
    const setCustomFields = jest.fn()
    mockCommit.mockResolvedValue(false)

    renderDialog({
      onOpenChange,
      setCustomFields
    })

    await user.type(screen.getByPlaceholderText('Ex: Category'), 'Hero Title')
    await user.click(screen.getByRole('option', { name: 'String' }))
    fireEvent.submit(document.querySelector('form') as HTMLFormElement)

    await waitFor(() => expect(mockCommit).toHaveBeenCalledTimes(1))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Add' })).toBeEnabled()
    )

    expect(onOpenChange).not.toHaveBeenCalled()
    expect(setCustomFields).not.toHaveBeenCalled()
    expect(screen.getByText('Add Custom Field to Posts')).toBeInTheDocument()
  })

  it('renders edit mode with locked field name/type and saves changes', async () => {
    const user = userEvent.setup()
    const setCustomFields = jest.fn()

    renderDialog({
      mode: 'edit',
      target: {
        kind: 'collection',
        slug: 'posts',
        title: 'Posts'
      },
      selectedField: 'category',
      setCustomFields,
      customFields: {
        category: {
          title: 'Category',
          fieldType: 'Select',
          dataType: 'string',
          description: 'Used for filtering',
          required: true,
          values: [{ label: 'News', value: 'news' }]
        }
      }
    })

    expect(
      screen.getByText(
        'Field name and field type editing are disabled to avoid data conflicts.'
      )
    ).toBeInTheDocument()
    expect(screen.getByDisplayValue('Category')).toBeDisabled()
    expect(screen.getByText('Edit Category')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Add option' })
    ).toBeInTheDocument()

    const descriptionInput = screen.getByDisplayValue('Used for filtering')
    await user.clear(descriptionInput)
    await user.type(descriptionInput, 'Primary category')
    fireEvent.submit(document.querySelector('form') as HTMLFormElement)

    await waitFor(() => expect(mockCommit).toHaveBeenCalledTimes(1))
    expect(mockCommit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'edit',
        fieldName: 'category',
        customFields: expect.objectContaining({
          category: expect.objectContaining({
            title: 'Category',
            description: 'Primary category'
          })
        })
      })
    )
    expect(setCustomFields).toHaveBeenCalledWith(
      expect.objectContaining({
        category: expect.objectContaining({
          title: 'Category',
          description: 'Primary category'
        })
      })
    )
  })
})
