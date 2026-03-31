import { API_MEDIA_PATH } from './constants'

interface ParseContentParams {
  content: string
  basePath: string
  repoOwner: string
  repoSlug: string
  repoBranch: string
  publicMediaPath?: string
  repoMediaPath?: string
}

export const parseContent = ({
  content,
  basePath,
  repoOwner,
  repoSlug,
  repoBranch,
  publicMediaPath,
  repoMediaPath
}: ParseContentParams) => {
  // If media paths are not configured, return content unchanged
  if (!publicMediaPath || !repoMediaPath) {
    return content
  }

  // Prepare regex
  const mediaRegex = new RegExp(
    `(\\!\\[[^\\]]*\\]\\()/${publicMediaPath.replace(/\//g, '\\/')}([^)]+)`,
    'g'
  )

  // Replace the path for image files in Markdown image syntax, regardless of file format
  const result = content.replace(
    mediaRegex,
    `$1${basePath}${API_MEDIA_PATH}${repoOwner}/${repoSlug}/${repoBranch}/${repoMediaPath}$2`
  )

  // fetch images from GitHub in case deploy is not done yet
  return result
}
