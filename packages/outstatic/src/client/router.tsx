import useOutstatic from '@/utils/hooks/useOutstatic'
import Collections from './pages/collections'
import EditDocument from './pages/edit-document'
import List from './pages/list'
import Settings from './pages/settings'
import { ReactElement } from 'react'
import AddCustomField from './pages/add-custom-field'
import NewCollection from './pages/new-collection'
import { useCollections } from '@/utils/hooks/useCollections'
import { AdminLoading } from '@/components/AdminLoading'

const defaultPages: { [key: string]: ReactElement | undefined } = {
  settings: <Settings />,
  collections: undefined
}

export const Router = ({ params }: { params: { ost: string[] } }) => {
  const { data: collections, isPending, fetchStatus } = useCollections()
  const { pages } = useOutstatic()

  const slug = params?.ost?.[0] || ''
  const slug2 = params?.ost?.[1] || ''

  if (isPending && fetchStatus !== 'idle') return <AdminLoading />

  const isContent =
    slug && ![...pages, ...[collections ? collections : []]].includes(slug)
  return (
    <>
      {!slug && <Collections />}
      {slug2 && isContent && <EditDocument collection={slug} />}
      {!slug2 && isContent ? <List collection={slug} /> : defaultPages[slug]}
      {(slug === 'collections' && collections?.includes(slug2) && (
        <AddCustomField collection={slug2} />
      )) ||
        (!!slug2 && !isContent && <NewCollection />)}
    </>
  )
}
