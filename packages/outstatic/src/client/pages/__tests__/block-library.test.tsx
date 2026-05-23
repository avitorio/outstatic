import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import BlockLibrary from '../block-library'
import { useGetBlocks } from '@/utils/hooks/use-get-blocks'
import { usePermissions } from '@/utils/hooks'

jest.mock('@/utils/hooks/use-get-blocks')
jest.mock('@/utils/hooks', () => ({
  usePermissions: jest.fn()
}))
jest.mock('@/components/admin-layout', () => ({
  AdminLayout: ({
    children,
    title
  }: {
    children: ReactNode
    title: string
  }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  )
}))
jest.mock('@/components/admin-loading', () => ({
  AdminLoading: () => <div data-testid="admin-loading">Loading</div>
}))
jest.mock('../_components/block-dialog', () => ({
  BlockDialog: ({ open, mode }: { open: boolean; mode: 'add' | 'edit' }) =>
    open ? (
      <div role="dialog">{mode === 'add' ? 'Add Block' : 'Edit Block'}</div>
    ) : null
}))
jest.mock('../_components/delete-block-dialog', () => ({
  DeleteBlockDialog: () => null
}))

const mockUseGetBlocks = useGetBlocks as jest.Mock
const mockUsePermissions = usePermissions as jest.Mock

describe('<BlockLibrary />', () => {
  const blocks = [
    {
      name: 'Callout',
      description: 'Highlighted content',
      keywords: ['note'],
      props: []
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseGetBlocks.mockReturnValue({
      data: {
        blocks: {
          blocks
        }
      },
      isLoading: false
    })
  })

  it('hides block creation actions when collections.manage is missing', () => {
    mockUsePermissions.mockReturnValue({
      canManageCollections: false
    })

    render(<BlockLibrary />)

    expect(
      screen.queryByRole('button', { name: 'Add Block' })
    ).not.toBeInTheDocument()
  })

  it('allows users with collections.manage to open the add block dialog', () => {
    mockUsePermissions.mockReturnValue({
      canManageCollections: true
    })

    render(<BlockLibrary />)

    fireEvent.click(screen.getByRole('button', { name: 'Add Block' }))

    expect(screen.getByRole('dialog')).toHaveTextContent('Add Block')
  })
})
