import type { ComponentProps } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddCustomFieldDialog } from './add-custom-field-dialog'
import { useGetCollectionSchema } from '@/utils/hooks/use-get-collection-schema'
import { useOutstatic } from '@/utils/hooks/use-outstatic'
import { useCustomFieldCommit } from './use-custom-field-commit'
import type { CustomFieldsType } from '@/types'

jest.mock('@/utils/hooks/use-get-collection-schema')
jest.mock('@/utils/hooks/use-outstatic')
jest.mock('./use-custom-field-commit')
jest.mock('@/components/ui/shadcn/select', () => {
  const React = require('react')
  const SelectContext = React.createContext<{
    onValueChange?: (value: string) => void
  }>({})

  const Select = ({
    children,
    onValueChange
  }: {
    children: React.ReactNode
    onValueChange?: (value: string) => void
  }) => (
    <SelectContext.Provider value={{ onValueChange }}>
      <div>{children}</div>
    </SelectContext.Provider>
  )

  const SelectTrigger = ({
    children,
    ...props
  }: {
    children: React.ReactNode
  }) => (
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

  const SelectContent = ({ children }: { children: React.ReactNode }) => (
    <div id="mock-select-listbox">{children}</div>
  )

  const SelectItem = ({
    children,
    value
  }: {
    children: React.ReactNode
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

    return {
      values: {
        ...values,
        fieldType:
          typeof values.fieldType === 'string'
            ? values.fieldType
            : fallbackFieldType
      },
      errors: {}
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
  },
  capitalCase: (value: string) =>
    value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}))

const mockUseGetCollectionSchema = useGetCollectionSchema as jest.Mock
const mockUseOutstatic = useOutstatic as jest.Mock
const mockUseCustomFieldCommit = useCustomFieldCommit as jest.Mock

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

describe('<AddCustomFieldDialog />', () => {
  let mockSetHasChanges: jest.Mock
  let mockCommit: jest.Mock

  const renderDialog = (
    overrides: Partial<ComponentProps<typeof AddCustomFieldDialog>> = {}
  ) => {
    const props: ComponentProps<typeof AddCustomFieldDialog> = {
      collection: 'posts',
      showAddModal: true,
      setShowAddModal: jest.fn(),
      customFields: {},
      setCustomFields: jest.fn(),
      ...overrides
    }

    return {
      ...render(<AddCustomFieldDialog {...props} />),
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
    mockUseGetCollectionSchema.mockReturnValue({
      data: null
    })
    mockUseCustomFieldCommit.mockReturnValue(mockCommit)
  })

  it('renders form fields and keeps description input controlled', async () => {
    const user = userEvent.setup()
    renderDialog()

    const descriptionInput = screen.getByPlaceholderText(
      'Ex: Add a category'
    ) as HTMLInputElement
    expect(descriptionInput).toHaveValue('')

    await user.type(descriptionInput, 'A short description')
    expect(descriptionInput).toHaveValue('A short description')
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
      collection: '_singletons',
      singleton: 'new',
      showAddModal: true
    })

    expect(screen.getByText('Save your singleton first')).toBeInTheDocument()
    expect(
      screen.queryByPlaceholderText('Ex: Category')
    ).not.toBeInTheDocument()
  })

  it('syncs custom fields from schema when available', async () => {
    const setCustomFields = jest.fn()
    const schemaProperties: CustomFieldsType = {
      existingField: {
        title: 'Existing Field',
        fieldType: 'String',
        dataType: 'string'
      }
    }

    mockUseGetCollectionSchema.mockReturnValue({
      data: {
        properties: schemaProperties
      }
    })

    renderDialog({ setCustomFields })

    await waitFor(() =>
      expect(setCustomFields).toHaveBeenCalledWith(schemaProperties)
    )
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
    const setShowAddModal = jest.fn()

    renderDialog({ setShowAddModal })

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(setShowAddModal).toHaveBeenCalledWith(false)
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
            element.textContent?.toLowerCase() === 'seotitle'
        )
      ).toBeInTheDocument()
    )
  })
})
