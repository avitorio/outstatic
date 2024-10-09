import { Document } from '@/types'
import DOMPurify from 'dompurify'
import replaceImagePath from './replaceImagePath'
import { API_MEDIA_PATH } from './constants'

export const mergeMdMeta = (
  data: Document & Record<string, any>,
  basePath: string,
  repoInfo: string,
  publicMediaPath: string
): string => {
  const apiMediaPath = `${basePath}${API_MEDIA_PATH}${repoInfo}`

  const processValue = (value: any): any => {
    if (value instanceof Date) {
      return value.toISOString()
    }
    if (typeof value === 'object' && value !== null) {
      return Object.fromEntries(
        Object.entries(value).map(([subKey, subValue]) => [
          subKey,
          processValue(subValue)
        ])
      )
    }
    if (typeof value === 'string' && value.startsWith(apiMediaPath)) {
      const regex = new RegExp(`(${apiMediaPath})([^\\s"'\\)]+)`, 'g')
      return value.replace(regex, (match, apiPath, filename) => {
        return `${basePath}/${publicMediaPath}${filename}`
      })
    }
    return value
  }

  const meta: Record<string, any> = Object.entries(
    (({ content, ...meta }) => meta)(data)
  ).map(([key, value]) => {
    return [key, processValue(value)]
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

  console.log(merged)

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
