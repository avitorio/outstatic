import { renderHook } from '@testing-library/react'
import { useOutstatic } from './use-outstatic'
import { usePermissions } from './use-permissions'

jest.mock('./use-outstatic', () => ({
  useOutstatic: jest.fn()
}))

const mockUseOutstatic = useOutstatic as jest.Mock

describe('usePermissions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('maps granted permissions to booleans and supports generic checks', () => {
    mockUseOutstatic.mockReturnValue({
      session: {
        user: {
          permissions: ['roles.manage', 'collections.manage', 'projects.manage']
        }
      }
    })

    const { result } = renderHook(() => usePermissions())

    expect(result.current.canManageRoles).toBe(true)
    expect(result.current.canManageCollections).toBe(true)
    expect(result.current.canManageProjects).toBe(true)
    expect(result.current.canManageContent).toBe(false)
    expect(result.current.canManageSettings).toBe(false)
    expect(result.current.canManageMembers).toBe(false)
    expect(result.current.canManageInvites).toBe(false)
    expect(result.current.hasPermission('projects.manage')).toBe(true)
    expect(result.current.hasPermission('content.manage')).toBe(false)
  })

  it('defaults all checks to false when the session has no permissions', () => {
    mockUseOutstatic.mockReturnValue({
      session: null
    })

    const { result } = renderHook(() => usePermissions())

    expect(result.current.canManageRoles).toBe(false)
    expect(result.current.canManageSettings).toBe(false)
    expect(result.current.canManageMembers).toBe(false)
    expect(result.current.canManageInvites).toBe(false)
    expect(result.current.canManageCollections).toBe(false)
    expect(result.current.canManageContent).toBe(false)
    expect(result.current.canManageProjects).toBe(false)
    expect(result.current.hasPermission('collections.manage')).toBe(false)
  })
})
