import Link from 'next/link'
import { useState } from 'react'
import { Document } from '../../types'
import DeleteDocumentButton from '../DeleteDocumentButton'
import Select from 'react-select'
import { Settings } from 'lucide-react'

type DocumentsTableProps = {
  documents: Document[]
  collection: string
}
const options = {
  year: 'numeric' as const,
  month: 'long' as const,
  day: 'numeric' as const
}

type Column = {
  label: string
  value: string
}

const defaultColumns: Column[] = [
  { label: 'TITLE', value: 'title' },
  { label: 'STATUS', value: 'status' },
  { label: 'DATE', value: 'publishedAt' }
  //{ label: 'DESCRIPTION', value: 'description' },
  // { label: 'AUTHOR', value: 'author' },
]

const DocumentsTable = (props: DocumentsTableProps) => {
  const [documents, setDocuments] = useState(props.documents)
  const [columns, setColumns] = useState<Column[]>(defaultColumns)
  const [showColumnOptions, setShowColumnOptions] = useState(false)

  return (
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
      {showColumnOptions && (
        <div className={`absolute top-0 w-[95%]`}>
          <Select
            isMulti
            defaultValue={columns}
            value={columns}
            options={defaultColumns}
            onChange={(e: any) => setColumns(e)}
          />
        </div>
      )}
    </table>
  )
}

const cellSwitch = (
  columnValue: string,
  document: Document,
  collection: string
) => {
  switch (columnValue) {
    case 'title':
      return (
        <th
          scope="row"
          className="relative whitespace-nowrap px-6 py-4 text-base font-semibold text-gray-900 group"
        >
          <Link href={`/outstatic/${collection}/${document.slug}`}>
            <div className="group-hover:text-blue-500">
              {document[columnValue]}
              <div className="absolute top-0 bottom-0 left-0 right-40 cursor-pointer" />
            </div>
          </Link>
        </th>
      )
    case 'publishedAt':
      return (
        <td className="px-6 py-4 text-base font-semibold text-gray-900">
          {document[columnValue].toLocaleDateString('en-US', options)}
        </td>
      )
    default:
      return (
        <td className="px-6 py-4 text-base font-semibold capitalize text-gray-900">
          {document[columnValue]}
        </td>
      )
  }
}

export default DocumentsTable
