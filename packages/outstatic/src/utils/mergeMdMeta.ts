import DOMPurify from 'dompurify'
import { Content } from '../types'

const convertDateToYYYYMMDD = (date: Date) => {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export const mergeMdMeta = (data: Content): string => {
  const meta = Object.entries(
    (({ content, publishedAt, ...meta }) => meta)(data)
  )
  if (data.publishedAt) {
    meta.push(['publishedAt', data.publishedAt.toISOString()])
  }

  let merged = '---\n'
  Object.entries(meta).forEach(([_, value]) => {
    merged += `${value[0]}: '${DOMPurify.sanitize(value[1]).replaceAll(
      "'",
      "''"
    )}'\n`
  })
  merged += '---\n'
  merged += data.content

  return merged
}
