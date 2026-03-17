import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DeleteFieldDialog } from '../delete-field-dialog'
import { useFieldSchemaCommit } from '@/utils/hooks/use-field-schema-commit'
import { useOutstatic } from '@/utils/hooks/use-outstatic'

jest.mock('@/utils/hooks/use-field-schema-commit')
jest.mock('@/utils/hooks/use-outstatic')
jest.mock('@/components/ui/shadcn/alert-dialog', () => ({
  AlertDialog: ({ children }: { children: any }) => <div>{children}</div>,
  AlertDialogAction: ({ children }: { children: any }) => <div>{children}</div>,
  AlertDialogCancel: ({ children }: { children: any }) => <div>{children}</div>,
  AlertDialogContent: ({ children }: { children: any }) => (
    <div>{children}</div>
  ),
  AlertDialogDescription: ({ children }: { children: any }) => (
    <div>{children}</div>
  ),
  AlertDialogFooter: ({ children }: { children: any }) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: { children: any }) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: { children: any }) => <div>{children}</div>
}))

const mockUseFieldSchemaCommit = useFieldSchemaCommit as jest.Mock
const mockUseOutstatic = useOutstatic as jest.Mock

describe('<DeleteFieldDialog />', () => {
  let mockSetHasChanges: jest.Mock
  let mockCommit: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mockSetHasChanges = jest.fn()
    mockCommit = jest.fn().mockResolvedValue(true)

    mockUseOutstatic.mockReturnValue({
      setHasChanges: mockSetHasChanges
    })
    mockUseFieldSchemaCommit.mockReturnValue(mockCommit)
  })

  it('removes the selected field and commits the delete action', async () => {
    const user = userEvent.setup()
    const setCustomFields = jest.fn()

    render(
      <DeleteFieldDialog
        open={true}
        onOpenChange={jest.fn()}
        target={{
          kind: 'collection',
          slug: 'posts',
          title: 'Posts'
        }}
        selectedField="heroTitle"
        customFields={{
          heroTitle: {
            title: 'Hero Title',
            fieldType: 'String',
            dataType: 'string'
          },
          category: {
            title: 'Category',
            fieldType: 'String',
            dataType: 'string'
          }
        }}
        setCustomFields={setCustomFields}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() =>
      expect(mockCommit).toHaveBeenCalledWith({
        action: 'delete',
        customFields: {
          category: {
            title: 'Category',
            fieldType: 'String',
            dataType: 'string'
          }
        },
        fieldName: 'heroTitle'
      })
    )
    expect(setCustomFields).toHaveBeenCalledWith({
      category: {
        title: 'Category',
        fieldType: 'String',
        dataType: 'string'
      }
    })
  })

  it('closes and clears change state when canceled', async () => {
    const user = userEvent.setup()
    const onOpenChange = jest.fn()

    render(
      <DeleteFieldDialog
        open={true}
        onOpenChange={onOpenChange}
        target={{
          kind: 'collection',
          slug: 'posts',
          title: 'Posts'
        }}
        selectedField="heroTitle"
        customFields={{
          heroTitle: {
            title: 'Hero Title',
            fieldType: 'String',
            dataType: 'string'
          }
        }}
        setCustomFields={jest.fn()}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(mockSetHasChanges).toHaveBeenCalledWith(false)
  })
})
