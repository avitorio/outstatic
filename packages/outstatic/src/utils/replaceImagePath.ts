import { API_IMAGES_PATH, IMAGES_PATH } from './constants'

// Function to replace the API image paths with the desired path
function replaceImagePath(markdownContent: string): string {
  // Define the regex pattern to find the images, capturing the alt text, and the rest of the path.
  // The 'g' flag is for a global search (all occurrences).
  const imagePathRegex: RegExp = new RegExp(
    `!\\[(.*?)\\]\\(${API_IMAGES_PATH}(.*?)\\)`,
    'g'
  )

  // Replace the occurrences with the correct path, keeping the alt text intact
  const updatedMarkdown: string = markdownContent.replace(
    imagePathRegex,
    `![$1](${IMAGES_PATH}$2)`
  )

  return updatedMarkdown
}

export default replaceImagePath
