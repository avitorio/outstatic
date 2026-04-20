import { capitalCase } from 'change-case'
import { usePermissions } from '@/utils/hooks/use-permissions'
import { FieldManagementPage } from '../_components/field-management-page'

type CustomFieldsProps = {
  collection: string
  title: string
}

export default function CustomFields({ collection, title }: CustomFieldsProps) {
  const { canManageCollections } = usePermissions()

  return (
    <FieldManagementPage
      target={{
        kind: 'collection',
        slug: collection,
        title: title || capitalCase(collection)
      }}
      emptyStateSubject="collection"
      canManage={canManageCollections}
    />
  )
}
