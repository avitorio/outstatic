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
  CaretDownIcon,
  CaretSortIcon,
  CaretUpIcon
} from '@radix-ui/react-icons'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingFn,
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
import { ReactNode, useMemo, useState } from 'react'

type DocumentRow = OstDocument & { extension?: MDExtensions }

const publishedAtSortingFn: SortingFn<DocumentRow> = (rowA, rowB, columnId) => {
  const a = rowA.getValue<string>(columnId)
  const b = rowB.getValue<string>(columnId)
  const dateA = a ? new Date(a).getTime() : 0
  const dateB = b ? new Date(b).getTime() : 0
  return dateA - dateB
}

const statusSortingFn: SortingFn<DocumentRow> = (rowA, rowB) => {
  const a = rowA.original
  const b = rowB.original
  if (a.status === b.status) {
    return a.title.localeCompare(b.title)
  }
  return a.status === 'published' ? 1 : -1
}

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

type VisibilityPreference =
  | { type: 'default' }
  | { type: 'custom'; visible: Set<string> }

const readStoredPreference = (cookieKey: string): VisibilityPreference => {
  const stored = JSON.parse(cookies.get(cookieKey) || 'null') as
    | { value: string }[]
    | null
  if (!stored) return { type: 'default' }
  return { type: 'custom', visible: new Set(stored.map((c) => c.value)) }
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

  const allColumnIds = useMemo(
    () => Array.from(data?.metadata?.keys() ?? []),
    [data?.metadata]
  )

  const cookieKey = `ost_${params.ost[0]}_fields`

  const [sorting, setSorting] = useState<SortingState>([
    { id: 'publishedAt', desc: true }
  ])

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const [visibilityPreference, setVisibilityPreference] =
    useState<VisibilityPreference>(() => readStoredPreference(cookieKey))

  const columnVisibility = useMemo<VisibilityState>(() => {
    if (allColumnIds.length === 0) return {}
    const visibleIds =
      visibilityPreference.type === 'custom'
        ? visibilityPreference.visible
        : new Set(allColumnIds.slice(0, 5))
    return Object.fromEntries(
      allColumnIds.map((id) => [id, visibleIds.has(id)])
    )
  }, [allColumnIds, visibilityPreference])

  const columns = useMemo<ColumnDef<DocumentRow>[]>(
    () =>
      allColumnIds.map((id) => ({
        id,
        accessorKey: id,
        enableHiding: true,
        ...(id === 'publishedAt' && { sortingFn: publishedAtSortingFn }),
        ...(id === 'status' && { sortingFn: statusSortingFn }),
        header: ({ column }) => {
          const sorted = column.getIsSorted()
          return (
            <Button
              variant="ghost"
              className="-ml-3 h-8 data-[state=open]:bg-accent"
              onClick={() => column.toggleSorting(sorted === 'asc')}
            >
              <span>{sentenceCase(id)}</span>
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
        cell: ({ getValue }) => {
          const value = getValue()
          if (id === 'status') {
            return <span data-testid="status-cell">{value as ReactNode}</span>
          }
          return renderCellValue(value)
        }
      })),
    [allColumnIds]
  )

  const table = useReactTable({
    data: documents,
    columns,
    state: { sorting, columnVisibility, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: (updater) => {
      const next =
        typeof updater === 'function' ? updater(columnVisibility) : updater
      const visible = new Set(allColumnIds.filter((id) => next[id] !== false))
      setVisibilityPreference({ type: 'custom', visible })
      const visibleColumns = allColumnIds
        .filter((id) => visible.has(id))
        .map((id) => ({ id, label: sentenceCase(id), value: id }))
      cookies.set(cookieKey, JSON.stringify(visibleColumns))
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
          <DropdownMenuContent align="end" className="capitalize">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {sentenceCase(column.id)}
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
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                    <TableCell
                      className="text-right"
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
