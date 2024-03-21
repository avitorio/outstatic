import { OstDocument } from '@/types/public'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
    render(<DocumentsTable documents={mockDocuments} collection={collection} />)

    expect(screen.getByText('Document 1')).toBeInTheDocument()
    expect(screen.getByText('published')).toBeInTheDocument()
    expect(screen.getByText(date1)).toBeInTheDocument()

    expect(screen.getByText('Document 2')).toBeInTheDocument()
    expect(screen.getByText('draft')).toBeInTheDocument()
    expect(screen.getByText(date2)).toBeInTheDocument()
  })

  it('removes a document from the table when the Delete button is clicked', async () => {
    render(<DocumentsTable documents={mockDocuments} collection={collection} />)

    expect(screen.getByText('Document 1')).toBeInTheDocument()

    const deleteButtons = screen.getAllByTestId('delete-button')
    expect(deleteButtons.length).toEqual(2)

    await act(async () => {
      await userEvent.click(deleteButtons[0])
    })

    await waitFor(() => {
      expect(screen.queryByText('Document 1')).toBeNull()
    })
  })
})
