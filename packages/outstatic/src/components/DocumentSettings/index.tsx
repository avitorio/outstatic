import { useRouter } from 'next/navigation'
import { useContext } from 'react'
import { RegisterOptions, useFormContext } from 'react-hook-form'
import { convert } from 'url-slug'
import { DocumentContext } from '../../context'
import Accordion from '../Accordion'
import DateTimePicker from '../DateTimePicker'
import DeleteDocumentButton from '../DeleteDocumentButton'
import Input from '../Input'
import TextArea from '../TextArea'
import TagInput from '../TagInput'
import DocumentSettingsImageSelection from '../DocumentSettingsImageSelection'
import {
  CustomFieldArrayValue,
  CustomFields,
  isArrayCustomField
} from '../../types'

type DocumentSettingsProps = {
  saveFunc: () => void
  loading: boolean
  registerOptions?: RegisterOptions
  showDelete: boolean
  customFields?: CustomFields
}

interface InputProps {
  type?: 'text' | 'number'
  suggestions?: CustomFieldArrayValue[]
}

type ComponentType = {
  component: typeof Input | typeof TextArea | typeof TagInput
  props: InputProps
}

type FieldDataMapType = {
  String: ComponentType
  Text: ComponentType
  Number: ComponentType
  Tags: ComponentType
}

const FieldDataMap: FieldDataMapType = {
  String: { component: Input, props: { type: 'text' } },
  Text: { component: TextArea, props: {} },
  Number: { component: Input, props: { type: 'number' } },
  Tags: {
    component: TagInput,
    props: {
      suggestions: []
    }
  }
}

const DocumentSettings = ({
  saveFunc,
  loading,
  registerOptions,
  showDelete,
  customFields = {}
}: DocumentSettingsProps) => {
  const {
    register,
    formState: { errors }
  } = useFormContext()
  const router = useRouter()
  const { document, editDocument, hasChanges, collection } =
    useContext(DocumentContext)

  return (
    <aside className="relative w-full border-b border-gray-300 bg-white md:w-64 md:flex-none md:flex-col md:flex-wrap md:items-start md:justify-start md:border-b-0 md:border-l md:py-6 max-h-[calc(100vh-53px)] scrollbar-hide overflow-scroll">
      <div className="relative hidden w-full items-center justify-between md:mb-4 md:flex px-4">
        <DateTimePicker
          id="publishedAt"
          label="Date"
          date={document.publishedAt}
          setDate={(publishedAt) => editDocument('publishedAt', publishedAt)}
        />
      </div>
      <div className="relative hidden w-full items-center justify-between md:mb-4 md:flex px-4">
        <label
          htmlFor="status"
          className="block text-sm font-medium text-gray-900"
        >
          Status
        </label>
        <select
          {...register('status', registerOptions)}
          name="status"
          id="status"
          defaultValue={document.status}
          className="block cursor-pointer appearance-none rounded-lg border border-gray-300 bg-gray-50 p-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>
      <div
        className={`flex w-full pb-4 px-4 ${
          showDelete ? 'justify-between items-center' : 'justify-end'
        }`}
      >
        {showDelete && (
          <DeleteDocumentButton
            disabled={loading}
            slug={document.slug}
            onComplete={() => {
              router.push(`/outstatic/${collection}`)
            }}
            collection={collection}
            className="hover:bg-slate-200 max-h-[2.25rem]"
          />
        )}

        <button
          onClick={saveFunc}
          type="button"
          disabled={loading || !hasChanges}
          className="flex rounded-lg border border-gray-600 bg-gray-800 px-5 py-2.5 text-sm font-medium text-white hover:border-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-700 disabled:cursor-not-allowed disabled:bg-gray-600"
        >
          {loading ? (
            <>
              <svg
                className="mr-3 -ml-1 h-5 w-5 animate-spin text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Saving
            </>
          ) : (
            'Save'
          )}
        </button>
      </div>
      <div className="w-full">
        <Accordion title="Author">
          <Input
            label="Name"
            name="author.name"
            id="author.name"
            defaultValue={document.author?.name}
            inputSize="small"
            wrapperClass="mb-4"
          />
          <DocumentSettingsImageSelection
            label="Add an avatar"
            name="author.picture"
            description="Author Avatar"
          />
        </Accordion>
        <Accordion title="URL Slug">
          <Input
            label="Write a slug (optional)"
            name="slug"
            id="slug"
            defaultValue={document.slug}
            inputSize="small"
            registerOptions={{
              onChange: (e) => {
                const lastChar = e.target.value.slice(-1)
                editDocument(
                  'slug',
                  lastChar === ' ' || lastChar === '-'
                    ? e.target.value
                    : convert(e.target.value, { dictionary: { "'": '' } })
                )
              }
            }}
          />
        </Accordion>
        <Accordion title="Description">
          <TextArea
            name="description"
            type="textarea"
            label="Write a description (optional)"
            id="description"
            rows={5}
            className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-blue-500"
          />
        </Accordion>

        <Accordion title="Cover Image">
          <DocumentSettingsImageSelection
            name="coverImage"
            description="Cover Image"
          />
        </Accordion>
        {customFields &&
          Object.entries(customFields).map(([name, field]) => {
            const Field = FieldDataMap[field.fieldType]
            if (isArrayCustomField(field)) {
              Field.props.suggestions = field.values
            }
            return (
              <Accordion
                key={name}
                title={`${field.title}${field.required ? '*' : ''}`}
                error={!!errors[name]?.message}
              >
                <Field.component
                  id={name}
                  label={field.description}
                  {...Field.props}
                />
              </Accordion>
            )
          })}
      </div>
      <hr className="pb-16" />
    </aside>
  )
}

export default DocumentSettings
