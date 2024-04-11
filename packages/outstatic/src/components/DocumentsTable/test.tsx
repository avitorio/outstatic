import { OstDocument } from '@/types/public'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import DocumentsTable from './'

jest.mock(
  'next/link',
  () =>
    ({ children }: { children: React.ReactNode }) =>
      children
)

jest.mock('change-case', () => {
  return {
    sentenceCase: (str: string) => str
  }
})

// Mock the DeleteDocumentButton component
jest.mock('@/components/DeleteDocumentButton', () => {
  return jest.fn(({ onComplete }) => (
    <button onClick={onComplete} data-testid="delete-button">
      Delete
    </button>
  ))
})

describe('DocumentsTable', () => {
  const date1 = 'July 14, 2022'
  const date2 = 'August 15, 2023'

  const mockDocuments: OstDocument[] = [
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
  ]

  const collection = 'testCollection'

  it('renders a table with provided documents', () => {
    render(<DocumentsTable />)

    expect(screen.getByText('Document 1')).toBeInTheDocument()
    expect(screen.getByText('published')).toBeInTheDocument()
    expect(screen.getByText(date1)).toBeInTheDocument()

    expect(screen.getByText('Document 2')).toBeInTheDocument()
    expect(screen.getByText('draft')).toBeInTheDocument()
    expect(screen.getByText(date2)).toBeInTheDocument()
  })

  it('removes a document from the table when the Delete button is clicked', async () => {
    render(<DocumentsTable />)

    // Click the delete button for the first document
    fireEvent.click(screen.getAllByTestId('delete-button')[0])
    fireEvent.click(screen.getByText('Delete'))
    await waitFor(() => {
      expect(screen.queryByText('Document 1')).toBeNull()
    })
  })

  it('sorts the table by title in ascending and descending order', () => {
    render(<DocumentsTable documents={mockDocuments} collection={collection} />)

    // Click the title column header to sort ascending
    fireEvent.click(screen.getByText('Title'))

    const sortedAsc = screen
      .getAllByText(/Document/)
      .map((node) => node.textContent)
    expect(sortedAsc).toEqual(['Document 1', 'Document 2'])

    // Click the title column header again to sort descending
    fireEvent.click(screen.getByText('Title'))

    const sortedDesc = screen
      .getAllByText(/Document/)
      .map((node) => node.textContent)
    expect(sortedDesc).toEqual(['Document 2', 'Document 1'])
  })

  it('sorts the table by status in ascending and descending order', () => {
    render(<DocumentsTable documents={mockDocuments} collection={collection} />)

    // Click the status column header to sort ascending
    fireEvent.click(screen.getByText('Status'))

    const sortedAsc = screen
      .getAllByTestId('status-cell')
      .map((node) => (node.textContent as string).trim())
    expect(sortedAsc).toEqual(['draft', 'published'])

    // Click the status column header again to sort descending
    fireEvent.click(screen.getByText('Status'))

    const sortedDesc = screen
      .getAllByTestId('status-cell')
      .map((node) => (node.textContent as string).trim())
    expect(sortedDesc).toEqual(['published', 'draft'])
  })

  it('sorts the table by publishedAt in ascending and descending order', () => {
    render(<DocumentsTable documents={mockDocuments} collection={collection} />)

    // Click the publishedAt column header to sort ascending
    fireEvent.click(screen.getByText('Published at'))

    const sortedAsc = screen
      .getAllByText(/July|August/)
      .map((node) => node.textContent)
    expect(sortedAsc).toEqual([date1, date2])

    // Click the publishedAt column header again to sort descending
    fireEvent.click(screen.getByText('Published at'))

    const sortedDesc = screen
      .getAllByText(/July|August/)
      .map((node) => node.textContent)
    expect(sortedDesc).toEqual([date2, date1])
  })
})
