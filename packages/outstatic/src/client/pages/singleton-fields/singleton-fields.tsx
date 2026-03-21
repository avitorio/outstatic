import { useSingletons } from '@/utils/hooks/use-singletons'
import { FieldManagementPage } from '../_components/field-management-page'

type SingletonFieldsProps = {
  slug: string
}

export default function SingletonFields({ slug }: SingletonFieldsProps) {
  const { data: singletons } = useSingletons()

  const singletonTitle = singletons?.find((s) => s.slug === slug)?.title || slug

  return (
    <FieldManagementPage
      target={{
        kind: 'singleton',
        slug,
        title: singletonTitle
      }}
      emptyStateSubject="singleton"
    />
  )
}
