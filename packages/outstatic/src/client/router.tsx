import useOutstatic from '@/utils/hooks/useOutstatic'
import Onboarding from './pages/onboarding'
import Collections from './pages/collections'
import EditDocument from './pages/edit-document'
import List from './pages/list'
import Settings from './pages/settings'
import { ReactElement } from 'react'
import AddCustomField from './pages/add-custom-field'
import NewCollection from './pages/new-collection'

const defaultPages: { [key: string]: ReactElement | undefined } = {
  settings: <Settings />,
  collections: undefined
}

export const Router = ({ params }: { params: { ost: string[] } }) => {
  const { collections, repoSlug } = useOutstatic()

  const slug = params?.ost?.[0] || ''
  const slug2 = params?.ost?.[1] || ''

  const isContent = slug && !['collections', 'settings', ''].includes(slug)
  return (
    <>
      {!repoSlug ? (
        <Onboarding />
      ) : (
        <>
          {!slug && <Collections />}
          {slug2 && isContent && <EditDocument collection={slug} />}
          {!slug2 && isContent ? (
            <List collection={slug} />
          ) : (
            defaultPages[slug]
          )}
          {(slug === 'collections' && collections.includes(slug2) && (
            <AddCustomField collection={slug2} />
          )) ||
            (!!slug2 && !isContent && <NewCollection />)}
        </>
      )}
    </>
  )
}
