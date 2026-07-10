const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/

export function isValidCalendarDate(date: Date): boolean {
  return !Number.isNaN(date.getTime())
}

export function getDateOnlyFrontmatterKeys(frontmatter: string): Set<string> {
  const keys = new Set<string>()
  const dateField =
    /^([A-Za-z_][A-Za-z0-9_.-]*):\s*['"]?(\d{4}-\d{2}-\d{2})['"]?(?:\s+#.*)?\s*$/

  for (const line of frontmatter.split('\n')) {
    const match = line.match(dateField)
    if (match) keys.add(match[1])
  }

  return keys
}

/**
 * Converts a known date-only frontmatter value to local calendar time. Callers
 * must pass `dateOnly: true` only after inspecting the raw YAML; a Date object
 * at midnight UTC can also be a deliberate timestamp.
 */
export function toCalendarDate(
  value: Date | string | number,
  options: { dateOnly?: boolean } = {}
): Date {
  if (typeof value === 'string') {
    const match = value.match(DATE_ONLY)
    if (match) {
      return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    }
  }

  const date = value instanceof Date ? value : new Date(value)
  if (
    options.dateOnly &&
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0
  ) {
    return new Date(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate()
    )
  }

  return date
}

export function normalizeDateOnlyFrontmatter<T extends Record<string, unknown>>(
  data: T,
  frontmatter: string
): T {
  const dateOnlyKeys = getDateOnlyFrontmatterKeys(frontmatter)
  if (dateOnlyKeys.size === 0) return data

  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      dateOnlyKeys.has(key) &&
      (value instanceof Date || typeof value === 'string')
        ? toCalendarDate(value, { dateOnly: true })
        : value
    ])
  ) as T
}
