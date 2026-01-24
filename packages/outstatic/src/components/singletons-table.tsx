import { DeleteDocumentButton } from '@/components/delete-document-button'
import { useGetMetadata } from '@/utils/hooks/useGetMetadata'
import { sentenceCase } from 'change-case'
import cookies from 'js-cookie'
import { ListFilter, Settings } from 'lucide-react'
import { useState, useCallback, useMemo } from 'react'
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
import { useOutstatic } from '@/utils/hooks/useOutstatic'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { OstDocument } from '@/types/public'
import { SortableSelect } from '@/components/sortable-select'

export type Column = {
  id: string
  label: string
  value: string
}

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

export const SingletonsTable = () => {
  const { data: metadataData, refetch } = useGetMetadata()
  const { dashboardRoute } = useOutstatic()
  const router = useRouter()

  const [showColumnOptions, setShowColumnOptions] = useState(false)

  const singletons = useMemo(() => {
    if (!metadataData?.metadata?.metadata) return []
    return metadataData.metadata.metadata.filter(
      (item) => item.collection === '_singletons'
    )
  }, [metadataData])

  const documents = useMemo(() => {
    return singletons.map((item): OstDocument => ({
      slug: item.slug as string,
      title: item.title as string,
      status: item.status as string,
      publishedAt: formatDate(item.publishedAt as string),
      collection: item.collection as string,
      content: ''
    }))
  }, [singletons])

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'title',
    direction: 'ascending'
  })

  const sortedDocuments = useSortedDocuments(documents, sortConfig)

  const requestSort = useCallback((key: keyof OstDocument) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === 'ascending'
          ? 'descending'
          : 'ascending'
    }))
  }, [])

  const handleRowClick = useCallback(
    (document: OstDocument) => {
      router.push(`${dashboardRoute}/singletons/${document.slug}`)
    },
    [dashboardRoute, router]
  )

  const allColumns: Column[] = [
    { id: 'title', label: 'Title', value: 'title' },
    { id: 'status', label: 'Status', value: 'status' },
    { id: 'slug', label: 'Slug', value: 'slug' },
    { id: 'publishedAt', label: 'Published At', value: 'publishedAt' }
  ]

  const [columns, setColumns] = useState<Column[]>(
    JSON.parse(cookies.get('ost_singletons_fields') || 'null') ??
      allColumns.slice(0, 4)
  )

  return (
    <div className="border border-solid border-muted rounded-md shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-foreground">
          <thead className="text-xs uppercase text-foreground border-b border-muted">
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
          <tbody className="[&_tr:last-child]:border-0">
            {sortedDocuments.map((document) => (
              <tr
                key={document.slug}
                className="hover:bg-muted/50 border-b border-muted cursor-pointer"
                onClick={() => handleRowClick(document)}
              >
                {columns.map((column) => (
                  <td
                    key={column.value}
                    className="px-6 py-4 text-base font-semibold text-foreground"
                  >
                    {document[column.value] as string}
                  </td>
                ))}
                <td
                  className="pr-6 py-4 text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-end gap-2">
                    <Button asChild size="icon" variant="ghost">
                      <Link href={`${dashboardRoute}/singletons/${document.slug}/fields`}>
                        <span className="sr-only">Edit singleton fields</span>
                        <Settings className="w-6 h-6" />
                      </Link>
                    </Button>
                    <DeleteDocumentButton
                      slug={document.slug}
                      extension="md"
                      disabled={false}
                      onComplete={() => refetch()}
                      collection="_singletons"
                    />
                  </div>
                </td>
              </tr>
            ))}
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
                cookies.set('ost_singletons_fields', JSON.stringify(e))
              }}
              onBlur={() => setShowColumnOptions(false)}
            />
          </div>
        )}
      </div>
    </div>
  )
}
