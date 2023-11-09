import { API_IMAGES_PATH, IMAGES_PATH } from './constants'

// Function to replace the API image paths with the production paths.
function replaceImagePath(markdownContent: string): string {
  const regex = new RegExp(
    `!\\[([^\\]]*?)\\]\\((/${API_IMAGES_PATH})([^\\)]+?)\\)`,
    'g'
  )

  // Do not remove the match and apiPath parameters, they are required.
  let updatedMarkdown = markdownContent.replace(
    regex,
    (match, altText, apiPath, filename) =>
      `![${altText}](/${IMAGES_PATH}${filename})`
  )

  return updatedMarkdown
}

export default replaceImagePath
