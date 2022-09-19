import showdown from 'showdown'
import DOMPurify from 'dompurify'
import { Content } from '../types'

export const mergeMdMeta = (data: Content): string => {
  const meta = Object.entries(
    (({ content, publishedAt, ...meta }) => meta)(data)
  )

  if (data.publishedAt) {
    meta.push(['publishedAt', data.publishedAt.toISOString()])
  }

  let merged = '---\n'
  Object.entries(meta).forEach(([_, value]) => {
    if (value[1] instanceof Object) {
      merged += `${value[0]}:\n`
      Object.entries(value[1]).forEach(([key, value]) => {
        merged += `  ${key}: '${DOMPurify.sanitize(value).replaceAll(
          "'",
          "''"
        )}'\n`
      })
    } else {
      merged += `${value[0]}: '${DOMPurify.sanitize(value[1]).replaceAll(
        "'",
        "''"
      )}'\n`
    }
  })

  merged += '---\n\n'

  const converter = new showdown.Converter()

  converter.setFlavor('github')
  converter.setOption('simpleLineBreaks', false)

  // remove weird <p> tags
  const cleanContent = data.content
    .replaceAll('<p><br></p>', '')
    .replaceAll('<br></p>', '</p>')

  const markdown = converter.makeMarkdown(cleanContent)

  // replace leftover html comment with empty line
  merged += markdown.replaceAll('\n\n\n<!-- -->\n\n', '\n\n')

  return merged
}
