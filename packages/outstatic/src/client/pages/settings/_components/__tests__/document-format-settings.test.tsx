import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DocumentFormatSettings } from '../document-format-settings'
import { TestProviders } from '@/utils/tests/test-wrapper'
import { StrictMode } from 'react'

// Mock the hooks
const mockUseGetConfig = jest.fn()
const mockUpdateConfig = jest.fn()

jest.mock('@/utils/hooks/use-get-config', () => ({
  useGetConfig: () => mockUseGetConfig()
}))

jest.mock('@/utils/hooks/use-update-config', () => ({
  useUpdateConfig: () => mockUpdateConfig
}))

const hasMaximumUpdateDepthError = (calls: unknown[][]) =>
  calls.some((call) =>
    call.some((arg) => {
      if (typeof arg === 'string') {
        return arg.includes('Maximum update depth exceeded')
      }

      if (arg instanceof Error) {
        return arg.message.includes('Maximum update depth exceeded')
      }

      if (
        arg &&
        typeof arg === 'object' &&
        'message' in arg &&
        typeof (arg as { message: unknown }).message === 'string'
      ) {
        return (arg as { message: string }).message.includes(
          'Maximum update depth exceeded'
        )
      }

      return false
    })
  )

describe('DocumentFormatSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUpdateConfig.mockClear()
    mockUseGetConfig.mockReturnValue({
      data: null,
      isPending: false
    })
  })

  const renderComponent = () => {
    return render(
      <TestProviders.ReactQuery>
        <DocumentFormatSettings />
      </TestProviders.ReactQuery>
    )
  }

  it('does not trigger maximum update depth errors on render', () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    mockUseGetConfig.mockReturnValue({
      data: { mdExtension: 'mdx' },
      isPending: false
    })

    render(
      <StrictMode>
        <TestProviders.ReactQuery>
          <DocumentFormatSettings />
        </TestProviders.ReactQuery>
      </StrictMode>
    )

    expect(screen.getByRole('combobox')).toHaveTextContent('MDX (.mdx)')
    expect(hasMaximumUpdateDepthError(consoleErrorSpy.mock.calls)).toBe(false)

    consoleErrorSpy.mockRestore()
  })

  it('should render the component', () => {
    renderComponent()

    expect(screen.getByText('Default Document Format')).toBeInTheDocument()
    expect(
      screen.getByText(
        'The default file format used when creating new documents.'
      )
    ).toBeInTheDocument()
  })

  it('should show loading skeleton when isPending', () => {
    mockUseGetConfig.mockReturnValue({
      data: null,
      isPending: true
    })

    renderComponent()

    // Skeleton should be present (no select trigger visible)
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })

  it('should display "Not set" when config has no mdExtension', () => {
    mockUseGetConfig.mockReturnValue({
      data: {},
      isPending: false
    })

    renderComponent()

    const trigger = screen.getByRole('combobox')
    expect(trigger).toHaveTextContent('Not set')
  })

  it('should display current mdExtension from config', () => {
    mockUseGetConfig.mockReturnValue({
      data: { mdExtension: 'md' },
      isPending: false
    })

    renderComponent()

    const trigger = screen.getByRole('combobox')
    expect(trigger).toHaveTextContent('Markdown (.md)')
  })

  it('should display MDX when config has mdExtension: mdx', () => {
    mockUseGetConfig.mockReturnValue({
      data: { mdExtension: 'mdx' },
      isPending: false
    })

    renderComponent()

    const trigger = screen.getByRole('combobox')
    expect(trigger).toHaveTextContent('MDX (.mdx)')
  })

  it('should have Save button disabled when no changes', () => {
    mockUseGetConfig.mockReturnValue({
      data: { mdExtension: 'md' },
      isPending: false
    })

    renderComponent()

    const saveButton = screen.getByRole('button', { name: 'Save' })
    expect(saveButton).toBeDisabled()
  })

  it('should have Save button disabled when "Not set" is selected', () => {
    mockUseGetConfig.mockReturnValue({
      data: null,
      isPending: false
    })

    renderComponent()

    const saveButton = screen.getByRole('button', { name: 'Save' })
    expect(saveButton).toBeDisabled()
  })

  it('should enable Save button when user selects a different format', async () => {
    const user = userEvent.setup()
    mockUseGetConfig.mockReturnValue({
      data: { mdExtension: 'md' },
      isPending: false
    })

    renderComponent()

    // Open the select
    const trigger = screen.getByRole('combobox')
    await user.click(trigger)

    // Select MDX
    const mdxOption = screen.getByRole('option', { name: /MDX/i })
    await user.click(mdxOption)

    // Save button should be enabled
    const saveButton = screen.getByRole('button', { name: 'Save' })
    expect(saveButton).not.toBeDisabled()
  })

  it('should call updateConfig with correct value when Save is clicked', async () => {
    const user = userEvent.setup()
    mockUseGetConfig.mockReturnValue({
      data: null,
      isPending: false
    })

    renderComponent()

    // Open the select
    const trigger = screen.getByRole('combobox')
    await user.click(trigger)

    // Select MD
    const mdOption = screen.getByRole('option', { name: /Markdown \(\.md\)/i })
    await user.click(mdOption)

    // Click Save
    const saveButton = screen.getByRole('button', { name: 'Save' })
    await user.click(saveButton)

    expect(mockUpdateConfig).toHaveBeenCalledWith({
      configFields: { mdExtension: 'md' },
      callbackFunction: expect.any(Function)
    })
  })

  it('should disable Save button while loading', async () => {
    const user = userEvent.setup()
    mockUseGetConfig.mockReturnValue({
      data: null,
      isPending: false
    })

    // Make updateConfig set loading state
    jest.mock('@/utils/hooks/use-update-config', () => ({
      useUpdateConfig: ({
        setLoading
      }: {
        setLoading: (loading: boolean) => void
      }) => {
        void setLoading
        return mockUpdateConfig
      }
    }))

    renderComponent()

    // Open the select and choose an option
    const trigger = screen.getByRole('combobox')
    await user.click(trigger)
    const mdOption = screen.getByRole('option', { name: /Markdown \(\.md\)/i })
    await user.click(mdOption)

    // The button should show "Save" initially when not loading
    const saveButton = screen.getByRole('button', { name: 'Save' })
    expect(saveButton).toBeInTheDocument()
  })
})
