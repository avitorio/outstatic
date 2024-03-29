import { API_IMAGES_PATH, IMAGES_PATH } from './constants'

export const parseContent = (content: string, basePath = '') => {
  // Prepare regex
  let regex = new RegExp(
    `(\\!\\[[^\\]]*\\]\\()${basePath}/${IMAGES_PATH.replace(
      /\//g,
      '\\/'
    )}([^)]+)`,
    'g'
  )

  // Replace the path for image files in Markdown image syntax, regardless of file format
  let result = content.replace(regex, `$1${basePath}/${API_IMAGES_PATH}$2`)
  // fetch images from GitHub in case deploy is not done yet
  return result
}
