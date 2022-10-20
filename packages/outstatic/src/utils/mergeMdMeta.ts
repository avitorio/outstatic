import showdown from 'showdown'
import DOMPurify from 'dompurify'
import { Document } from '../types'
import { replaceImageSrcRoot } from './replaceImageSrc'

export const mergeMdMeta = (data: Document): string => {
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

  const converter = new showdown.Converter()

  // replace /api/outstatic/images/ references
  let newContent = replaceImageSrcRoot(
    data.content,
    '/api/outstatic/images/',
    '/images/'
  )

  const imgFolderRegex = new RegExp(/(^\/api\/outstatic\/images\/)/gi)
  newContent = replaceImageSrcRoot(newContent, imgFolderRegex, `/images/`)

  // remove weird <p> tags
  newContent.replaceAll('<p><br></p>', '').replaceAll('<br></p>', '</p>')

  const markdown = converter.makeMarkdown(newContent)

  // replace leftover html comment with empty line
  const cleanMarkdown = markdown
    .replaceAll('\n\n\n<!-- -->\n\n', '\n\n')
    .replaceAll('](<', '](')
    .replaceAll('>)', ')')

  merged += cleanMarkdown
  return merged
}
