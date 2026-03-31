import { Document } from '@/types'
import { convert } from '@catalystic/json-to-yaml'
import { API_MEDIA_PATH } from './constants'
import replaceImagePath from './replace-image-path'

export const mergeMdMeta = ({
  data,
  basePath,
  repoInfo,
  publicMediaPath
}: {
  data: Document & Record<string, any>
  basePath: string
  repoInfo: string
  publicMediaPath: string
}): string => {
  const apiMediaPath = `${basePath}${API_MEDIA_PATH}${repoInfo}`

  const processValue = (value: any): any => {
    if (value instanceof Date) {
      return value.toISOString()
    }
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        return value.map(processValue)
      }
      return Object.fromEntries(
        Object.entries(value).map(([subKey, subValue]) => [
          subKey,
          processValue(subValue)
        ])
      )
    }
    if (typeof value === 'string' && value.startsWith(apiMediaPath)) {
      const regex = new RegExp(`(${apiMediaPath})([^\\s"'\\)]+)`, 'g')
      return value.replace(regex, (_match, _apiPath, filename) => {
        return `/${publicMediaPath}${filename}`
      })
    }
    return value
  }

  // Create a new object from data excluding the 'content' property
  const metaData = Object.fromEntries(
    Object.entries(data).filter(([key]) => key !== 'content')
  )

  // Modify the data object directly
  for (const key in metaData) {
    metaData[key] = processValue(metaData[key])
  }

  const converted = convert(metaData)

  let merged = '---\n'

  merged += converted

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
