import { TestWrapper } from '@/utils/tests/test-wrapper'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Cookies from 'js-cookie'
import React from 'react'
import { DocumentsTable } from '@/components/documents-table'

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn()
}

jest.mock('next/navigation', () => ({
  useParams: jest.fn().mockReturnValue({ ost: ['testCollection'] }),
  useRouter: jest.fn(() => mockRouter)
}))

jest.mock(
  'next/link',
  () =>
    ({ children }: { children: React.ReactNode }) =>
      children
)

jest.mock('js-cookie', () => ({
  get: jest.fn(() => null),
  set: jest.fn()
}))

jest.mock('change-case', () => {
  return {
    sentenceCase: (str: string) => str
  }
})

const date1 = 'July 14, 2022'
const date2 = 'August 15, 2023'

type MockGetDocumentsData = {
  documents: Record<string, unknown>[]
  metadata: Map<string, string>
}

const defaultDocumentsData: MockGetDocumentsData = {
  documents: [
    {
      slug: 'doc1',
      title: 'Document 1',
      status: 'published',
      publishedAt: date1,
      author: { name: 'Andre' },
      content: 'Test content',
      collection: 'testCollection'
    },
    {
      slug: 'doc2',
      title: 'Document 2',
      status: 'draft',
      publishedAt: date2,
      author: { name: 'Filipe' },
      content: 'Test content',
      collection: 'testCollection'
    }
  ],
  metadata: new Map([
    ['title', 'string'],
    ['publishedAt', 'string'],
    ['status', 'string'],
    ['author', 'string'],
    ['slug', 'string'],
    ['extension', 'string'],
    ['description', 'string']
  ])
}

const mockUseGetDocuments = jest.fn(
  (): { data: MockGetDocumentsData; refetch: jest.Mock } => ({
    data: defaultDocumentsData,
    refetch: jest.fn()
  })
)

jest.mock('@/utils/hooks/use-get-documents', () => ({
  useGetDocuments: () => mockUseGetDocuments()
}))

describe('DocumentsTable', () => {
  beforeEach(() => {
    mockRouter.push.mockClear()
    ;(Cookies.set as jest.Mock).mockClear()
    mockUseGetDocuments.mockImplementation(() => ({
      data: defaultDocumentsData,
      refetch: jest.fn()
    }))
  })

  it('renders a table with provided documents', () => {
    render(
      <TestWrapper>
        <DocumentsTable />
      </TestWrapper>
    )

    expect(screen.getByText('Document 1')).toBeInTheDocument()
    expect(screen.getByText('published')).toBeInTheDocument()
    expect(screen.getByText(date1)).toBeInTheDocument()

    expect(screen.getByText('Document 2')).toBeInTheDocument()
    expect(screen.getByText('draft')).toBeInTheDocument()
    expect(screen.getByText(date2)).toBeInTheDocument()
  })

  it('renders array field values without duplicate key warnings', () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    mockUseGetDocuments.mockImplementation(() => ({
      data: {
        documents: [
          {
            slug: 'doc1',
            title: 'Document 1',
            tags: [
              { label: 'News', value: 'news' },
              { label: 'News', value: 'news' }
            ],
            content: '',
            collection: 'testCollection'
          }
        ],
        metadata: new Map([
          ['title', 'string'],
          ['tags', 'array'],
          ['slug', 'string']
        ])
      },
      refetch: jest.fn()
    }))

    render(
      <TestWrapper>
        <DocumentsTable />
      </TestWrapper>
    )

    expect(screen.getAllByText('News')).toHaveLength(2)
    expect(
      consoleError.mock.calls.some((args) =>
        String(args[0]).includes(
          'Each child in a list should have a unique "key" prop'
        )
      )
    ).toBe(false)

    consoleError.mockRestore()
  })

  it('renders table headers for the default visible columns', () => {
    render(
      <TestWrapper>
        <DocumentsTable />
      </TestWrapper>
    )

    expect(screen.getByRole('button', { name: /^title$/i })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /^published at$/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /^status$/i })
    ).toBeInTheDocument()
  })

  it('renders sort icons for sortable columns', () => {
    render(
      <TestWrapper>
        <DocumentsTable />
      </TestWrapper>
    )

    expect(screen.getByTestId('sort-icon-publishedAt')).toBeInTheDocument()
    expect(screen.getByTestId('sort-icon-title')).toBeInTheDocument()
  })

  it('toggles sort direction when clicking a column header', () => {
    render(
      <TestWrapper>
        <DocumentsTable />
      </TestWrapper>
    )

    expect(screen.getByTestId('caret-down-icon')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /^published at$/i }))
    expect(screen.getByTestId('caret-up-icon')).toBeInTheDocument()
  })

  it('renders the Columns dropdown trigger', () => {
    render(
      <TestWrapper>
        <DocumentsTable />
      </TestWrapper>
    )

    expect(screen.getByRole('button', { name: /columns/i })).toBeInTheDocument()
  })

  it('renders a title filter input', () => {
    render(
      <TestWrapper>
        <DocumentsTable />
      </TestWrapper>
    )

    expect(screen.getByPlaceholderText(/filter titles/i)).toBeInTheDocument()
  })

  it('filters rows by title when typing in the filter input', () => {
    render(
      <TestWrapper>
        <DocumentsTable />
      </TestWrapper>
    )

    const filterInput = screen.getByPlaceholderText(/filter titles/i)

    fireEvent.change(filterInput, { target: { value: 'Document 1' } })

    expect(screen.getByText('Document 1')).toBeInTheDocument()
    expect(screen.queryByText('Document 2')).not.toBeInTheDocument()
  })

  it('opens the editor in a new tab when Cmd/Ctrl/Shift-clicking a row via window.open', () => {
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null)
    render(
      <TestWrapper>
        <DocumentsTable />
      </TestWrapper>
    )

    const row = screen
      .getByText('Document 1')
      .closest('tr') as HTMLTableRowElement

    fireEvent.click(row, { metaKey: true })
    fireEvent.click(row, { ctrlKey: true })
    fireEvent.click(row, { shiftKey: true })

    expect(openSpy).toHaveBeenCalledTimes(3)
    expect(openSpy).toHaveBeenCalledWith(
      '/outstatic/testCollection/doc1',
      '_blank',
      'noopener,noreferrer'
    )
    expect(mockRouter.push).not.toHaveBeenCalled()

    openSpy.mockRestore()
  })

  it('opens the editor in a new tab when middle-clicking a row', () => {
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null)
    render(
      <TestWrapper>
        <DocumentsTable />
      </TestWrapper>
    )

    const row = screen
      .getByText('Document 2')
      .closest('tr') as HTMLTableRowElement
    row.dispatchEvent(new MouseEvent('auxclick', { bubbles: true, button: 1 }))

    expect(openSpy).toHaveBeenCalledWith(
      '/outstatic/testCollection/doc2',
      '_blank',
      'noopener,noreferrer'
    )
    expect(mockRouter.push).not.toHaveBeenCalled()

    openSpy.mockRestore()
  })

  it('does not error when publishedAt is not in metadata (sorts by first column)', () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    mockUseGetDocuments.mockImplementation(() => ({
      data: {
        documents: [
          {
            slug: 'doc1',
            title: 'Document 1',
            status: 'published',
            date: date1,
            content: '',
            collection: 'testCollection'
          }
        ],
        metadata: new Map([
          ['title', 'string'],
          ['date', 'string'],
          ['status', 'string'],
          ['slug', 'string']
        ])
      },
      refetch: jest.fn()
    }))

    render(
      <TestWrapper>
        <DocumentsTable />
      </TestWrapper>
    )

    expect(screen.getByText('Document 1')).toBeInTheDocument()
    expect(screen.getByTestId('sort-icon-title')).toBeInTheDocument()
    expect(
      screen.queryByTestId('sort-icon-publishedAt')
    ).not.toBeInTheDocument()

    const tableErrors = consoleError.mock.calls.filter((args) =>
      String(args[0]).includes("Column with id 'publishedAt'")
    )
    expect(tableErrors).toHaveLength(0)

    consoleError.mockRestore()
  })

  it('persists visible columns via js-cookie when toggling the Columns menu', async () => {
    const user = userEvent.setup()
    render(
      <TestWrapper>
        <DocumentsTable />
      </TestWrapper>
    )

    await user.click(screen.getByRole('button', { name: /columns/i }))
    await user.click(screen.getByRole('menuitemcheckbox', { name: /^slug$/i }))

    expect(Cookies.set).toHaveBeenCalledWith(
      'ost_testCollection_fields',
      expect.any(String)
    )
    const json = (Cookies.set as jest.Mock).mock.calls.find(
      (call) => call[0] === 'ost_testCollection_fields'
    )?.[1] as string
    const stored = JSON.parse(json) as { id: string; value: string }[]
    expect(stored.map((c) => c.value)).not.toContain('slug')
  })
})
