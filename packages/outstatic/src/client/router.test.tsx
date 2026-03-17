import { render, screen } from '@testing-library/react'
import { Router } from './router'

const mockUseCollections = jest.fn()
const mockUseSingletons = jest.fn()
const mockUseOutstatic = jest.fn()
const mockEditSingletonMount = jest.fn()

jest.mock('@/utils/hooks/use-collections', () => ({
  useCollections: () => mockUseCollections()
}))

jest.mock('@/utils/hooks/use-singletons', () => ({
  useSingletons: () => mockUseSingletons()
}))

jest.mock('@/utils/hooks/use-outstatic', () => ({
  useOutstatic: () => mockUseOutstatic()
}))

jest.mock('@/components/admin-loading', () => {
  const React = require('react')

  return {
    AdminLoading: () => React.createElement('div', null, 'Loading')
  }
})

jest.mock('@/components/editor/editor-context', () => {
  const React = require('react')

  return {
    EditorProvider: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children)
  }
})

jest.mock('@/components/ui/outstatic/upgrade-dialog-context', () => {
  const React = require('react')

  return {
    UpgradeDialogProvider: ({
      children
    }: {
      children: React.ReactNode
      feature: string
    }) => React.createElement(React.Fragment, null, children)
  }
})

jest.mock('./pages/custom-fields', () => ({
  __esModule: true,
  default: () => <div>Custom Fields</div>
}))

jest.mock('./pages/collections', () => ({
  __esModule: true,
  default: () => <div>Collections</div>
}))

jest.mock('./pages/singletons', () => ({
  __esModule: true,
  default: () => <div>Singletons</div>
}))

jest.mock('./pages/edit-document', () => ({
  __esModule: true,
  default: ({ collection }: { collection: string }) => (
    <div>Edit document {collection}</div>
  )
}))

jest.mock('./pages/edit-singleton', () => {
  const React = require('react')

  function MockEditSingleton({ slug }: { slug: string }) {
    const initialSlug = React.useRef(slug)

    React.useEffect(() => {
      mockEditSingletonMount(initialSlug.current)
    }, [])

    return React.createElement(
      'div',
      null,
      `Edit singleton ${initialSlug.current}`
    )
  }

  return {
    __esModule: true,
    default: MockEditSingleton
  }
})

jest.mock('./pages/singleton-fields', () => ({
  __esModule: true,
  default: ({ slug }: { slug: string }) => <div>Singleton fields {slug}</div>
}))

jest.mock('./pages/list', () => ({
  __esModule: true,
  default: ({ slug }: { slug: string }) => <div>List {slug}</div>
}))

jest.mock('./pages/settings', () => ({
  __esModule: true,
  default: () => <div>Settings</div>
}))

jest.mock('./pages/media-library', () => ({
  __esModule: true,
  default: () => <div>Media Library</div>
}))

jest.mock('./pages/dashboard', () => ({
  __esModule: true,
  default: () => <div>Dashboard</div>
}))

describe('Router', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockUseCollections.mockReturnValue({
      data: [],
      isPending: false,
      fetchStatus: 'idle'
    })
    mockUseSingletons.mockReturnValue({
      data: [{ slug: 'about', title: 'About' }],
      isPending: false,
      fetchStatus: 'idle'
    })
    mockUseOutstatic.mockReturnValue({
      pages: []
    })
  })

  it('remounts the singleton editor when the singleton route changes', () => {
    const { rerender } = render(
      <Router params={{ ost: ['singletons', 'about'] }} />
    )

    expect(screen.getByText('Edit singleton about')).toBeInTheDocument()
    expect(mockEditSingletonMount).toHaveBeenCalledTimes(1)
    expect(mockEditSingletonMount).toHaveBeenNthCalledWith(1, 'about')

    rerender(<Router params={{ ost: ['singletons', 'new'] }} />)

    expect(screen.getByText('Edit singleton new')).toBeInTheDocument()
    expect(mockEditSingletonMount).toHaveBeenCalledTimes(2)
    expect(mockEditSingletonMount).toHaveBeenNthCalledWith(2, 'new')
  })
})
