import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { Document } from '../../types'
import { dateToString } from '../../utils/tests/utils'
import DocumentsTable from './'

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
  const date1 = new Date('2023-01-01T00:00:00Z')
  const date2 = new Date('2023-02-01T00:00:00Z')

  const mockDocuments: Document[] = [
    {
      slug: 'doc1',
      title: 'Document 1',
      status: 'published',
      publishedAt: date1,
      author: { name: 'Andre' },
      content: 'Test content'
    },
    {
      slug: 'doc2',
      title: 'Document 2',
      status: 'draft',
      publishedAt: date2,
      author: { name: 'Filipe' },
      content: 'Test content'
    }
  ]

  const collection = 'testCollection'

  it('renders a table with provided documents', () => {
    render(<DocumentsTable documents={mockDocuments} collection={collection} />)

    expect(screen.getByText('Document 1')).toBeInTheDocument()
    expect(screen.getByText('published')).toBeInTheDocument()
    expect(screen.getByText(dateToString(date1))).toBeInTheDocument()

    expect(screen.getByText('Document 2')).toBeInTheDocument()
    expect(screen.getByText('draft')).toBeInTheDocument()
    expect(screen.getByText(dateToString(date2))).toBeInTheDocument()
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
