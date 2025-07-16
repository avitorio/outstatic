import { AdminLoading } from '@/components/admin-loading'
import { useCollections } from '@/utils/hooks/useCollections'
import { useOutstatic } from '@/utils/hooks/useOutstatic'
import { ReactElement } from 'react'
import CustomFields from './pages/custom-fields'
import Collections from './pages/collections'
import EditDocument from './pages/edit-document'
import List from './pages/list'
import Settings from './pages/settings'
import MediaLibrary from './pages/media-library'
import { EditorProvider } from '@/components/editor/editor-context'

const DEFAULT_PAGES: { [key: string]: ReactElement | undefined } = {
  settings: <Settings />,
  'media-library': <MediaLibrary />,
  collections: undefined
}

interface RouterProps {
  params: { ost: string[] }
}

interface RouteParams {
  slug: string
  slug2: string
  collections: any[]
  pages: string[]
}

const getRouteParams = (params: { ost: string[] }): RouteParams => {
  const slug = params?.ost?.[0] || ''
  const slug2 = params?.ost?.[1] || ''
  return { slug, slug2, collections: [], pages: [] }
}

const findCollectionTitle = (
  collections: any[],
  slug: string,
  slug2: string
): string => {
  return (
    collections?.find((col) => col.slug === slug || col.slug === slug2)
      ?.title || ''
  )
}

const isContentRoute = (slug: string, pages: string[]): boolean => {
  return Boolean(slug && ![...pages].includes(slug))
}

const isCustomFieldsRoute = (
  slug: string,
  slug2: string,
  collections: any[]
): boolean => {
  return (
    slug === 'collections' && collections?.find((col) => col.slug === slug2)
  )
}

const renderContentRoute = (slug: string, slug2: string, title: string) => {
  if (slug2) {
    return (
      <EditorProvider>
        <EditDocument collection={slug} />
      </EditorProvider>
    )
  }
  return <List slug={slug} title={title} />
}

const renderRoute = ({
  slug,
  slug2,
  collections,
  pages
}: RouteParams): ReactElement | undefined => {
  // Default route - show collections
  if (!slug) {
    return <Collections />
  }

  // Content routes (edit document or list)
  if (isContentRoute(slug, pages)) {
    const title = findCollectionTitle(collections, slug, slug2)
    return renderContentRoute(slug, slug2, title)
  }

  // Custom fields route
  if (isCustomFieldsRoute(slug, slug2, collections)) {
    const title = findCollectionTitle(collections, slug, slug2)
    return <CustomFields collection={slug2} title={title} />
  }

  // Default pages (settings, media-library, etc.)
  return DEFAULT_PAGES[slug]
}

export const Router = ({ params }: RouterProps) => {
  const { data: collections, isPending, fetchStatus } = useCollections()
  const { pages } = useOutstatic()

  if (isPending && fetchStatus !== 'idle') {
    return <AdminLoading />
  }

  const routeParams = getRouteParams(params)
  routeParams.collections = collections || []
  routeParams.pages = pages || []

  return <>{renderRoute(routeParams)}</>
}
