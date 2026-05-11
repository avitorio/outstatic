import type { OstDocument } from '@/types/public'
import type { Row } from '@tanstack/react-table'

export function publishedAtSortingFn<TData extends Record<string, unknown>>(
  rowA: Row<TData>,
  rowB: Row<TData>,
  columnId: string
): number {
  const a = rowA.getValue<string>(columnId)
  const b = rowB.getValue<string>(columnId)
  const dateA = a ? new Date(a).getTime() : 0
  const dateB = b ? new Date(b).getTime() : 0
  return dateA - dateB
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
