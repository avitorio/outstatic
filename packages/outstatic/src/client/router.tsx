import { CardGridPageSkeleton } from '@/components/skeletons/card-grid-page-skeleton'
import { DashboardSkeleton } from '@/components/skeletons/dashboard-skeleton'
import { EditorPageSkeleton } from '@/components/skeletons/editor-page-skeleton'
import { FieldsPageSkeleton } from '@/components/skeletons/fields-page-skeleton'
import { ListPageSkeleton } from '@/components/skeletons/list-page-skeleton'
import { MediaLibraryPageSkeleton } from '@/components/skeletons/media-library-page-skeleton'
import { SettingsPageSkeleton } from '@/components/skeletons/settings-page-skeleton'
import { useCollections } from '@/utils/hooks/use-collections'
import { useSingletons } from '@/utils/hooks/use-singletons'
import { useOutstatic } from '@/utils/hooks/use-outstatic'
import { ReactElement } from 'react'
import CustomFields from './pages/custom-fields'
import Collections from './pages/collections'
import Singletons from './pages/singletons'
import EditDocument from './pages/edit-document'
import EditSingleton from './pages/edit-singleton'
import SingletonFields from './pages/singleton-fields'
import List from './pages/list'
import Settings from './pages/settings'
import MediaLibrary from './pages/media-library'
import BlockLibrary from './pages/block-library'
import { EditorProvider } from '@/components/editor/editor-context'
import Dashboard from './pages/dashboard'

const DEFAULT_PAGES: { [key: string]: ReactElement | undefined } = {
  settings: <Settings />,
  'media-library': <MediaLibrary />,
  'block-library': <BlockLibrary />,
  collections: <Collections />,
  singletons: <Singletons />
}

interface RouterProps {
  params: { ost: string[] }
}

interface RouteParams {
  slug: string
  slug2: string
  slug3: string
  collections: any[]
  singletons: any[]
  pages: string[]
}

const getRouteParams = (params: { ost: string[] }): RouteParams => {
  const slug = params?.ost?.[0] || ''
  const slug2 = params?.ost?.[1] || ''
  const slug3 = params?.ost?.[2] || ''
  return { slug, slug2, slug3, collections: [], singletons: [], pages: [] }
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

const isSingletonRoute = (
  slug: string,
  slug2: string,
  singletons: any[]
): boolean => {
  // Allow 'new' for creating new singletons, or match existing singleton slugs
  return (
    slug === 'singletons' &&
    !!slug2 &&
    (slug2 === 'new' || singletons?.find((s) => s.slug === slug2))
  )
}

const isSingletonFieldsRoute = (
  slug: string,
  slug2: string,
  slug3: string,
  singletons: any[]
): boolean => {
  return (
    slug === 'singletons' &&
    slug3 === 'fields' &&
    singletons?.find((s) => s.slug === slug2)
  )
}

const renderRoute = ({
  slug,
  slug2,
  slug3,
  collections,
  singletons,
  pages
}: RouteParams): ReactElement | undefined => {
  // Default route - show dashboard
  if (!slug) {
    return <Dashboard />
  }

  // Singleton fields route: /singletons/{slug}/fields
  if (isSingletonFieldsRoute(slug, slug2, slug3, singletons)) {
    return <SingletonFields slug={slug2} />
  }

  // Singleton edit route: /singletons/{slug}
  if (isSingletonRoute(slug, slug2, singletons)) {
    return (
      <EditorProvider key={`singleton-editor-${slug2}`}>
        <EditSingleton slug={slug2} />
      </EditorProvider>
    )
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

  // Default pages (settings, media-library, singletons, etc.)
  return DEFAULT_PAGES[slug]
}

// Route-aware loading state, based only on the URL segments so the skeleton
// matches the page that is about to render.
const renderRouteSkeleton = ({
  slug,
  slug2,
  slug3
}: Pick<RouteParams, 'slug' | 'slug2' | 'slug3'>): ReactElement => {
  if (!slug) {
    return <DashboardSkeleton />
  }

  if (slug === 'collections') {
    return slug2 ? (
      <FieldsPageSkeleton title="Add Custom Fields" />
    ) : (
      <CardGridPageSkeleton title="Collections" />
    )
  }

  if (slug === 'singletons') {
    if (slug3 === 'fields') {
      return <FieldsPageSkeleton title="Add Custom Fields" />
    }
    return slug2 ? (
      <EditorPageSkeleton />
    ) : (
      <ListPageSkeleton title="Singletons" />
    )
  }

  if (slug === 'block-library') {
    return (
      <CardGridPageSkeleton title="Block Library" cards={6} cardActions={0} />
    )
  }

  if (slug === 'settings') {
    return <SettingsPageSkeleton />
  }

  if (slug === 'media-library') {
    return <MediaLibraryPageSkeleton />
  }

  return slug2 ? <EditorPageSkeleton /> : <ListPageSkeleton />
}

export const RouteSkeleton = ({ params }: RouterProps) =>
  renderRouteSkeleton(getRouteParams(params))

export const Router = ({ params }: RouterProps) => {
  const {
    data: collections,
    isPending: collectionsPending,
    fetchStatus: collectionsFetchStatus
  } = useCollections()
  const {
    data: singletons,
    isPending: singletonsPending,
    fetchStatus: singletonsFetchStatus
  } = useSingletons()
  const { pages } = useOutstatic()

  const isPending = collectionsPending || singletonsPending
  const isIdle =
    collectionsFetchStatus === 'idle' && singletonsFetchStatus === 'idle'

  const routeParams = getRouteParams(params)

  if (isPending && !isIdle) {
    return renderRouteSkeleton(routeParams)
  }

  routeParams.collections = collections || []
  routeParams.singletons = singletons || []
  routeParams.pages = pages || []

  return <>{renderRoute(routeParams)}</>
}
