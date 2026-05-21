import replaceImagePath from './replace-image-path'
import {
  buildMediaApiPrefix,
  buildPublicMediaPath,
  resolveMediaSources,
  sortMediaSourcesByRepoPathSpecificity
} from './media-config'
import { MediaSourceConfig } from './metadata/types'

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const getIndent = (level: number) => ' '.repeat(level)

const formatYamlString = (value: string, indent: number) => {
  if (!value.includes('\n')) {
    return JSON.stringify(value)
  }

  const chompingIndicator = value.endsWith('\n') ? '|' : '|-'
  const blockIndent = getIndent(indent + 2)
  const lines = value.replace(/\n$/, '').split('\n')

  return [
    chompingIndicator,
    ...lines.map((line) => (line ? `${blockIndent}${line}` : ''))
  ].join('\n')
}

const formatYamlValue = (value: any, indent: number): string => {
  if (value === undefined || value === null) return 'null'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'string') return formatYamlString(value, indent)

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'

    const lines = value
      .map((item) => {
        const itemIndent = getIndent(indent + 2)

        if (
          item &&
          typeof item === 'object' &&
          !Array.isArray(item) &&
          Object.keys(item).length > 0
        ) {
          const [firstKey, ...remainingKeys] = Object.keys(item)
          const firstValue = formatYamlValue(item[firstKey], indent + 2)
          const firstLine = `${itemIndent}- ${firstKey}: ${firstValue}`
          const remainingLines = remainingKeys.map(
            (key) =>
              `${getIndent(indent + 4)}${key}: ${formatYamlValue(
                item[key],
                indent + 4
              )}`
          )

          return [firstLine, ...remainingLines].join('\n')
        }

        return `${itemIndent}- ${formatYamlValue(item, indent + 2)}`
      })
      .join('\n')

    return `\n${lines}`
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value).filter(
      ([, entryValue]) => entryValue !== undefined
    )

    if (entries.length === 0) return '{}'

    return entries
      .map(
        ([key, entryValue]) =>
          `\n${getIndent(indent + 2)}${key}: ${formatYamlValue(
            entryValue,
            indent + 2
          )}`
      )
      .join('')
  }

  return JSON.stringify(value)
}

const stringifyFrontmatter = (data: Record<string, any>) =>
  Object.entries(data)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}: ${formatYamlValue(value, 0)}`)
    .join('\n')

export const mergeMdMeta = ({
  data,
  basePath,
  repoOwner,
  repoSlug,
  repoBranch,
  media,
  publicMediaPath,
  repoMediaPath
}: {
  data: Record<string, any> & { content: string }
  basePath: string
  repoOwner: string
  repoSlug: string
  repoBranch: string
  media?: MediaSourceConfig[]
  publicMediaPath?: string
  repoMediaPath?: string
}): string => {
  const sources = media?.length
    ? media
    : resolveMediaSources({ publicMediaPath, repoMediaPath })

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
    if (typeof value === 'string') {
      return sortMediaSourcesByRepoPathSpecificity(sources).reduce(
        (currentValue, source) => {
          const apiMediaPath = buildMediaApiPrefix({
            basePath,
            repoOwner,
            repoSlug,
            repoBranch,
            source
          })
          const regex = new RegExp(
            `(${escapeRegExp(apiMediaPath)})([^\\s"'\\)]+)`,
            'g'
          )

          return currentValue.replace(regex, (_match, _apiPath, filename) => {
            return buildPublicMediaPath(source, filename)
          })
        },
        value
      )
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

  const converted = stringifyFrontmatter(metaData)

  let merged = '---\n'

  merged += converted + '\n'

  merged += '---\n\n'

  // replace /api/outstatic/images/ references
  const newContent = replaceImagePath({
    markdownContent: data.content,
    basePath,
    repoOwner,
    repoSlug,
    repoBranch,
    media: sources,
    publicMediaPath,
    repoMediaPath
  })

  merged += newContent

  return merged
}
