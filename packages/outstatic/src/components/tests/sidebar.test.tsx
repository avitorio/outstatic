import { InitialDataContext } from '@/utils/hooks/use-initial-data'
import mockProviderProps from '@/utils/tests/mock-provider-props'
import { TestWrapper } from '@/utils/tests/test-wrapper'
import { render, screen, fireEvent } from '@testing-library/react'
import { act } from 'react'
import { Sidebar } from '@/components/sidebar'

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

jest.mock('pluralize', () => ({
  singular: (str: string) => str.replace(/s$/, '')
}))

const mockUseCollections = jest.fn()
const mockUseSingletons = jest.fn()

jest.mock('@/utils/hooks/use-collections', () => ({
  useCollections: () => mockUseCollections()
}))

jest.mock('@/utils/hooks/use-singletons', () => ({
  useSingletons: () => mockUseSingletons()
}))

describe('<Sidebar />', () => {
  const mockCollections = [
    { title: 'Posts', slug: 'posts' },
    { title: 'Projects', slug: 'projects' }
  ]

  const mockSingletons = [
    { title: 'About Page', slug: 'about-page' },
    { title: 'Contact Info', slug: 'contact-info' }
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

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseCollections.mockReturnValue({ data: [] })
    mockUseSingletons.mockReturnValue({ data: [] })
  })

  const renderSidebar = async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <InitialDataContext.Provider value={mockProviderProps}>
            <Sidebar />
          </InitialDataContext.Provider>
        </TestWrapper>
      )
    })
  }

  describe('with collections only', () => {
    beforeEach(() => {
      mockUseCollections.mockReturnValue({ data: mockCollections })
      mockUseSingletons.mockReturnValue({ data: [] })
    })

    it('renders the Collections section', async () => {
      await renderSidebar()

      expect(screen.getByText('Collections')).toBeInTheDocument()
    })

    it('renders all collection items', async () => {
      await renderSidebar()

      mockCollections.forEach((collection) => {
        expect(screen.getByText(collection.title)).toBeInTheDocument()
      })
    })

    it('does not render Singletons section', async () => {
      await renderSidebar()

      expect(screen.queryByText('Singletons')).not.toBeInTheDocument()
    })

    it('renders create new collection item links', async () => {
      await renderSidebar()

      mockCollections.forEach((collection) => {
        const link = screen.getByLabelText(
          `Create new item in collection ${collection.title}`
        )
        expect(link).toBeInTheDocument()
        expect(link).toHaveAttribute(
          'href',
          `/outstatic/${collection.slug}/new`
        )
      })
    })
  })

  describe('with singletons only', () => {
    beforeEach(() => {
      mockUseCollections.mockReturnValue({ data: [] })
      mockUseSingletons.mockReturnValue({ data: mockSingletons })
    })

    it('renders the Singletons section', async () => {
      await renderSidebar()

      expect(screen.getByText('Singletons')).toBeInTheDocument()
    })

    it('renders all singleton items', async () => {
      await renderSidebar()

      mockSingletons.forEach((singleton) => {
        expect(screen.getByText(singleton.title)).toBeInTheDocument()
      })
    })

    it('does not render Collections section', async () => {
      await renderSidebar()

      expect(screen.queryByText('Collections')).not.toBeInTheDocument()
    })

    it('renders create new singleton link', async () => {
      await renderSidebar()

      const link = screen.getByLabelText('Create new singleton')
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/outstatic/singletons/new')
    })
  })

  describe('with both collections and singletons', () => {
    beforeEach(() => {
      mockUseCollections.mockReturnValue({ data: mockCollections })
      mockUseSingletons.mockReturnValue({ data: mockSingletons })
    })

    it('renders both Collections and Singletons sections', async () => {
      await renderSidebar()

      expect(screen.getByText('Collections')).toBeInTheDocument()
      expect(screen.getByText('Singletons')).toBeInTheDocument()
    })

    it('renders all collection and singleton items', async () => {
      await renderSidebar()

      mockCollections.forEach((collection) => {
        expect(screen.getByText(collection.title)).toBeInTheDocument()
      })

      mockSingletons.forEach((singleton) => {
        expect(screen.getByText(singleton.title)).toBeInTheDocument()
      })
    })

    it('renders Content section as parent', async () => {
      await renderSidebar()

      expect(screen.getByText('Content')).toBeInTheDocument()
    })
  })

  describe('with no content types', () => {
    beforeEach(() => {
      mockUseCollections.mockReturnValue({ data: [] })
      mockUseSingletons.mockReturnValue({ data: [] })
    })

    it('does not render Content section', async () => {
      await renderSidebar()

      expect(screen.queryByText('Content')).not.toBeInTheDocument()
      expect(screen.queryByText('Collections')).not.toBeInTheDocument()
      expect(screen.queryByText('Singletons')).not.toBeInTheDocument()
    })
  })

  describe('static navigation items', () => {
    it('renders Dashboard link', async () => {
      await renderSidebar()

      expect(screen.getAllByText('Dashboard')).toHaveLength(2)
    })

    it('renders Media Library link', async () => {
      await renderSidebar()

      expect(screen.getByText('Media Library')).toBeInTheDocument()
    })

    it('renders Settings link', async () => {
      await renderSidebar()

      expect(screen.getAllByText('Settings')).toHaveLength(2)
    })

    it('renders Bugs & Ideas link', async () => {
      await renderSidebar()

      const link = screen.getByRole('link', { name: 'Bugs & Ideas' })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', 'https://outstatic.featurebase.app/')
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })
  })

  describe('with null data', () => {
    beforeEach(() => {
      mockUseCollections.mockReturnValue({ data: null })
      mockUseSingletons.mockReturnValue({ data: null })
    })

    it('handles null collections gracefully', async () => {
      await renderSidebar()

      expect(screen.queryByText('Collections')).not.toBeInTheDocument()
      expect(screen.queryByText('Singletons')).not.toBeInTheDocument()
    })

    it('still renders static navigation items', async () => {
      await renderSidebar()

      expect(screen.getAllByText('Dashboard')).toHaveLength(2)
      expect(screen.getByText('Media Library')).toBeInTheDocument()
      expect(screen.getAllByText('Settings')).toHaveLength(2)
    })
  })

  describe('keyboard shortcuts', () => {
    it('does not toggle sidebar on cmd+b (metaKey)', async () => {
      await renderSidebar()

      const sidebarWrapper = document.querySelector('[data-state]')
      const initialState = sidebarWrapper?.getAttribute('data-state')

      await act(async () => {
        fireEvent.keyDown(document, { key: 'b', metaKey: true })
      })

      expect(sidebarWrapper?.getAttribute('data-state')).toBe(initialState)
    })

    it('does not toggle sidebar on ctrl+b', async () => {
      await renderSidebar()

      const sidebarWrapper = document.querySelector('[data-state]')
      const initialState = sidebarWrapper?.getAttribute('data-state')

      await act(async () => {
        fireEvent.keyDown(document, { key: 'b', ctrlKey: true })
      })

      expect(sidebarWrapper?.getAttribute('data-state')).toBe(initialState)
    })
  })
})
