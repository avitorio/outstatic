import {
  buildMediaApiPrefix,
  buildPublicMediaPath,
  resolveMediaSources
} from './media-config'
import { MediaSourceConfig } from './metadata/types'

// Function to replace the API image paths with the production paths.
// Used when saving the content.
interface ReplaceImagePathParams {
  markdownContent: string
  basePath: string
  repoOwner: string
  repoSlug: string
  repoBranch: string
  media?: MediaSourceConfig[]
  publicMediaPath?: string
  repoMediaPath?: string
}

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function replaceImagePath({
  markdownContent,
  basePath,
  repoOwner,
  repoSlug,
  repoBranch,
  media,
  publicMediaPath,
  repoMediaPath
}: ReplaceImagePathParams): string {
  const sources = media?.length
    ? media
    : resolveMediaSources({ publicMediaPath, repoMediaPath })

  return sources.reduce((content, source) => {
    const apiMediaPath = buildMediaApiPrefix({
      basePath,
      repoOwner,
      repoSlug,
      repoBranch,
      source
    })
    const regex = new RegExp(
      `!\\[([^\\]]*?)\\]\\((${escapeRegExp(apiMediaPath)})([^\\)]+?)\\)`,
      'g'
    )

    return content.replace(regex, (_match, altText, _apiPath, filename) => {
      return `![${altText}](${buildPublicMediaPath(source, filename)})`
    })
  }, markdownContent)
}

export default replaceImagePath
