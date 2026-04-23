import { Document } from '@/types'
import { convert } from '@catalystic/json-to-yaml'
import replaceImagePath from './replace-image-path'
import {
  buildMediaApiPrefix,
  buildPublicMediaPath,
  resolveMediaSources,
  sortMediaSourcesByRepoPathSpecificity
} from './media-config'
import { MediaSourceConfig } from './metadata/types'

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const mergeMdMeta = ({
  data,
  basePath,
  repoOwner,
  repoSlug,
  repoBranch,
  media,
  publicMediaPath,
  repoMediaPath
}: {
  data: Document & Record<string, any>
  basePath: string
  repoOwner: string
  repoSlug: string
  repoBranch: string
  media?: MediaSourceConfig[]
  publicMediaPath?: string
  repoMediaPath?: string
}): string => {
  const sources = media?.length
    ? media
    : resolveMediaSources({ publicMediaPath, repoMediaPath })

  const processValue = (value: any): any => {
    if (value instanceof Date) {
      return value.toISOString()
    }
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        return value.map(processValue)
      }
      return Object.fromEntries(
        Object.entries(value).map(([subKey, subValue]) => [
          subKey,
          processValue(subValue)
        ])
      )
    }
    if (typeof value === 'string') {
      return sortMediaSourcesByRepoPathSpecificity(sources).reduce(
        (currentValue, source) => {
          const apiMediaPath = buildMediaApiPrefix({
            basePath,
            repoOwner,
            repoSlug,
            repoBranch,
            source
          })
          const regex = new RegExp(
            `(${escapeRegExp(apiMediaPath)})([^\\s"'\\)]+)`,
            'g'
          )

          return currentValue.replace(regex, (_match, _apiPath, filename) => {
            return buildPublicMediaPath(source, filename)
          })
        },
        value
      )
    }
    return value
  }

  // Create a new object from data excluding the 'content' property
  const metaData = Object.fromEntries(
    Object.entries(data).filter(([key]) => key !== 'content')
  )

  // Modify the data object directly
  for (const key in metaData) {
    metaData[key] = processValue(metaData[key])
  }

  const converted = convert(metaData)

  let merged = '---\n'

  merged += converted

  merged += '---\n\n'

  // replace /api/outstatic/images/ references
  const newContent = replaceImagePath({
    markdownContent: data.content,
    basePath,
    repoOwner,
    repoSlug,
    repoBranch,
    media: sources,
    publicMediaPath,
    repoMediaPath
  })

  merged += newContent

  return merged
}
