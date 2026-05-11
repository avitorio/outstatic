import { DeleteDocumentButton } from '@/components/delete-document-button'
import { Button } from '@/components/ui/shadcn/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { OstDocument } from '@/types/public'
import { useOutstatic } from '@/utils/hooks/use-outstatic'
import { useSingletons } from '@/utils/hooks/use-singletons'
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
import cookies from 'js-cookie'
import { ChevronDown, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

type SingletonRow = Pick<
  OstDocument,
  'slug' | 'title' | 'status' | 'publishedAt' | 'collection' | 'content'
>

const COOKIE_KEY = 'ost_singletons_fields'

const COLUMN_DEFINITIONS: { id: keyof SingletonRow; label: string }[] = [
  { id: 'title', label: 'Title' },
  { id: 'status', label: 'Status' },
  { id: 'slug', label: 'Slug' },
  { id: 'publishedAt', label: 'Published At' }
]

const formatDate = (dateString: string): string => {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const statusSortingFn: SortingFn<SingletonRow> = (rowA, rowB) => {
  const a = rowA.original
  const b = rowB.original
  if (a.status === b.status) {
    return a.title.localeCompare(b.title)
  }
  return a.status === 'published' ? 1 : -1
}

const publishedAtSortingFn: SortingFn<SingletonRow> = (
  rowA,
  rowB,
  columnId
) => {
  const a = rowA.getValue<string>(columnId)
  const b = rowB.getValue<string>(columnId)
  const dateA = a ? new Date(a).getTime() : 0
  const dateB = b ? new Date(b).getTime() : 0
  return dateA - dateB
}

type SingletonRowActionsProps = {
  slug: string
  title: string
  status: 'draft' | 'published'
  dashboardRoute: string
  onDeleteComplete: () => void
}

const SingletonRowActions = ({
  slug,
  title,
  status,
  dashboardRoute,
  onDeleteComplete
}: SingletonRowActionsProps) => {
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Open row actions">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`${dashboardRoute}/singletons/${slug}/fields`}>
              Edit singleton fields
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault()
              setDeleteOpen(true)
            }}
            className="text-destructive focus:text-destructive"
          >
            Delete document
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DeleteDocumentButton
        slug={slug}
        extension="md"
        collection="_singletons"
        showTrigger={false}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onComplete={onDeleteComplete}
        status={status}
        title={title}
      />
    </>
  )
}

export const SingletonsTable = () => {
  const { data: singletonsData, refetch } = useSingletons()
  const { dashboardRoute } = useOutstatic()
  const router = useRouter()

  const documents = useMemo<SingletonRow[]>(() => {
    if (!singletonsData) return []
    return singletonsData.map((item) => ({
      slug: item.slug,
      title: item.title,
      status: item.status,
      publishedAt: formatDate(item.publishedAt ?? ''),
      collection: '_singletons',
      content: ''
    }))
  }, [singletonsData])

  const [sorting, setSorting] = useState<SortingState>([
    { id: 'title', desc: false }
  ])

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    () => {
      const stored = JSON.parse(cookies.get(COOKIE_KEY) || 'null') as
        | { value: string }[]
        | null
      const visible = new Set(
        stored
          ? stored.map((c) => c.value)
          : COLUMN_DEFINITIONS.map((c) => c.id)
      )
      return Object.fromEntries(
        COLUMN_DEFINITIONS.map((c) => [c.id, visible.has(c.id)])
      )
    }
  )

  const persistVisibility = (next: VisibilityState) => {
    const visibleColumns = COLUMN_DEFINITIONS.filter(
      (c) => next[c.id] !== false
    ).map((c) => ({ id: c.id, label: c.label, value: c.id }))
    cookies.set(COOKIE_KEY, JSON.stringify(visibleColumns))
  }

  const columns = useMemo<ColumnDef<SingletonRow>[]>(
    () =>
      COLUMN_DEFINITIONS.map(({ id, label }) => ({
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
              <span>{label}</span>
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
        cell: ({ getValue }) => (getValue() as string) ?? null
      })),
    []
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
        persistVisibility(next)
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
          <DropdownMenuContent align="end" className="capitalize">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                const def = COLUMN_DEFINITIONS.find((c) => c.id === column.id)
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {def?.label ?? column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
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
                const href = `${dashboardRoute}/singletons/${row.original.slug}`
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
                      <SingletonRowActions
                        slug={row.original.slug}
                        title={row.original.title}
                        status={row.original.status}
                        dashboardRoute={dashboardRoute}
                        onDeleteComplete={() => {
                          void refetch()
                        }}
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
