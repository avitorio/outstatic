import { API_MEDIA_PATH } from '@/utils/constants'
import {
  ConfigType,
  MediaCategory,
  MediaItem,
  MediaSourceConfig
} from './metadata/types'

export const DEFAULT_MEDIA_SOURCE_NAME = 'images'
export const DEFAULT_MEDIA_SOURCE_LABEL = 'Images'

export const MEDIA_CATEGORY_EXTENSIONS: Record<MediaCategory, string[]> = {
  image: [
    'avif',
    'bmp',
    'gif',
    'heic',
    'heif',
    'jpg',
    'jpeg',
    'png',
    'svg',
    'tif',
    'tiff',
    'webp'
  ],
  document: ['doc', 'docx', 'md', 'mdx', 'pdf', 'rtf', 'txt'],
  video: ['avi', 'm4v', 'mov', 'mp4', 'webm'],
  audio: ['flac', 'm4a', 'mp3', 'ogg', 'wav'],
  compressed: ['7z', 'gz', 'rar', 'tar', 'zip'],
  code: [
    'cjs',
    'css',
    'html',
    'js',
    'json',
    'mjs',
    'ts',
    'tsx',
    'xml',
    'yaml',
    'yml'
  ],
  font: ['eot', 'otf', 'ttf', 'woff', 'woff2'],
  spreadsheet: ['csv', 'ods', 'xls', 'xlsx']
}

const unique = <T>(items: T[]) => Array.from(new Set(items))

const trimSlashes = (value: string) => value.replace(/^\/+|\/+$/g, '')

const trimTrailingSlash = (value: string) => value.replace(/\/+$/g, '')

const normalizeStoredPublicPath = (value: string) => value.trim()

const getPublicPathPrefix = (value: string) => {
  const normalizedValue = trimTrailingSlash(normalizeStoredPublicPath(value))

  if (!normalizedValue || normalizedValue === '/') {
    return '/'
  }

  return `${normalizedValue}/`
}

const normalizeComparablePublicPath = (value: string) => {
  const normalizedValue = value.trim()

  if (!normalizedValue) {
    return '/'
  }

  return normalizedValue.startsWith('/')
    ? normalizedValue
    : `/${normalizedValue}`
}

export const sortMediaSourcesByRepoPathSpecificity = (
  sources: MediaSourceConfig[]
) => [...sources].sort((a, b) => b.input.length - a.input.length)

export const sortMediaSourcesByPublicPathSpecificity = (
  sources: MediaSourceConfig[]
) =>
  [...sources].sort(
    (a, b) =>
      normalizeComparablePublicPath(getPublicPathPrefix(b.output)).length -
      normalizeComparablePublicPath(getPublicPathPrefix(a.output)).length
  )

export const normalizeExtension = (value: string) =>
  value.trim().toLowerCase().replace(/^\./, '')

export const getFileExtension = (filename: string) => {
  const extension = filename.split('.').pop()

  if (!extension || extension === filename) {
    return ''
  }

  return normalizeExtension(extension)
}

export const normalizeMediaSource = (
  source: MediaSourceConfig
): MediaSourceConfig => {
  const extensions = unique(
    (source.extensions ?? []).map(normalizeExtension).filter(Boolean)
  )
  const categories = unique(
    (source.categories ?? [])
      .map((value) => value.toLowerCase())
      .filter(Boolean)
  ) as MediaCategory[]

  return {
    ...source,
    name: source.name.trim().toLowerCase(),
    label: source.label.trim(),
    input: trimSlashes(source.input),
    output: normalizeStoredPublicPath(source.output),
    extensions: extensions.length > 0 ? extensions : undefined,
    categories: categories.length > 0 ? categories : undefined
  }
}

export const normalizeMediaSources = (sources?: MediaSourceConfig[]) =>
  (sources ?? []).map(normalizeMediaSource)

export const getPresetExtensionsForCategories = (
  categories?: readonly MediaCategory[]
) =>
  unique(
    (categories ?? []).flatMap(
      (category) => MEDIA_CATEGORY_EXTENSIONS[category] ?? []
    )
  )

export const deriveStoredMediaExtensions = ({
  categories,
  extensions
}: {
  categories?: readonly MediaCategory[]
  extensions?: readonly string[]
}) => {
  const normalizedCategories = unique(
    (categories ?? []).map((value) => value.toLowerCase()).filter(Boolean)
  ) as MediaCategory[]
  const normalizedExtensions = unique(
    (extensions ?? []).map(normalizeExtension).filter(Boolean)
  )
  const categoryExtensions =
    getPresetExtensionsForCategories(normalizedCategories)
  const hasFullPresetCoverage = categoryExtensions.every((extension) =>
    normalizedExtensions.includes(extension)
  )

  if (!hasFullPresetCoverage) {
    return {
      categories: undefined,
      extensions:
        normalizedExtensions.length > 0 ? normalizedExtensions : undefined
    }
  }

  const manualExtensions = normalizedExtensions.filter(
    (extension) => !categoryExtensions.includes(extension)
  )

  return {
    categories:
      normalizedCategories.length > 0 ? normalizedCategories : undefined,
    extensions: manualExtensions.length > 0 ? manualExtensions : undefined
  }
}

export const getAllowedExtensionsForSource = (source: MediaSourceConfig) => {
  const explicitExtensions = source.extensions ?? []
  const categoryExtensions = getPresetExtensionsForCategories(source.categories)

  return unique([...explicitExtensions, ...categoryExtensions])
}

export const hasAllowedMediaTypes = (source: MediaSourceConfig) =>
  getAllowedExtensionsForSource(source).length > 0

export const isImageMediaSource = (source: MediaSourceConfig) =>
  getAllowedExtensionsForSource(source).some((extension) =>
    MEDIA_CATEGORY_EXTENSIONS.image.includes(extension)
  )

export const isImageOnlyMediaSource = (source: MediaSourceConfig) => {
  const allowedExtensions = getAllowedExtensionsForSource(source)

  return (
    allowedExtensions.length > 0 &&
    allowedExtensions.every((extension) =>
      MEDIA_CATEGORY_EXTENSIONS.image.includes(extension)
    )
  )
}

export const createMediaSourceFromLegacyPaths = ({
  repoMediaPath,
  publicMediaPath,
  name = DEFAULT_MEDIA_SOURCE_NAME,
  label = DEFAULT_MEDIA_SOURCE_LABEL
}: {
  repoMediaPath?: string
  publicMediaPath?: string
  name?: string
  label?: string
}): MediaSourceConfig | undefined => {
  if (!repoMediaPath || !publicMediaPath) {
    return undefined
  }

  return normalizeMediaSource({
    name,
    label,
    input: trimTrailingSlash(repoMediaPath),
    output: `/${trimSlashes(publicMediaPath)}`,
    categories: ['image']
  })
}

export const resolveMediaSources = ({
  media,
  repoMediaPath,
  publicMediaPath
}: Partial<ConfigType>) => {
  if (media && media.length > 0) {
    return normalizeMediaSources(media)
  }

  const legacySource = createMediaSourceFromLegacyPaths({
    repoMediaPath,
    publicMediaPath
  })

  return legacySource ? [legacySource] : []
}

export const getFirstImageMediaSource = (sources: MediaSourceConfig[]) =>
  sources.find((source) => isImageMediaSource(source))

export const deriveLegacyMediaPaths = (
  sources: MediaSourceConfig[]
): Pick<ConfigType, 'publicMediaPath' | 'repoMediaPath'> => {
  const source = getFirstImageMediaSource(sources)

  if (!source) {
    return {
      publicMediaPath: '',
      repoMediaPath: ''
    }
  }

  return {
    publicMediaPath: `${trimSlashes(source.output)}/`,
    repoMediaPath: `${trimSlashes(source.input)}/`
  }
}

export const syncLegacyMediaFields = (config: ConfigType): ConfigType => {
  if (!config.media || config.media.length === 0) {
    return config
  }

  const media = normalizeMediaSources(config.media)

  return {
    ...config,
    media,
    ...deriveLegacyMediaPaths(media)
  }
}

const buildSourcePathPrefix = (value: string) => `${trimSlashes(value)}/`

export const getSourceForRepoPath = (
  repoPath: string,
  sources: MediaSourceConfig[]
) => {
  const normalizedPath = trimSlashes(repoPath)

  return sortMediaSourcesByRepoPathSpecificity(sources).find((source) => {
    const prefix = buildSourcePathPrefix(source.input)
    return normalizedPath.startsWith(prefix)
  })
}

export const getSourceForPublicPath = (
  publicPath: string,
  sources: MediaSourceConfig[]
) => {
  const normalizedPath = normalizeComparablePublicPath(publicPath)

  return sortMediaSourcesByPublicPathSpecificity(sources).find((source) => {
    const prefix = normalizeComparablePublicPath(
      getPublicPathPrefix(source.output)
    )
    return normalizedPath.startsWith(prefix)
  })
}

export const getPublicMediaPathPrefix = (
  source: Pick<MediaSourceConfig, 'output'>
) => getPublicPathPrefix(source.output)

export const getFilenameFromPublicMediaPath = (
  publicPath: string,
  source: Pick<MediaSourceConfig, 'output'>
) => {
  const exactPrefix = getPublicMediaPathPrefix(source)

  if (publicPath.startsWith(exactPrefix)) {
    return publicPath.slice(exactPrefix.length)
  }

  const normalizedPath = normalizeComparablePublicPath(publicPath)
  const normalizedPrefix = normalizeComparablePublicPath(exactPrefix)

  if (normalizedPath.startsWith(normalizedPrefix)) {
    return normalizedPath.slice(normalizedPrefix.length)
  }

  return publicPath
}

export const getMediaSourceForItem = (
  item: Pick<MediaItem, '__outstatic' | 'source'>,
  sources: MediaSourceConfig[]
) => {
  if (item.source) {
    const sourceByName = sources.find((source) => source.name === item.source)

    if (sourceByName) {
      return sourceByName
    }
  }

  return getSourceForRepoPath(item.__outstatic.path, sources)
}

export const buildPublicMediaPath = (
  source: MediaSourceConfig,
  filename: string
) => `${getPublicMediaPathPrefix(source)}${filename}`

export const buildRepoMediaPath = (
  source: MediaSourceConfig,
  filename: string
) => `${source.input}/${filename}`

export const buildMediaApiPrefix = ({
  basePath,
  repoOwner,
  repoSlug,
  repoBranch,
  source
}: {
  basePath: string
  repoOwner: string
  repoSlug: string
  repoBranch: string
  source: MediaSourceConfig
}) =>
  `${basePath}${API_MEDIA_PATH}${repoOwner}/${repoSlug}/${repoBranch}/${source.input}/`

export const buildMediaApiPath = ({
  basePath,
  repoOwner,
  repoSlug,
  repoBranch,
  source,
  filename
}: {
  basePath: string
  repoOwner: string
  repoSlug: string
  repoBranch: string
  source: MediaSourceConfig
  filename: string
}) =>
  `${buildMediaApiPrefix({
    basePath,
    repoOwner,
    repoSlug,
    repoBranch,
    source
  })}${filename}`

export const createAcceptAttribute = (source?: MediaSourceConfig) => {
  if (!source) {
    return undefined
  }

  const extensions = getAllowedExtensionsForSource(source)

  if (extensions.length === 0) {
    return undefined
  }

  return extensions.map((extension) => `.${extension}`).join(',')
}

export const isFilenameAllowedForSource = (
  filename: string,
  source?: MediaSourceConfig
) => {
  if (!source) {
    return false
  }

  const extension = getFileExtension(filename)

  if (!extension) {
    return false
  }

  return getAllowedExtensionsForSource(source).includes(extension)
}

export const getMediaTypeForFilename = (
  filename: string,
  source?: MediaSourceConfig
) => {
  const extension = getFileExtension(filename)

  if (!extension) {
    return 'file'
  }

  const categories = source?.categories ?? []
  const category = categories.find((value) =>
    MEDIA_CATEGORY_EXTENSIONS[value]?.includes(extension)
  )

  if (category) {
    return category
  }

  if (MEDIA_CATEGORY_EXTENSIONS.image.includes(extension)) {
    return 'image'
  }

  return 'file'
}
