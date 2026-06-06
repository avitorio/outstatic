import type { ReactNode } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { FieldManagementPage } from '../field-management-page'

const mockUseFieldSchema = jest.fn()
const mockUseCollections = jest.fn()
const mockUseOutstatic = jest.fn()
const mockUseSingletons = jest.fn()
const mockCommitFieldSchema = jest.fn()
const mockFetchOid = jest.fn()
const mockCreateCommitMutateAsync = jest.fn()
const mockRefetchCollections = jest.fn()
const mockToastPromise = jest.fn()
const mockToastError = jest.fn()
const mockToastMessage = jest.fn()
let mockDragEndEvent: any = null

jest.mock('@/utils/hooks/use-field-schema', () => ({
  useFieldSchema: () => mockUseFieldSchema()
}))

jest.mock('@/utils/hooks', () => ({
  useCollections: () => mockUseCollections(),
  useOutstatic: () => mockUseOutstatic()
}))

jest.mock('@/utils/hooks/use-singletons', () => ({
  useSingletons: () => mockUseSingletons()
}))

jest.mock('@/utils/hooks/use-field-schema-commit', () => ({
  useFieldSchemaCommit: () => mockCommitFieldSchema
}))

jest.mock('@/utils/hooks/use-oid', () => ({
  __esModule: true,
  default: () => mockFetchOid
}))

jest.mock('@/utils/hooks/use-create-commit', () => ({
  useCreateCommit: () => ({
    mutateAsync: mockCreateCommitMutateAsync
  })
}))

jest.mock('sonner', () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
    message: (...args: unknown[]) => mockToastMessage(...args),
    promise: (...args: unknown[]) => mockToastPromise(...args)
  }
}))

jest.mock('@/components/ui/shadcn/select', () => {
  const React = jest.requireActual<typeof import('react')>('react')
  const SelectContext = React.createContext<{
    onValueChange?: (value: string) => void
  }>({})

  const Select = ({
    children,
    onValueChange
  }: {
    children: any
    onValueChange?: (value: string) => void
    value?: string
    disabled?: boolean
  }) => (
    <SelectContext.Provider value={{ onValueChange }}>
      <div>{children}</div>
    </SelectContext.Provider>
  )

  const SelectTrigger = ({ children, ...props }: { children: any }) => (
    <button type="button" role="combobox" {...props}>
      {children}
    </button>
  )

  const SelectValue = ({ placeholder }: { placeholder?: string }) => (
    <span>{placeholder ?? ''}</span>
  )

  const SelectContent = ({ children }: { children: any }) => <div>{children}</div>

  const SelectItem = ({
    children,
    value
  }: {
    children: any
    value: string
  }) => {
    const { onValueChange } = React.useContext(SelectContext)
    return (
      <button
        type="button"
        role="option"
        aria-selected="false"
        data-value={value}
        onClick={() => onValueChange?.(value)}
      >
        {children}
      </button>
    )
  }

  return { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
})

jest.mock('@dnd-kit/core', () => ({
  DndContext: ({
    children,
    onDragEnd
  }: {
    children: ReactNode
    onDragEnd: (event: any) => void
  }) => (
    <div>
      {children}
      <button
        type="button"
        onClick={() => {
          if (mockDragEndEvent) {
            onDragEnd(mockDragEndEvent)
          }
        }}
      >
        Trigger drag end
      </button>
    </div>
  )
}))

jest.mock('@dnd-kit/modifiers', () => ({
  restrictToParentElement: jest.fn()
}))

jest.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: ReactNode }) => <>{children}</>,
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: undefined,
    isDragging: false
  }),
  arrayMove: (array: unknown[], oldIndex: number, newIndex: number) => {
    const next = [...array]
    const [moved] = next.splice(oldIndex, 1)
    next.splice(newIndex, 0, moved)
    return next
  }
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn()
  })
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
      <div>{title}</div>
      {children}
    </div>
  )
}))

jest.mock('@/components/admin-loading', () => ({
  AdminLoading: () => <div>Loading</div>
}))

jest.mock('@/components/ui/outstatic/line-background', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>
}))

jest.mock('../field-dialog', () => ({
  FieldDialog: () => <div>Field dialog</div>
}))

jest.mock('../delete-field-dialog', () => ({
  DeleteFieldDialog: () => <div>Delete field dialog</div>
}))

jest.mock('../../collections/_components/delete-collection-modal', () => ({
  __esModule: true,
  default: () => <div>Delete collection modal</div>
}))

jest.mock('@/components/delete-document-button', () => ({
  DeleteDocumentButton: () => <button type="button">Delete Document</button>
}))

describe('<FieldManagementPage />', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDragEndEvent = null

    mockUseFieldSchema.mockReturnValue({
      data: { properties: {} },
      isLoading: false
    })

    mockRefetchCollections.mockResolvedValue({ data: [] })
    mockUseCollections.mockReturnValue({
      data: [],
      isPending: false,
      refetch: mockRefetchCollections
    })

    mockUseSingletons.mockReturnValue({
      data: [{ slug: 'about', title: 'About', path: 'content/about.md' }],
      refetch: jest.fn()
    })

    mockUseOutstatic.mockReturnValue({
      dashboardRoute: '/outstatic',
      ostContent: 'outstatic/content',
      repoOwner: 'acme',
      repoSlug: 'site',
      repoBranch: 'main',
      session: { user: { login: 'acme' } }
    })

    mockCommitFieldSchema.mockResolvedValue(true)
    mockFetchOid.mockResolvedValue('oid')
    mockCreateCommitMutateAsync.mockResolvedValue({})
    mockToastPromise.mockImplementation((promise: Promise<unknown>) => promise)
  })

  it('does not block singleton pages on a disabled collections query', () => {
    mockUseCollections.mockReturnValue({
      data: undefined,
      isPending: true
    })

    render(
      <FieldManagementPage
        target={{ kind: 'singleton', slug: 'about', title: 'About' }}
        emptyStateSubject="singleton"
      />
    )

    expect(screen.queryByText('Loading')).not.toBeInTheDocument()
    expect(screen.getByText('About Settings')).toBeInTheDocument()
  })

  it('keeps collection pages loading while collections are pending', () => {
    mockUseCollections.mockReturnValue({
      data: undefined,
      isPending: true
    })

    render(
      <FieldManagementPage
        target={{ kind: 'collection', slug: 'posts', title: 'Posts' }}
        emptyStateSubject="collection"
      />
    )

    expect(screen.getByText('Loading')).toBeInTheDocument()
  })

  it('renders reorder controls when custom fields exist', () => {
    mockUseFieldSchema.mockReturnValue({
      data: {
        properties: {
          title: {
            title: 'Title',
            fieldType: 'String',
            dataType: 'string'
          },
          featured: {
            title: 'Featured',
            fieldType: 'Boolean',
            dataType: 'boolean'
          }
        }
      },
      isLoading: false
    })

    render(
      <FieldManagementPage
        target={{ kind: 'collection', slug: 'posts', title: 'Posts' }}
        emptyStateSubject="collection"
      />
    )

    expect(
      screen.getByRole('button', { name: 'Reorder Title' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Reorder Featured' })
    ).toBeInTheDocument()
  })

  it('commits editor setting changes', async () => {
    mockUseFieldSchema.mockReturnValue({
      data: {
        settings: {
          fieldsOnlyMode: false
        },
        properties: {
          featured: {
            title: 'Featured',
            fieldType: 'Boolean',
            dataType: 'boolean'
          }
        }
      },
      isLoading: false
    })

    render(
      <FieldManagementPage
        target={{ kind: 'collection', slug: 'posts', title: 'Posts' }}
        emptyStateSubject="collection"
      />
    )

    expect(screen.getByRole('button', { name: 'Update' })).toBeDisabled()

    fireEvent.click(screen.getByRole('checkbox', { name: 'Fields only mode' }))

    expect(screen.getByRole('button', { name: 'Update' })).toBeEnabled()
    expect(mockCommitFieldSchema).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Update' }))

    await waitFor(() => {
      expect(mockCommitFieldSchema).toHaveBeenCalledWith({
        customFields: {
          featured: {
            title: 'Featured',
            fieldType: 'Boolean',
            dataType: 'boolean'
          }
        },
        settings: {
          fieldsOnlyMode: true
        },
        action: 'settings',
        fieldName: 'editor settings'
      })
    })
  })

  it('does not commit reorder on no-op drag end', () => {
    mockUseFieldSchema.mockReturnValue({
      data: {
        properties: {
          title: {
            title: 'Title',
            fieldType: 'String',
            dataType: 'string'
          },
          featured: {
            title: 'Featured',
            fieldType: 'Boolean',
            dataType: 'boolean'
          }
        }
      },
      isLoading: false
    })

    mockDragEndEvent = {
      active: { id: 'title' },
      over: { id: 'title' }
    }

    render(
      <FieldManagementPage
        target={{ kind: 'collection', slug: 'posts', title: 'Posts' }}
        emptyStateSubject="collection"
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Trigger drag end' }))

    expect(mockCommitFieldSchema).not.toHaveBeenCalled()
  })

  it('marks field order as modified and waits to commit until saving', async () => {
    mockUseFieldSchema.mockReturnValue({
      data: {
        properties: {
          title: {
            title: 'Title',
            fieldType: 'String',
            dataType: 'string'
          },
          featured: {
            title: 'Featured',
            fieldType: 'Boolean',
            dataType: 'boolean'
          }
        }
      },
      isLoading: false
    })

    mockDragEndEvent = {
      active: { id: 'featured' },
      over: { id: 'title' }
    }

    render(
      <FieldManagementPage
        target={{ kind: 'collection', slug: 'posts', title: 'Posts' }}
        emptyStateSubject="collection"
      />
    )

    const beforeOrder = screen
      .getAllByRole('button', { name: /Reorder / })
      .map((button) => button.getAttribute('aria-label'))
    expect(beforeOrder).toEqual(['Reorder Title', 'Reorder Featured'])

    fireEvent.click(screen.getByRole('button', { name: 'Trigger drag end' }))

    await waitFor(() => {
      const afterOrder = screen
        .getAllByRole('button', { name: /Reorder / })
        .map((button) => button.getAttribute('aria-label'))

      expect(afterOrder).toEqual(['Reorder Featured', 'Reorder Title'])
    })
    expect(
      screen.getByText('Custom fields order modified.')
    ).toBeInTheDocument()
    expect(mockCommitFieldSchema).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => {
      expect(mockCommitFieldSchema).toHaveBeenCalledWith({
        customFields: {
          featured: {
            title: 'Featured',
            fieldType: 'Boolean',
            dataType: 'boolean'
          },
          title: {
            title: 'Title',
            fieldType: 'String',
            dataType: 'string'
          }
        },
        action: 'reorder',
        fieldName: 'field order'
      })
    })

    await waitFor(() => {
      expect(
        screen.queryByText('Custom fields order modified.')
      ).not.toBeInTheDocument()
    })
  })

  it('cancels pending order changes without committing', async () => {
    mockUseFieldSchema.mockReturnValue({
      data: {
        properties: {
          title: {
            title: 'Title',
            fieldType: 'String',
            dataType: 'string'
          },
          featured: {
            title: 'Featured',
            fieldType: 'Boolean',
            dataType: 'boolean'
          }
        }
      },
      isLoading: false
    })

    mockDragEndEvent = {
      active: { id: 'featured' },
      over: { id: 'title' }
    }

    render(
      <FieldManagementPage
        target={{ kind: 'collection', slug: 'posts', title: 'Posts' }}
        emptyStateSubject="collection"
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Trigger drag end' }))

    await waitFor(() => {
      const pendingOrder = screen
        .getAllByRole('button', { name: /Reorder / })
        .map((button) => button.getAttribute('aria-label'))

      expect(pendingOrder).toEqual(['Reorder Featured', 'Reorder Title'])
    })

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    await waitFor(() => {
      const restoredOrder = screen
        .getAllByRole('button', { name: /Reorder / })
        .map((button) => button.getAttribute('aria-label'))

      expect(restoredOrder).toEqual(['Reorder Title', 'Reorder Featured'])
    })
    expect(mockCommitFieldSchema).not.toHaveBeenCalled()
    expect(
      screen.queryByText('Custom fields order modified.')
    ).not.toBeInTheDocument()
  })

  describe('parent collection save', () => {
    const collections = [
      {
        slug: 'posts',
        title: 'Posts',
        path: 'outstatic/content/posts',
        parent: null
      },
      {
        slug: 'guides',
        title: 'Guides',
        path: 'outstatic/content/guides',
        parent: null
      }
    ]

    const renderPage = () => {
      mockUseCollections.mockReturnValue({
        data: collections,
        isPending: false,
        refetch: mockRefetchCollections
      })
      mockRefetchCollections.mockResolvedValue({ data: collections })

      return render(
        <FieldManagementPage
          target={{ kind: 'collection', slug: 'posts', title: 'Posts' }}
          emptyStateSubject="collection"
        />
      )
    }

    it('disables the Update button when no parent change is pending', () => {
      renderPage()

      const updateButtons = screen.getAllByRole('button', { name: 'Update' })
      expect(updateButtons[0]).toBeDisabled()
    })

    it('commits the parent change and refetches collections on save', async () => {
      renderPage()

      fireEvent.click(screen.getByRole('option', { name: 'Guides' }))

      const updateButtons = screen.getAllByRole('button', { name: 'Update' })
      expect(updateButtons[0]).toBeEnabled()

      fireEvent.click(updateButtons[0])

      await waitFor(() => {
        expect(mockCreateCommitMutateAsync).toHaveBeenCalledTimes(1)
      })

      const commitInput = mockCreateCommitMutateAsync.mock.calls[0][0]
      expect(commitInput.branch).toEqual({
        repositoryNameWithOwner: 'acme/site',
        branchName: 'main'
      })
      expect(commitInput.expectedHeadOid).toBe('oid')

      const collectionsAddition = commitInput.fileChanges.additions.find(
        (addition: { path: string }) =>
          addition.path === 'outstatic/content/collections.json'
      )
      expect(collectionsAddition).toBeDefined()

      const decoded = JSON.parse(
        Buffer.from(collectionsAddition.contents, 'base64').toString('utf-8')
      )
      expect(decoded).toEqual([
        { ...collections[0], parent: 'guides' },
        collections[1]
      ])

      expect(mockToastPromise).toHaveBeenCalled()
      await waitFor(() => {
        expect(mockRefetchCollections).toHaveBeenCalledTimes(2)
      })
    })

    it('shows an error toast when the commit fails', async () => {
      mockCreateCommitMutateAsync.mockRejectedValueOnce(new Error('boom'))
      const consoleError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {})

      renderPage()

      fireEvent.click(screen.getByRole('option', { name: 'Guides' }))
      const updateButtons = screen.getAllByRole('button', { name: 'Update' })
      fireEvent.click(updateButtons[0])

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith(
          'Failed to update parent collection.',
          expect.objectContaining({
            action: expect.objectContaining({ label: 'Copy Logs' })
          })
        )
      })

      consoleError.mockRestore()
    })

    it('locks out parent save while custom field order has unsaved changes', async () => {
      mockUseFieldSchema.mockReturnValue({
        data: {
          properties: {
            title: { title: 'Title', fieldType: 'String', dataType: 'string' },
            featured: {
              title: 'Featured',
              fieldType: 'Boolean',
              dataType: 'boolean'
            }
          }
        },
        isLoading: false
      })

      mockDragEndEvent = { active: { id: 'featured' }, over: { id: 'title' } }

      renderPage()

      fireEvent.click(screen.getByRole('button', { name: 'Trigger drag end' }))

      await waitFor(() => {
        expect(
          screen.getByText('Custom fields order modified.')
        ).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('option', { name: 'Guides' }))

      const parentUpdateButton = screen.getAllByRole('button', {
        name: 'Update'
      })[0]
      expect(parentUpdateButton).toBeDisabled()
    })
  })
})
