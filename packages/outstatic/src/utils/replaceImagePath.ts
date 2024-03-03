import { API_IMAGES_PATH, IMAGES_PATH } from './constants'

// Function to replace the API image paths with the production paths.
function replaceImagePath(markdownContent: string, basePath = ''): string {
  const regex = new RegExp(
    `!\\[([^\\]]*?)\\]\\((${basePath}/${API_IMAGES_PATH})([^\\)]+?)\\)`,
    'g'
  )

  // Do not remove the match and apiPath parameters, they are required.
  let updatedMarkdown = markdownContent.replace(
    regex,
    (match, altText, apiPath, filename) =>
      `![${altText}](${basePath}/${IMAGES_PATH}${filename})`
  )

  return updatedMarkdown
}

export default replaceImagePath
