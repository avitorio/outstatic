import type { OstDocument } from '@/types/public'
import type { Row } from '@tanstack/react-table'

export function publishedAtSortTime(value: unknown): number {
  if (value == null || value === '' || value === 0) return 0
  const time = new Date(String(value)).getTime()
  return Number.isNaN(time) ? 0 : time
}

export const publishedAtAccessor = <
  TRow extends { publishedAt?: string | null }
>(
  row: TRow
): string | number => {
  const value = row.publishedAt
  if (value == null || value === '') return 0
  return value
}

export function publishedAtSortingFn<TData extends Record<string, unknown>>(
  rowA: Row<TData>,
  rowB: Row<TData>,
  columnId: string
): number {
  return (
    publishedAtSortTime(rowA.getValue(columnId)) -
    publishedAtSortTime(rowB.getValue(columnId))
  )
}

type StatusSortable = Pick<OstDocument, 'status' | 'title'>

export function statusSortingFn<TData extends StatusSortable>(
  rowA: Row<TData>,
  rowB: Row<TData>
): number {
  const a = rowA.original
  const b = rowB.original
  if (a.status === b.status) {
    return a.title.localeCompare(b.title)
  }
  return a.status === 'published' ? 1 : -1
}
