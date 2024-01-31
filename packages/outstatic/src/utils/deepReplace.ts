import { Document } from '@/types'

export const deepReplace = (
  obj: Document,
  key: string,
  value: string | Date | object
) => {
  const dates: { [x: string]: Date } = {}
  Object.entries(obj).forEach(([k, v]) => {
    if (!isNaN(new Date(v as Date).getMonth())) {
      dates[k] = k === key ? (value as Date) : (v as Date)
    }
  })
  const clone = JSON.parse(JSON.stringify(obj))
  const keys = key.split('.')
  const lastKey = keys.pop() as string
  const lastObj = keys.reduce((clone, key) => clone[key], clone)
  try {
    if (lastObj[lastKey] !== undefined) {
      lastObj[lastKey] = value
    }
  } catch {
    console.log(`Key ${key} not found`)
  }
  return { ...clone, ...dates }
}
