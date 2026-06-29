import { DeleteDocumentButton } from '@/components/delete-document-button'
import { Button } from '@/components/ui/shadcn/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger
} from '@/components/ui/shadcn/dropdown-menu'
import { Input } from '@/components/ui/shadcn/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/shadcn/table'
import { MDExtensions } from '@/types'
import { OstDocument } from '@/types/public'
import { useGetDocuments } from '@/utils/hooks/use-get-documents'
import { useOutstatic } from '@/utils/hooks/use-outstatic'
import {
  publishedAtAccessor,
  publishedAtSortingFn,
  statusSortingFn
} from '@/utils/table-sorting'
import {
  CaretDownIcon,
  CaretSortIcon,
  CaretUpIcon
} from '@radix-ui/react-icons'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'
import { sentenceCase } from 'change-case'
import cookies from 'js-cookie'
import { ChevronDown } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { ReactNode, useLayoutEffect, useMemo, useState } from 'react'

type DocumentRow = OstDocument & { extension?: MDExtensions }

const DOCUMENT_COLUMN_LABELS: Record<string, string> = {
  title: 'Title',
  status: 'Status',
  slug: 'Slug',
  publishedAt: 'Published At'
}

const getDefaultSortColumnId = (columnIds: string[]): string | undefined =>
  columnIds.includes('publishedAt') ? 'publishedAt' : columnIds[0]

const documentColumnLabel = (id: string): string =>
  DOCUMENT_COLUMN_LABELS[id] ?? sentenceCase(id)

const renderCellValue = (value: unknown): ReactNode => {
  if (Array.isArray(value)) {
    return value.map((item: { label: string }) => (
      <span
        key={item.label}
        className="bg-muted text-muted-foreground me-2 rounded px-2.5 py-0.5 text-xs font-medium"
      >
        {item.label}
      </span>
    ))
  }
  if (typeof value === 'string') return value
  return null
}

const readInitialVisibility = (
  columnIds: string[],
  cookieKey: string
): VisibilityState => {
  const stored = JSON.parse(cookies.get(cookieKey) || 'null') as
    | { value: string }[]
    | null
  const visible = new Set(
    stored ? stored.map((c) => c.value) : columnIds.slice(0, 5)
  )
  return Object.fromEntries(columnIds.map((id) => [id, visible.has(id)]))
}

const persistVisibility = (
  visibility: VisibilityState,
  columnIds: string[],
  cookieKey: string
) => {
  const visibleColumns = columnIds
    .filter((id) => visibility[id] !== false)
    .map((id) => ({ id, label: documentColumnLabel(id), value: id }))
  cookies.set(cookieKey, JSON.stringify(visibleColumns))
}

export const DocumentsTable = () => {
  const { data, refetch } = useGetDocuments()
  const { dashboardRoute } = useOutstatic()
  const router = useRouter()
  const params = useParams<{ ost: string[] }>()

  const documents = useMemo(
    () => (data?.documents ?? []) as DocumentRow[],
    [data?.documents]
  )

  const allColumnIds = data?.metadata ? Array.from(data.metadata.keys()) : []
  const columnIdsKey = allColumnIds.join('\0')

  const cookieKey = `ost_${params.ost[0]}_fields`

  const [sorting, setSorting] = useState<SortingState>([])

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  useLayoutEffect(
    () => {
      if (allColumnIds.length === 0) {
        setColumnVisibility({})
        setSorting([])
        return
      }
      setColumnVisibility(readInitialVisibility(allColumnIds, cookieKey))
      setSorting((prev) => {
        const valid = prev.filter((s) => allColumnIds.includes(s.id))
        if (valid.length > 0) return valid
        const defaultId = getDefaultSortColumnId(allColumnIds)
        return defaultId ? [{ id: defaultId, desc: true }] : []
      })
      // `columnIdsKey` is content-based so metadata Map identity (e.g. new refs per render) does not retrigger.
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- columnIdsKey tracks column order; allColumnIds is a new array when metadata is a new Map reference each render
    [columnIdsKey, cookieKey]
  )

  const columns = useMemo<ColumnDef<DocumentRow>[]>(
    () =>
      allColumnIds.map((id) => ({
        id,
        ...(id === 'publishedAt'
          ? {
              accessorFn: publishedAtAccessor,
              sortingFn: publishedAtSortingFn
            }
          : { accessorKey: id }),
        enableHiding: true,
        ...(id === 'status' && { sortingFn: statusSortingFn }),
        header: ({ column }) => {
          const sorted = column.getIsSorted()
          return (
            <Button
              variant="ghost"
              className="-ml-3 h-8 data-[state=open]:bg-accent"
              onClick={() => column.toggleSorting(sorted === 'asc')}
            >
              <span>{documentColumnLabel(id)}</span>
              <span className="ml-2" data-testid={`sort-icon-${id}`}>
                {sorted === 'asc' ? (
                  <CaretUpIcon
                    className="h-4 w-4"
                    data-testid="caret-up-icon"
                  />
                ) : sorted === 'desc' ? (
                  <CaretDownIcon
                    className="h-4 w-4"
                    data-testid="caret-down-icon"
                  />
                ) : (
                  <CaretSortIcon
                    className="h-4 w-4"
                    data-testid="caret-sort-icon"
                  />
                )}
              </span>
            </Button>
          )
        },
        cell: ({ getValue, row }) => {
          const value =
            id === 'publishedAt' ? row.original.publishedAt : getValue()
          if (id === 'status') {
            return <span data-testid="status-cell">{value as ReactNode}</span>
          }
          if (id === 'title') {
            return (
              <span className="font-semibold">{renderCellValue(value)}</span>
            )
          }
          return renderCellValue(value)
        }
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- columnIdsKey tracks allColumnIds content
    [columnIdsKey]
  )

  const table = useReactTable({
    data: documents,
    columns,
    state: { sorting, columnVisibility, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: (updater) => {
      setColumnVisibility((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater
        persistVisibility(next, allColumnIds, cookieKey)
        return next
      })
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel()
  })

  const titleColumn = table.getColumn('title')

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 pb-4">
        {titleColumn ? (
          <Input
            placeholder="Filter titles..."
            value={(titleColumn.getFilterValue() as string) ?? ''}
            onChange={(event) => titleColumn.setFilterValue(event.target.value)}
            className="max-w-sm"
          />
        ) : null}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {documentColumnLabel(column.id)}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
                <TableHead />
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => {
                const href = `${dashboardRoute}/${params.ost[0]}/${row.original.slug}`
                return (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer"
                    onClick={(event) => {
                      if (event.metaKey || event.ctrlKey || event.shiftKey) {
                        window.open(href, '_blank', 'noopener,noreferrer')
                      } else {
                        router.push(href)
                      }
                    }}
                    onAuxClick={(event) => {
                      if (event.button === 1) {
                        event.preventDefault()
                        window.open(href, '_blank', 'noopener,noreferrer')
                      }
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="whitespace-normal">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                    <TableCell
                      className="text-right whitespace-normal"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DeleteDocumentButton
                        slug={row.original.slug}
                        extension={row.original.extension as MDExtensions}
                        disabled={false}
                        onComplete={() => {
                          void refetch()
                        }}
                        collection={params.ost[0]}
                        status={row.original.status}
                        title={row.original.title}
                      />
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
