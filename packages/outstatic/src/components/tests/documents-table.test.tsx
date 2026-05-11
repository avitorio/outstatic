import { TestWrapper } from '@/utils/tests/test-wrapper'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { DocumentsTable } from '@/components/documents-table'

jest.mock('next/navigation', () => ({
  useParams: jest.fn().mockReturnValue({ ost: ['testCollection'] }),
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn()
  })
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

jest.mock('@/utils/hooks/use-get-documents', () => ({
  useGetDocuments: () => ({
    data: {
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
      metadata: new Map(
        new Map([
          ['title', 'string'],
          ['publishedAt', 'string'],
          ['status', 'string'],
          ['author', 'string'],
          ['slug', 'string'],
          ['extension', 'string'],
          ['description', 'string']
        ])
      )
    },
    refetch: jest.fn()
  })
}))

describe('DocumentsTable', () => {
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

  it('renders table headers for the default visible columns', () => {
    render(
      <TestWrapper>
        <DocumentsTable />
      </TestWrapper>
    )

    expect(screen.getByRole('button', { name: /^title$/i })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /^publishedAt$/i })
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

    fireEvent.click(screen.getByRole('button', { name: /^publishedAt$/i }))
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
})
