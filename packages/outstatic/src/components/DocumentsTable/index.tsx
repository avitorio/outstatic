import { sentenceCase } from 'change-case'
import cookies from 'js-cookie'
import { Settings } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { OstDocument } from '../../types/public'
import DeleteDocumentButton from '../DeleteDocumentButton'
import SortableSelect from '../SortableSelect'

type DocumentsTableProps = {
  documents: OstDocument[]
  collection: string
}

export type Column = {
  label: string
  value: string
}

const defaultColumns: Column[] = [
  { label: 'Title', value: 'title' },
  { label: 'Status', value: 'status' },
  { label: 'Published at', value: 'publishedAt' }
]

const DocumentsTable = (props: DocumentsTableProps) => {
  const allColumns = Object.keys(props.documents[0]).map((column: string) => ({
    label: sentenceCase(column),
    value: column
  }))
  const [documents, setDocuments] = useState(props.documents)
  const [columns, setColumns] = useState<readonly Column[]>(
    JSON.parse(cookies.get(`ost_${props.collection}_fields`) || 'null') ??
      defaultColumns
  )
  const [showColumnOptions, setShowColumnOptions] = useState(false)

  return (
    <div>
      <table className="w-full text-left text-sm text-gray-500">
        <thead className="bg-gray-50 text-xs uppercase text-gray-700 border-b">
          <tr>
            {columns.map((column) => (
              <th key={column.value} scope="col" className="px-6 py-3">
                {column.label}
              </th>
            ))}
            <th
              scope="col"
              className="px-8 py-2 text-right flex justify-end items-center"
            >
              <button onClick={() => setShowColumnOptions(!showColumnOptions)}>
                <Settings />
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {documents &&
            documents.map((document) => (
              <tr
                key={document.slug}
                className="border-b bg-white hover:bg-gray-50"
              >
                {columns.map((column) => {
                  return cellSwitch(column.value, document, props.collection)
                })}
                <td className="pr-6 py-4 text-right">
                  <DeleteDocumentButton
                    slug={document.slug}
                    disabled={false}
                    onComplete={() =>
                      setDocuments(
                        documents.filter((p) => p.slug !== document.slug)
                      )
                    }
                    collection={props.collection}
                  />
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
            allOptions={allColumns}
            defaultValues={defaultColumns}
            onChange={(e: any) => {
              setColumns(e)
              cookies.set(`ost_${props.collection}_fields`, JSON.stringify(e))
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
          <Link href={`/outstatic/${collection}/${document.slug}`}>
            <div className="group-hover:text-blue-500">
              {item as string}
              <div className="absolute top-0 bottom-0 left-0 right-40 cursor-pointer" />
            </div>
          </Link>
        </th>
      )
    default:
      return (
        <td className="px-6 py-4 text-base font-semibold text-gray-900">
          {typeof item === 'object' && item !== null
            ? item.map((item: { label: string }) => (
                <span className="bg-gray-100 text-gray-800 font-medium me-2 px-2.5 py-0.5 rounded">
                  {item.label}
                </span>
              ))
            : item}
        </td>
      )
  }
}

export default DocumentsTable
