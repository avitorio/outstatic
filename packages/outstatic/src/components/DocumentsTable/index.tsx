import DeleteDocumentButton from '@/components/DeleteDocumentButton'
import SortableSelect from '@/components/SortableSelect'
import { OstDocument } from '@/types/public'
import { useGetDocuments } from '@/utils/hooks/useGetDocuments'
import { sentenceCase } from 'change-case'
import cookies from 'js-cookie'
import { ListFilter } from 'lucide-react'
import Link from 'next/link'
import { useState, useCallback, ReactNode } from 'react'
import { Button } from '@/components/ui/shadcn/button'
import {
  CaretSortIcon,
  CaretDownIcon,
  CaretUpIcon
} from '@radix-ui/react-icons'
import {
  useSortedDocuments,
  SortConfig
} from '@/utils/hooks/useSortedDocuments'
import useOutstatic from '@/utils/hooks/useOutstatic'
import { MDExtensions } from '@/types'
import { useParams } from 'next/navigation'

export type Column = {
  id: string
  label: string
  value: string
}

const DocumentsTable = () => {
  const { data, refetch } = useGetDocuments()
  const { dashboardRoute } = useOutstatic()

  const params = useParams<{ ost: string[] }>()
  const [showColumnOptions, setShowColumnOptions] = useState(false)

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'publishedAt',
    direction: 'descending'
  })

  const sortedDocuments = useSortedDocuments(data?.documents || [], sortConfig)

  const requestSort = useCallback((key: keyof OstDocument) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === 'ascending'
          ? 'descending'
          : 'ascending'
    }))
  }, [])

  const allColumns = Array.from(data?.metadata?.keys() ?? []).map(
    (column: string) => ({
      id: column,
      label: sentenceCase(column),
      value: column
    })
  )

  const [columns, setColumns] = useState<Column[]>(
    JSON.parse(cookies.get(`ost_${params.ost[0]}_fields`) || 'null') ??
      allColumns.slice(0, 5)
  )

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-gray-500">
        <thead className="bg-gray-50 text-xs uppercase text-gray-700 border-b">
          <tr>
            {columns.map((column) => (
              <th
                key={column.value}
                scope="col"
                className="px-6 py-3 cursor-pointer"
                onClick={() => requestSort(column.value)}
              >
                <div className="flex items-center">
                  <span>{column.label}</span>
                  <span
                    className="ml-2"
                    data-testid={`sort-icon-${column.value}`}
                  >
                    {sortConfig.key === column.value ? (
                      sortConfig.direction === 'ascending' ? (
                        <CaretUpIcon
                          className="h-4 w-4"
                          data-testid="caret-up-icon"
                        />
                      ) : (
                        <CaretDownIcon
                          className="h-4 w-4"
                          data-testid="caret-down-icon"
                        />
                      )
                    ) : (
                      <CaretSortIcon
                        className="h-4 w-4"
                        data-testid="caret-sort-icon"
                      />
                    )}
                  </span>
                </div>
              </th>
            ))}
            <th scope="col" className="px-6 py-3 text-right">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowColumnOptions(!showColumnOptions)}
              >
                <span className="sr-only">List Columns</span>
                <ListFilter />
              </Button>
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedDocuments
            ? sortedDocuments.map((document) => (
                <tr
                  key={document.slug}
                  className="border-b bg-white hover:bg-gray-50"
                >
                  {columns.map((column) => {
                    return cellSwitch(
                      column.value,
                      document,
                      dashboardRoute,
                      params.ost[0]
                    )
                  })}
                  <td className="pr-6 py-4 text-right">
                    <DeleteDocumentButton
                      slug={document.slug}
                      extension={document.extension as MDExtensions}
                      disabled={false}
                      onComplete={() => refetch()}
                      collection={params.ost[0]}
                    />
                  </td>
                </tr>
              ))
            : null}
        </tbody>
      </table>
      {showColumnOptions && (
        <div
          className={`absolute -top-12 max-w-full min-w-min capitalize right-0`}
        >
          <SortableSelect
            selected={columns}
            setSelected={setColumns}
            allOptions={allColumns}
            defaultValues={allColumns}
            onChangeList={(e: any) => {
              cookies.set(`ost_${params.ost[0]}_fields`, JSON.stringify(e))
            }}
            onBlur={() => setShowColumnOptions(false)}
          />
        </div>
      )}
    </div>
  )
}

const cellSwitch = (
  columnValue: string,
  document: OstDocument,
  dashboard: string,
  collection: string
) => {
  const item = document[columnValue] as
    | string
    | {
        label: string
      }[]
  switch (columnValue) {
    case 'title':
      return (
        <th
          key="title"
          scope="row"
          className="relative whitespace-nowrap px-6 py-4 text-base font-semibold text-gray-900 group"
        >
          <Link href={`${dashboard}/${collection}/${document.slug}`}>
            <div className="group-hover:text-blue-500">
              {item as string}
              <div className="absolute top-0 bottom-0 left-0 right-40 cursor-pointer" />
            </div>
          </Link>
        </th>
      )
    case 'status':
      return (
        <td
          key="status"
          className="px-6 py-4 text-base font-semibold text-gray-900"
          data-testid="status-cell"
        >
          {item as ReactNode}
        </td>
      )
    default:
      return (
        <td
          key={columnValue}
          className="px-6 py-4 text-base font-semibold text-gray-900"
        >
          {typeof item === 'object' && item !== null && Array.isArray(item)
            ? item.map((item: { label: string }) => (
                <span
                  key={item.label}
                  className="bg-gray-100 text-gray-800 font-medium me-2 px-2.5 py-0.5 rounded"
                >
                  {item.label}
                </span>
              ))
            : typeof item === 'string'
            ? item
            : null}
        </td>
      )
  }
}

export default DocumentsTable
