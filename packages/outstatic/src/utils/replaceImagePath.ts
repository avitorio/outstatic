import { API_MEDIA_PATH } from './constants'

// Function to replace the API image paths with the production paths.
// Used when saving the content.
interface ReplaceImagePathParams {
  markdownContent: string
  basePath: string
  repoInfo: string
  publicMediaPath: string
}

function replaceImagePath({
  markdownContent,
  basePath,
  repoInfo,
  publicMediaPath
}: ReplaceImagePathParams): string {
  const apiMediaPath = `${basePath}${API_MEDIA_PATH}${repoInfo}`
  const regex = new RegExp(
    `!\\[([^\\]]*?)\\]\\((${apiMediaPath})([^\\)]+?)\\)`,
    'g'
  )

  // Do not remove the match and apiPath parameters, they are required.
  let updatedMarkdown = markdownContent.replace(
    regex,
    (match, altText, apiPath, filename) => {
      return `![${altText}](${basePath}/${publicMediaPath}${filename})`
    }
  )

  return updatedMarkdown
}

export default replaceImagePath
