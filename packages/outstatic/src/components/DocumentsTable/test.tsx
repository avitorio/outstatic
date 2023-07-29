import React from 'react'
import { render, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DocumentsTable from './'
import { Document } from '../../types'

jest.mock(
  'next/link',
  () =>
    ({ children }: { children: React.ReactNode }) =>
      children
)

// Mock the DeleteDocumentButton component
jest.mock('../DeleteDocumentButton', () => {
  return jest.fn(({ onComplete }) => (
    <button onClick={onComplete} data-testid="delete-button">
      Delete
    </button>
  ))
})

describe('DocumentsTable', () => {
  const mockDocuments: Document[] = [
    {
      slug: 'doc1',
      title: 'Document 1',
      status: 'published',
      publishedAt: new Date('2023-01-01T00:00:00Z'),
      author: { name: 'Andre' },
      content: 'Test content'
    },
    {
      slug: 'doc2',
      title: 'Document 2',
      status: 'draft',
      publishedAt: new Date('2023-02-01T00:00:00Z'),
      author: { name: 'Filipe' },
      content: 'Test content'
    }
  ]

  const collection = 'testCollection'

  it('renders a table with provided documents', () => {
    render(<DocumentsTable documents={mockDocuments} collection={collection} />)

    expect(screen.getByText('Document 1')).toBeInTheDocument()
    expect(screen.getByText('published')).toBeInTheDocument()
    expect(screen.getByText('January 1, 2023')).toBeInTheDocument()

    expect(screen.getByText('Document 2')).toBeInTheDocument()
    expect(screen.getByText('draft')).toBeInTheDocument()
    expect(screen.getByText('February 1, 2023')).toBeInTheDocument()
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
