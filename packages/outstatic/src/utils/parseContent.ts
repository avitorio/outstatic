import { API_MEDIA_PATH } from './constants'

interface ParseContentParams {
  content: string
  basePath: string
  repoOwner: string
  repoSlug: string
  repoBranch: string
  mediaPath: string
}

export const parseContent = ({
  content,
  basePath,
  repoOwner,
  repoSlug,
  repoBranch,
  mediaPath
}: ParseContentParams) => {
  // Prepare regex
  let regex = new RegExp(
    `(\\!\\[[^\\]]*\\]\\()${basePath}/${mediaPath.replace(
      /\//g,
      '\\/'
    )}([^)]+)`,
    'g'
  )

  // Replace the path for image files in Markdown image syntax, regardless of file format
  let result = content.replace(
    regex,
    `$1${basePath}${API_MEDIA_PATH}${repoOwner}/${repoSlug}/${repoBranch}/$2`
  )
  // fetch images from GitHub in case deploy is not done yet
  return result
}
