import { Document } from '@/types'
import DOMPurify from 'dompurify'
import replaceImagePath from './replaceImagePath'

export const mergeMdMeta = (data: Document): string => {
  const meta = Object.entries(
    (({ content, publishedAt, ...meta }) => meta)(data)
  )

  if (data.publishedAt) {
    meta.push(['publishedAt', data.publishedAt.toISOString()])
  }

  let merged = '---\n'

  Object.entries(meta).forEach(([_, value]) => {
    if (Array.isArray(value[1])) {
      merged += `${value[0]}: ${JSON.stringify(value[1])}\n`
    } else if (value[1] instanceof Object) {
      merged += `${value[0]}:\n`
      Object.entries(value[1]).forEach(([key, value]) => {
        merged += `  ${key}: '${DOMPurify.sanitize(value as string).replaceAll(
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

  // replace /api/outstatic/images/ references
  const newContent = replaceImagePath(data.content)

  merged += newContent
  return merged
}
