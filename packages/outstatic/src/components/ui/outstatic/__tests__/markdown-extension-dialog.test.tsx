import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MarkdownExtensionDialog } from '../markdown-extension-dialog'

describe('MarkdownExtensionDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    fileName: 'my-document.mdx',
    onSave: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render the dialog when open', () => {
    render(<MarkdownExtensionDialog {...defaultProps} />)

    expect(
      screen.getByText('Default format for new documents')
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Choose the format used when you create a new document/)
    ).toBeInTheDocument()
  })

  it('should not render the dialog when closed', () => {
    render(<MarkdownExtensionDialog {...defaultProps} open={false} />)

    expect(
      screen.queryByText('Default format for new documents')
    ).not.toBeInTheDocument()
  })

  it('should display the filename with current extension', () => {
    render(
      <MarkdownExtensionDialog {...defaultProps} fileName="test-doc.mdx" />
    )

    expect(screen.getByText('test-doc.mdx')).toBeInTheDocument()
  })

  it('should have MDX selected by default', () => {
    render(<MarkdownExtensionDialog {...defaultProps} />)

    const mdxRadio = screen.getByRole('radio', { name: /MDX/i })
    expect(mdxRadio).toBeChecked()
  })

  it('should update filename preview when changing format', async () => {
    const user = userEvent.setup()
    render(
      <MarkdownExtensionDialog {...defaultProps} fileName="document.mdx" />
    )

    // Initially shows .mdx
    expect(screen.getByText('document.mdx')).toBeInTheDocument()

    // Click on MD option
    const mdRadio = screen.getByRole('radio', { name: /Markdown \(\.md\)/i })
    await user.click(mdRadio)

    // Should now show .md extension
    expect(screen.getByText('document.md')).toBeInTheDocument()
  })

  it('should call onSave with selected format when Save is clicked', async () => {
    const user = userEvent.setup()
    const onSave = jest.fn()
    render(<MarkdownExtensionDialog {...defaultProps} onSave={onSave} />)

    // Default is mdx
    const saveButton = screen.getByRole('button', { name: 'Save' })
    await user.click(saveButton)

    expect(onSave).toHaveBeenCalledWith('mdx')
  })

  it('should call onSave with md when MD is selected', async () => {
    const user = userEvent.setup()
    const onSave = jest.fn()
    render(<MarkdownExtensionDialog {...defaultProps} onSave={onSave} />)

    // Select MD
    const mdRadio = screen.getByRole('radio', { name: /Markdown \(\.md\)/i })
    await user.click(mdRadio)

    // Click save
    const saveButton = screen.getByRole('button', { name: 'Save' })
    await user.click(saveButton)

    expect(onSave).toHaveBeenCalledWith('md')
  })

  it('should call onOpenChange(false) when Cancel is clicked', async () => {
    const user = userEvent.setup()
    const onOpenChange = jest.fn()
    render(
      <MarkdownExtensionDialog {...defaultProps} onOpenChange={onOpenChange} />
    )

    const cancelButton = screen.getByRole('button', { name: 'Cancel' })
    await user.click(cancelButton)

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('should close the dialog after saving', async () => {
    const user = userEvent.setup()
    const onOpenChange = jest.fn()
    render(
      <MarkdownExtensionDialog {...defaultProps} onOpenChange={onOpenChange} />
    )

    const saveButton = screen.getByRole('button', { name: 'Save' })
    await user.click(saveButton)

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('should display format descriptions', () => {
    render(<MarkdownExtensionDialog {...defaultProps} />)

    expect(screen.getByText('Markdown + components')).toBeInTheDocument()
    expect(screen.getByText('Standard Markdown')).toBeInTheDocument()
  })

  it('should show Save as label', () => {
    render(<MarkdownExtensionDialog {...defaultProps} />)

    expect(screen.getByText('Save as:')).toBeInTheDocument()
  })

  it('should show File format label', () => {
    render(<MarkdownExtensionDialog {...defaultProps} />)

    expect(screen.getByText('File format')).toBeInTheDocument()
  })
})
