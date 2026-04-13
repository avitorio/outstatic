import { AppPermissions } from '@/utils/auth/auth'
import { useOutstatic } from './use-outstatic'

export function usePermissions() {
  const { session } = useOutstatic()
  const permissions = session?.user?.permissions ?? []

  const hasPermission = (permission: AppPermissions) =>
    permissions.includes(permission)

  return {
    hasPermission,
    canManageRoles: hasPermission('roles.manage'),
    canManageSettings: hasPermission('settings.manage'),
    canManageMembers: hasPermission('members.manage'),
    canManageInvites: hasPermission('invites.manage'),
    canManageCollections: hasPermission('collections.manage'),
    canManageContent: hasPermission('content.manage'),
    canManageProjects: hasPermission('projects.manage')
  }
}
