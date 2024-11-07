import { InitialDataContext } from '@/utils/hooks/useInitialData'
import mockProviderProps from '@/utils/tests/mockProviderProps'
import { TestWrapper } from '@/utils/TestWrapper'
import { render, screen } from '@testing-library/react'
import { act } from 'react'
import { Sidebar } from './'

jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      prefetch: () => null
    }
  },
  usePathname: () => '/test-path'
}))

jest.mock('js-cookie', () => ({
  get: jest.fn(() => null),
  set: jest.fn()
}))

jest.mock('@/utils/generateUniqueId', () => jest.fn())

jest.mock('@/utils/hooks/useCollections', () => ({
  useCollections: () => ({
    data: [
      {
        title: 'Collection 1',
        slug: 'collection-1'
      },
      {
        title: 'Collection 2',
        slug: 'collection-2'
      }
    ]
  })
}))

jest.mock('pluralize', () => ({
  singular: (str: string) => str
}))

describe('<Sidebar />', () => {
  const mockCollections = [
    {
      title: 'Collection 1',
      slug: 'collection-1'
    },
    {
      title: 'Collection 2',
      slug: 'collection-2'
    }
  ]

  const fetchMock = jest.fn(() =>
    Promise.resolve({
      json: () =>
        Promise.resolve({
          title: 'Test Title',
          content: 'Test Content',
          link: 'Test Link'
        })
    })
  )

  global.fetch = fetchMock as jest.Mock

  it('should render the component correctly', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <InitialDataContext.Provider value={mockProviderProps}>
            <Sidebar isOpen={true} />
          </InitialDataContext.Provider>
        </TestWrapper>
      )
    })

    expect(screen.getByLabelText('Sidebar')).toBeInTheDocument()
    expect(screen.getByText('Collections')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getByText('Documentation')).toBeInTheDocument()

    mockCollections.forEach((collection) => {
      expect(screen.getByText(collection.title)).toBeInTheDocument()
    })
  })
})
