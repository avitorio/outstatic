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
  merged += '---\n'

  const converter = new showdown.Converter()

  merged += converter.makeMarkdown(data.content)

  return merged
}
