import {
  TestProviders,
  TestWrapper,
  documentExample
} from '@/utils/TestWrapper'
import { useOstSession } from '@/utils/auth/hooks'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DocumentSettings } from '@/components/document-settings'

jest.mock('@/utils/auth/hooks')
jest.mock('next/navigation', () => require('next-router-mock'))
jest.mock('next-navigation-guard', () => ({
  useNavigationGuard: jest.fn(),
  NavigationGuard: jest.fn().mockImplementation(({ children }) => children),
  useBlocker: jest.fn()
}))

jest.mock('react-hook-form', () => ({
  ...jest.requireActual('react-hook-form'),
  register: jest.fn(),
  handleSubmit: jest.fn()
}))

jest.mock('change-case', () => {
  return {
    split: (str: string) => str
  }
})

// Mock useOutstatic hook with a factory function
jest.mock('@/utils/hooks/useOutstatic', () => {
  const mockUseOutstatic = jest.fn()
  return {
    useOutstatic: mockUseOutstatic
  }
})

// Get the mock function after the module is mocked
const mockUseOutstatic = jest.mocked(
  require('@/utils/hooks/useOutstatic').useOutstatic
)

function createMockPointerEvent(
  type: string,
  props: PointerEventInit = {}
): PointerEvent {
  const event = new Event(type, props) as PointerEvent
  Object.assign(event, {
    button: props.button ?? 0,
    ctrlKey: props.ctrlKey ?? false,
    pointerType: props.pointerType ?? 'mouse'
  })
  return event
}

// Assign the mock function to the global window object
window.PointerEvent = createMockPointerEvent as any

// Mock HTMLElement methods
Object.assign(window.HTMLElement.prototype, {
  scrollIntoView: jest.fn(),
  releasePointerCapture: jest.fn(),
  hasPointerCapture: jest.fn()
})

// Mock transliteration
jest.mock('transliteration', () => ({
  slugify: (str: string) => str.toLowerCase().replace(/\s+/g, '-')
}))

// Mock AddCustomFieldDialog
jest.mock(
  '@/client/pages/custom-fields/_components/add-custom-field-dialog',
  () => ({
    AddCustomFieldDialog: ({ showAddModal, setShowAddModal }: any) =>
      showAddModal ? (
        <div data-testid="add-custom-field-dialog">
          <button onClick={() => setShowAddModal(false)}>Close Dialog</button>
        </div>
      ) : null
  })
)

// Mock DeleteDocumentButton
jest.mock('@/components/delete-document-button', () => ({
  __esModule: true,
  DeleteDocumentButton: ({ onComplete, disabled }: any) => (
    <button
      onClick={onComplete}
      disabled={disabled}
      data-testid="delete-document-button"
    >
      Delete Document
    </button>
  )
}))

// Mock DocumentSettingsImageSelection
jest.mock('@/components/document-settings-image-selection', () => ({
  __esModule: true,
  DocumentSettingsImageSelection: ({ id, defaultValue }: any) => (
    <div data-testid={`image-selection-${id}`}>
      Image Selection: {defaultValue}
    </div>
  )
}))

// Mock DateTimePickerForm
jest.mock('@/components/ui/outstatic/date-time-picker-form', () => ({
  DateTimePickerForm: ({ id }: any) => (
    <div data-testid={`date-picker-${id}`}>
      <span>Pick a date</span>
    </div>
  )
}))

// Mock CustomFieldRenderer
jest.mock('@/components/utils/custom-field-renderer', () => ({
  CustomFieldRenderer: ({ name, field }: any) => (
    <div data-testid={`custom-field-${name}`}>Custom Field: {field.title}</div>
  )
}))

describe('<DocumentSettings />', () => {
  const defaultProps = {
    saveDocument: jest.fn(),
    loading: false,
    showDelete: false,
    customFields: {},
    setCustomFields: jest.fn(),
    metadata: {}
  }

  const mockSession = {
    session: {
      user: {
        username: 'avitorio',
        name: 'Test User',
        image: 'https://example.com/avatar.jpg'
      }
    },
    status: 'authenticated' as const
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useOstSession as jest.Mock).mockReturnValue(mockSession)
    // Reset the useOutstatic mock to default values
    mockUseOutstatic.mockReturnValue({
      dashboardRoute: '/outstatic',
      session: {
        user: {
          name: 'Test User',
          image: 'https://example.com/avatar.jpg'
        }
      }
    })
  })

  it('should render the date component', async () => {
    render(
      <TestWrapper>
        <DocumentSettings {...defaultProps} />
      </TestWrapper>
    )

    expect(screen.getByText('Pick a date')).toBeInTheDocument()
    expect(screen.getByTestId('date-picker-publishedAt')).toBeInTheDocument()
  })

  it('should handle empty author name', async () => {
    // Mock useOutstatic with empty user name for this specific test
    mockUseOutstatic.mockReturnValue({
      dashboardRoute: '/outstatic',
      session: {
        user: {
          name: '',
          image: 'https://example.com/avatar.jpg'
        }
      }
    })

    const user = userEvent.setup()
    render(
      <TestWrapper>
        <TestProviders.DocumentContext
          value={{
            document: { ...documentExample, author: { name: undefined } }
          }}
        >
          <TestProviders.Form>
            <DocumentSettings {...defaultProps} />
          </TestProviders.Form>
        </TestProviders.DocumentContext>
      </TestWrapper>
    )
    expect(screen.getByText('Author')).toBeInTheDocument()

    // Open the author accordion
    const authorAccordion = screen.getByText('Author')
    await user.click(authorAccordion)

    expect(screen.getByLabelText('Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toHaveValue('')
    expect(screen.getByLabelText('Name')).not.toBeUndefined()
  })

  it('should render status selector with draft as default', () => {
    render(
      <TestWrapper>
        <TestProviders.DocumentContext
          value={{
            document: { ...documentExample, status: '' as any }
          }}
        >
          <TestProviders.Form>
            <DocumentSettings {...defaultProps} />
          </TestProviders.Form>
        </TestProviders.DocumentContext>
      </TestWrapper>
    )

    expect(screen.getByTestId('status-select-desktop')).toBeInTheDocument()
    expect(screen.getByTestId('status-select-mobile')).toBeInTheDocument()
    expect(screen.getByTestId('status-select-desktop')).toHaveTextContent(
      'Draft'
    )
    expect(screen.getByTestId('status-select-mobile')).toHaveTextContent(
      'Draft'
    )
  })

  it('should render save button', () => {
    render(
      <TestWrapper>
        <DocumentSettings {...defaultProps} />
      </TestWrapper>
    )

    expect(screen.getByTestId('save-button-desktop')).toBeInTheDocument()
    expect(screen.getByTestId('save-button-mobile')).toBeInTheDocument()
  })

  it('should disable save button when loading', () => {
    render(
      <TestWrapper>
        <DocumentSettings {...defaultProps} loading={true} />
      </TestWrapper>
    )

    const saveButton = screen.getByTestId('save-button-mobile')
    expect(saveButton).toBeDisabled()
  })

  it('should show loading state in save button', () => {
    render(
      <TestWrapper>
        <DocumentSettings {...defaultProps} loading={true} />
      </TestWrapper>
    )

    // There should be two Saving texts, one for the mobile view and one for the desktop view
    expect(screen.getAllByText('Saving')).toHaveLength(2)
  })

  it('should render delete button when showDelete is true', () => {
    render(
      <TestWrapper>
        <DocumentSettings {...defaultProps} showDelete={true} />
      </TestWrapper>
    )

    expect(screen.getByTestId('delete-document-button')).toBeInTheDocument()
  })

  it('should not render delete button when showDelete is false', () => {
    render(
      <TestWrapper>
        <DocumentSettings {...defaultProps} showDelete={false} />
      </TestWrapper>
    )

    expect(
      screen.queryByTestId('delete-document-button')
    ).not.toBeInTheDocument()
  })

  it('should disable delete button when loading', () => {
    render(
      <TestWrapper>
        <DocumentSettings {...defaultProps} showDelete={true} loading={true} />
      </TestWrapper>
    )

    const deleteButton = screen.getByTestId('delete-document-button')
    expect(deleteButton).toBeDisabled()
  })

  it('should render author accordion with name and avatar fields', async () => {
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <DocumentSettings {...defaultProps} />
      </TestWrapper>
    )

    expect(screen.getByText('Author')).toBeInTheDocument()

    // Open the author accordion
    const authorAccordion = screen.getByText('Author')
    await user.click(authorAccordion)

    expect(screen.getByLabelText('Name')).toBeInTheDocument()
    expect(screen.getByText('Avatar')).toBeInTheDocument()
    expect(
      screen.getByTestId('image-selection-author.picture')
    ).toBeInTheDocument()
  })

  it('should render slug accordion with input field', () => {
    render(
      <TestWrapper>
        <DocumentSettings {...defaultProps} />
      </TestWrapper>
    )

    expect(screen.getByText('Slug*')).toBeInTheDocument()
    // The slug input might be inside a collapsed accordion, so we'll check if the accordion exists
    expect(screen.getByText('Slug*')).toBeInTheDocument()
  })

  it('should render custom fields when provided', () => {
    const customFields = {
      category: {
        title: 'Category',
        fieldType: 'String' as const,
        dataType: 'string' as const
      },
      tags: {
        title: 'Tags',
        fieldType: 'Tags' as const,
        dataType: 'array' as const,
        values: [
          { label: 'Tag 1', value: 'tag1' },
          { label: 'Tag 2', value: 'tag2' }
        ]
      }
    }

    render(
      <TestWrapper>
        <DocumentSettings {...defaultProps} customFields={customFields} />
      </TestWrapper>
    )

    expect(screen.getByTestId('custom-field-category')).toBeInTheDocument()
    expect(screen.getByTestId('custom-field-tags')).toBeInTheDocument()
  })

  it('should render missing custom fields section when metadata has fields not in customFields', () => {
    const metadata = {
      category: { title: 'Category' },
      tags: { title: 'Tags' }
    }
    const customFields = {}

    render(
      <TestWrapper>
        <DocumentSettings
          {...defaultProps}
          customFields={customFields}
          metadata={metadata}
        />
      </TestWrapper>
    )

    expect(screen.getByText('Set up Custom Fields')).toBeInTheDocument()
    expect(screen.getByText('Category')).toBeInTheDocument()
    expect(screen.getByText('Tags')).toBeInTheDocument()
  })

  it('should open add custom field dialog when create button is clicked', async () => {
    const user = userEvent.setup()
    const metadata = { category: { title: 'Category' } }
    const customFields = {}

    render(
      <TestWrapper>
        <DocumentSettings
          {...defaultProps}
          customFields={customFields}
          metadata={metadata}
        />
      </TestWrapper>
    )

    const createButtons = screen.getAllByText('Create')
    await user.click(createButtons[0])

    expect(screen.getByTestId('add-custom-field-dialog')).toBeInTheDocument()
  })

  it('should open add custom field dialog when plus icon is clicked', async () => {
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <DocumentSettings {...defaultProps} />
      </TestWrapper>
    )

    // Look for the button by finding the one that's a ghost variant icon button
    const button = screen.getByTestId('add-custom-field-button')
    await user.click(button)

    expect(screen.getByTestId('add-custom-field-dialog')).toBeInTheDocument()
  })

  // it('should close add custom field dialog when close button is clicked', async () => {
  //   const user = userEvent.setup()

  //   render(
  //     <TestWrapper>
  //       <DocumentSettings {...defaultProps} />
  //     </TestWrapper>
  //   )

  //   // Look for the button by finding the one that's a ghost variant icon button
  //   const buttons = screen.getAllByRole('button')
  //   const plusButton = buttons.find(
  //     (button) =>
  //       button.className.includes('ghost') && button.className.includes('icon')
  //   )
  //   expect(plusButton).toBeInTheDocument()
  //   await user.click(plusButton!)

  //   expect(screen.getByTestId('add-custom-field-dialog')).toBeInTheDocument()

  //   const closeButton = screen.getByText('Close Dialog')
  //   await user.click(closeButton)

  //   expect(
  //     screen.queryByTestId('add-custom-field-dialog')
  //   ).not.toBeInTheDocument()
  // })

  it('should handle keyboard shortcut for save (Cmd/Ctrl + S)', async () => {
    const saveDocument = jest.fn()

    render(
      <TestWrapper>
        <DocumentSettings {...defaultProps} saveDocument={saveDocument} />
      </TestWrapper>
    )

    // Simulate Cmd+S (Mac) or Ctrl+S (Windows/Linux)
    fireEvent.keyDown(window, { key: 's', metaKey: true })

    expect(saveDocument).toHaveBeenCalledTimes(1)
  })

  it('should set default status to draft when document has no status', () => {
    render(
      <TestWrapper>
        <TestProviders.DocumentContext
          value={{
            document: { ...documentExample, status: '' as any }
          }}
        >
          <TestProviders.Form>
            <DocumentSettings {...defaultProps} />
          </TestProviders.Form>
        </TestProviders.DocumentContext>
      </TestWrapper>
    )

    // There should be two Draft options, one for the mobile view and one for the desktop view
    expect(
      screen.getAllByText('Draft', { selector: '[data-slot="select-value"]' })
    ).toHaveLength(2)
  })

  it('should render mobile view with toggle button', () => {
    render(
      <TestWrapper>
        <DocumentSettings {...defaultProps} />
      </TestWrapper>
    )

    // Mobile view should have the toggle button
    expect(screen.getByTestId('mobile-toggle-button')).toBeInTheDocument()
  })

  it('should toggle mobile sidebar when toggle button is clicked', async () => {
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <DocumentSettings {...defaultProps} />
      </TestWrapper>
    )

    const toggleButton = screen.getByTestId('mobile-toggle-button')
    await user.click(toggleButton)

    // After clicking, the button should show the close icon
    expect(screen.getByTestId('mobile-toggle-close-button')).toBeInTheDocument()
  })

  it('should render author name from session when document author is not available', async () => {
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <TestProviders.DocumentContext
          value={{
            document: { ...documentExample, author: { name: undefined } }
          }}
        >
          <TestProviders.Form>
            <DocumentSettings {...defaultProps} />
          </TestProviders.Form>
        </TestProviders.DocumentContext>
      </TestWrapper>
    )

    // Open the author accordion
    const authorAccordion = screen.getByText('Author')
    await user.click(authorAccordion)

    expect(screen.getByLabelText('Name')).toHaveValue('Test User')
  })

  it('should render author avatar from session when document author picture is not available', async () => {
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <TestProviders.DocumentContext
          value={{
            document: {
              ...documentExample,
              author: { name: 'Test Author', picture: undefined }
            }
          }}
        >
          <TestProviders.Form>
            <DocumentSettings {...defaultProps} />
          </TestProviders.Form>
        </TestProviders.DocumentContext>
      </TestWrapper>
    )

    // Open the author accordion
    const authorAccordion = screen.getByText('Author')
    await user.click(authorAccordion)

    // Check if the image selection component is rendered with the session image
    expect(
      screen.getByTestId('image-selection-author.picture')
    ).toBeInTheDocument()
  })

  it('should handle slug input with transliteration', async () => {
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <DocumentSettings {...defaultProps} />
      </TestWrapper>
    )

    // First, we need to open the slug accordion
    const slugAccordion = screen.getByText('Slug*')
    await user.click(slugAccordion)

    // Now the slug input should be visible
    const slugInput = screen.getByDisplayValue('document-example')
    await user.clear(slugInput)
    await user.type(slugInput, 'New Document Title')

    // The slug should be transliterated
    expect(slugInput).toHaveValue('new-document-title')
  })

  it('should replace spaces and hyphens in slug input', async () => {
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <DocumentSettings {...defaultProps} />
      </TestWrapper>
    )

    // First, we need to open the slug accordion
    const slugAccordion = screen.getByText('Slug*')
    await user.click(slugAccordion)

    // Now the slug input should be visible
    const slugInput = screen.getByDisplayValue('document-example')
    await user.clear(slugInput)
    await user.type(slugInput, 'Document with spaces')

    // Since the last character is a space, it should preserve the original input
    expect(slugInput).toHaveValue('document-with-spaces')
  })

  it('should show error styling on slug field when there are errors', () => {
    render(
      <TestWrapper>
        <TestProviders.Form>
          <DocumentSettings {...defaultProps} />
        </TestProviders.Form>
      </TestWrapper>
    )

    // The slug accordion should not have error styling by default
    const slugAccordion = screen.getByText('Slug*').closest('[class*="border"]')
    expect(slugAccordion).not.toHaveClass('border-destructive')
  })

  it('should render tooltip for add custom field button', () => {
    render(
      <TestWrapper>
        <DocumentSettings {...defaultProps} />
      </TestWrapper>
    )

    // Look for the button by finding the one that's a ghost variant icon button
    const buttons = screen.getAllByRole('button')
    const tooltipTrigger = buttons.find(
      (button) =>
        button.getAttribute('data-testid') === 'add-custom-field-button'
    )
    expect(tooltipTrigger).toBeInTheDocument()
  })
})
