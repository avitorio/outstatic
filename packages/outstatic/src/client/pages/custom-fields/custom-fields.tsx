import { capitalCase } from 'change-case'
import { useOutstatic } from '@/utils/hooks/use-outstatic'
import { FieldManagementPage } from '../_components/field-management-page'

type CustomFieldsProps = {
  collection: string
  title: string
}

export default function CustomFields({ collection, title }: CustomFieldsProps) {
  const { session } = useOutstatic()

  return (
    <FieldManagementPage
      target={{
        kind: 'collection',
        slug: collection,
        title: title || capitalCase(collection)
      }}
      emptyStateSubject="collection"
      canManage={!!session?.user?.permissions?.includes('collections.manage')}
    />
  )
}
