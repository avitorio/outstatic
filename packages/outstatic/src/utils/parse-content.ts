import {
  buildMediaApiPrefix,
  getPublicMediaPathPrefix,
  resolveMediaSources,
  sortMediaSourcesByPublicPathSpecificity
} from './media-config'
import { MediaSourceConfig } from './metadata/types'

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

interface ParseContentParams {
  content: string
  basePath: string
  repoOwner: string
  repoSlug: string
  repoBranch: string
  media?: MediaSourceConfig[]
  publicMediaPath?: string
  repoMediaPath?: string
}

export const parseContent = ({
  content,
  basePath,
  repoOwner,
  repoSlug,
  repoBranch,
  media,
  publicMediaPath,
  repoMediaPath
}: ParseContentParams) => {
  const sources = media?.length
    ? media
    : resolveMediaSources({ publicMediaPath, repoMediaPath })

  if (sources.length === 0) {
    return content
  }

  return sortMediaSourcesByPublicPathSpecificity(sources).reduce(
    (result, source) => {
      const mediaRegex = new RegExp(
        `(\\!\\[[^\\]]*\\]\\()${escapeRegExp(getPublicMediaPathPrefix(source))}([^)]+)`,
        'g'
      )

      return result.replace(
        mediaRegex,
        `$1${buildMediaApiPrefix({
          basePath,
          repoOwner,
          repoSlug,
          repoBranch,
          source
        })}$2`
      )
    },
    content
  )
}
