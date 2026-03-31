/**
 * A function that safely stringifies an error object for logging or display.
 * It handles circular references and common error properties.
 */
export function stringifyError(error: unknown): string {
  const cache = new Set()
  const replacer = (_key: string, value: any) => {
    if (typeof value === 'object' && value !== null) {
      if (cache.has(value)) {
        return '[Circular]'
      }
      cache.add(value)
    }
    if (value instanceof Error) {
      const errorObj: any = {}
      Object.getOwnPropertyNames(value).forEach((prop) => {
        errorObj[prop] = (value as any)[prop]
      })
      return errorObj
    }
    return value
  }

  try {
    return JSON.stringify(error, replacer, 2)
  } catch {
    return String(error)
  } finally {
    cache.clear()
  }
}
