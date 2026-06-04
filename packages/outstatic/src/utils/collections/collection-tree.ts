import type { MetadataType } from '@/utils/metadata/types'

export type CollectionType = {
  title: string
  slug: string
  path: string
  parent: string | null
}

type LegacyCollectionType = Omit<CollectionType, 'parent'> & {
  parent?: string | null
  children?: LegacyCollectionType[]
}

export function normalizeCollectionPath(path: string) {
  return path.replace(/^\/+|\/+$/g, '')
}

export function findCollectionParent(
  collections: CollectionType[],
  collectionPath: string
) {
  const normalizedCollectionPath = normalizeCollectionPath(collectionPath)

  return (
    collections
      .filter((collection) => {
        const normalizedPath = normalizeCollectionPath(collection.path)

        return (
          normalizedPath !== '' &&
          normalizedPath !== normalizedCollectionPath &&
          normalizedCollectionPath.startsWith(`${normalizedPath}/`)
        )
      })
      .sort((a, b) => b.path.length - a.path.length)[0]?.slug ?? null
  )
}

export function getInvalidParentCollectionSlugs(
  collections: CollectionType[],
  collectionSlug: string
) {
  const invalidSlugs = new Set<string>([collectionSlug])

  getDescendantCollectionSlugs(collections, collectionSlug).forEach((slug) => {
    invalidSlugs.add(slug)
  })

  return invalidSlugs
}

export function getValidParentCollectionOptions(
  collections: CollectionType[],
  collectionSlug: string
) {
  const invalidSlugs = getInvalidParentCollectionSlugs(
    collections,
    collectionSlug
  )

  return collections.filter((collection) => !invalidSlugs.has(collection.slug))
}

export function updateCollectionParent(
  collections: CollectionType[],
  collectionSlug: string,
  parent: string | null
) {
  return collections.map((collection) =>
    collection.slug === collectionSlug ? { ...collection, parent } : collection
  )
}

export function getDescendantCollectionSlugs(
  collections: CollectionType[],
  parentSlug: string
) {
  const descendantSlugs = new Set<string>()
  let foundDescendant = true

  while (foundDescendant) {
    foundDescendant = false

    collections.forEach((collection) => {
      if (
        collection.parent &&
        (collection.parent === parentSlug ||
          descendantSlugs.has(collection.parent)) &&
        !descendantSlugs.has(collection.slug)
      ) {
        descendantSlugs.add(collection.slug)
        foundDescendant = true
      }
    })
  }

  return descendantSlugs
}

export function normalizeCollections(
  collections: LegacyCollectionType[] = [],
  parent: string | null = null
): CollectionType[] {
  return collections.flatMap((collection) => {
    const {
      children = [],
      parent: collectionParent,
      ...collectionData
    } = collection
    const normalizedCollection = {
      ...collectionData,
      parent: collectionParent ?? parent
    }

    return [
      normalizedCollection,
      ...normalizeCollections(children, normalizedCollection.slug)
    ]
  })
}

export function getCollectionsAfterDeletion(
  collections: CollectionType[],
  collection: CollectionType,
  keepFiles: boolean
): CollectionType[] {
  const descendantSlugs = getDescendantCollectionSlugs(
    collections,
    collection.slug
  )

  return collections
    .filter(
      (collectionInfo) =>
        collectionInfo.slug !== collection.slug &&
        (keepFiles || !descendantSlugs.has(collectionInfo.slug))
    )
    .map((collectionInfo) => ({
      ...collectionInfo,
      parent:
        collectionInfo.parent === collection.slug
          ? collection.parent
          : collectionInfo.parent
    }))
}

export function getMetadataAfterCollectionDeletion(
  metadata: MetadataType,
  collectionSlug: string,
  descendantSlugs: Set<string>,
  keepFiles: boolean
): MetadataType {
  return metadata.filter((post) => {
    const isDescendantCollection =
      typeof post.collection === 'string' &&
      descendantSlugs.has(post.collection)

    return (
      post.collection !== collectionSlug &&
      (keepFiles || !isDescendantCollection)
    )
  })
}

export function buildParentChildRoutes<
  T extends {
    slug?: string
    parent?: string | null
    children?: T[]
  }
>(routes: T[]): T[] {
  const clonedRoutes = routes.map((route) => ({
    ...route,
    children: route.children ? [...route.children] : []
  })) as T[]
  const routesBySlug = new Map<string, T>()
  const rootRoutes: T[] = []

  clonedRoutes.forEach((route) => {
    if (route.slug) {
      routesBySlug.set(route.slug, route)
    }
  })

  clonedRoutes.forEach((route) => {
    if (route.parent) {
      const parentRoute = routesBySlug.get(route.parent)

      if (parentRoute && parentRoute !== route) {
        parentRoute.children = [...(parentRoute.children ?? []), route]
        return
      }
    }

    rootRoutes.push(route)
  })

  return rootRoutes
}
