import { TestWrapper } from '@/utils/TestWrapper'
import { render, screen } from '@testing-library/react'
import React from 'react'
import DocumentsTable from './'

jest.mock('next/navigation', () => ({
  useParams: jest.fn().mockReturnValue({ ost: ['testCollection'] })
}))

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

const date1 = 'July 14, 2022'
const date2 = 'August 15, 2023'

jest.mock('@/utils/hooks/useGetDocuments', () => ({
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
})
