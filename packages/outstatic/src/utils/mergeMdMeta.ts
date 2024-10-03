import { Document } from '@/types'
import DOMPurify from 'dompurify'
import replaceImagePath from './replaceImagePath'

export const mergeMdMeta = (
  data: Document & Record<string, any>,
  basePath: string,
  repoInfo: string,
  publicMediaPath: string
): string => {
  const meta: Record<string, any> = Object.entries(
    (({ content, ...meta }) => meta)(data)
  ).map(([key, value]) => {
    if (value instanceof Date) {
      return [key, value.toISOString()]
    }
    return [key, value]
  })

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
  const newContent = replaceImagePath({
    markdownContent: data.content,
    basePath,
    repoInfo,
    publicMediaPath
  })

  merged += newContent
  return merged
}
