import { render, screen } from '@testing-library/react'
import { TestWrapper } from '../../utils/TestWrapper'
import DocumentsTable from '.'

const posts = [
  {
    title: 'A beautiful day',
    publishedAt: new Date('2022-02-02'),
    status: 'published' as const,
    slug: 'a-beautiful-day',
    author: {
      name: 'John Doe',
      picture: 'https://jdoe.com/picture.jpg'
    }
  }
]

describe('<DocumentsTable />', () => {
  it('should render the heading', () => {
    render(
      <TestWrapper>
        <DocumentsTable documents={posts} collection="posts" />
      </TestWrapper>
    )

    expect(screen.getByRole('row', { name: /Beautiful/i })).toBeInTheDocument()
  })
})
