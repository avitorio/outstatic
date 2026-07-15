import { isInSingletonDirectory } from './singleton-paths'

export function classifyMetadataFile({
  path,
  singletonPaths,
  singletonDirectories,
  rootCollectionSlug
}: {
  path: string
  singletonPaths: Set<string>
  singletonDirectories: string[]
  rootCollectionSlug?: string
}) {
  const isSingleton = singletonPaths.has(path)
  const isRootFile = !path.includes('/')
  const belongsToSingletonDirectory = isInSingletonDirectory(
    path,
    singletonDirectories
  )

  if (
    belongsToSingletonDirectory &&
    !isSingleton &&
    !(isRootFile && rootCollectionSlug)
  ) {
    return { include: false }
  }

  return {
    include: true,
    collection: isSingleton
      ? '_singletons'
      : isRootFile
        ? rootCollectionSlug
        : undefined
  }
}
