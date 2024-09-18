import Accordion from '@/components/Accordion'
import DateTimePicker from '@/components/DateTimePicker'
import DeleteDocumentButton from '@/components/DeleteDocumentButton'
import DocumentSettingsImageSelection from '@/components/DocumentSettingsImageSelection'
import TagInput from '@/components/TagInput'
import Input from '@/components/ui/outstatic/input'
import TextArea from '@/components/ui/shadcn/text-area'
import { DocumentContext } from '@/context'
import {
  CustomFieldArrayValue,
  CustomFields,
  isArrayCustomField
} from '@/types'
import { PanelRight, PanelRightClose } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useContext, useState } from 'react'
import { RegisterOptions, useFormContext } from 'react-hook-form'
import { slugify } from 'transliteration'
import { CheckboxWithLabel } from '@/components/ui/outstatic/checkbox-with-label'
import { Button } from '@/components/ui/shadcn/button'
import useOutstatic from '@/utils/hooks/useOutstatic'
import { FormField, FormItem, FormControl } from '@/components/ui/shadcn/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/shadcn/select'

type DocumentSettingsProps = {
  saveFunc: () => void
  loading: boolean
  registerOptions?: RegisterOptions
  showDelete: boolean
  customFields?: CustomFields
}

interface CustomInputProps {
  type?: 'text' | 'number' | 'checkbox'
  suggestions?: CustomFieldArrayValue[]
  registerOptions?: RegisterOptions
}

type ComponentType = {
  component:
    | typeof Input
    | typeof TextArea
    | typeof TagInput
    | typeof CheckboxWithLabel
  props: CustomInputProps
}

type FieldDataMapType = {
  String: ComponentType
  Text: ComponentType
  Number: ComponentType
  Tags: ComponentType
  Boolean: ComponentType
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
  },
  Boolean: { component: CheckboxWithLabel, props: { type: 'checkbox' } }
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
    formState: { errors },
    control
  } = useFormContext()
  const router = useRouter()

  const { document, extension, editDocument, hasChanges, collection } =
    useContext(DocumentContext)

  const { dashboardRoute } = useOutstatic()

  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <div className="absolute w-full items-center justify-between flex p-4 border-t z-10 bottom-0 bg-white md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className={`stroke-foreground ${isOpen ? 'bg-accent' : ''}`}
        >
          {isOpen ? <PanelRightClose /> : <PanelRight />}
        </Button>
        <div className="flex flex-end w-full items-center justify-end gap-4">
          <label htmlFor="status" className="sr-only">
            Status
          </label>
          <FormField
            control={control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <Button onClick={saveFunc} disabled={loading || !hasChanges}>
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
          </Button>
        </div>
      </div>
      <aside
        className={`${
          isOpen ? 'block absolute' : 'hidden relative'
        } md:block w-full border-b border-gray-300 bg-white md:w-64 md:flex-none md:flex-col md:flex-wrap md:items-start md:justify-start md:border-b-0 md:border-l pt-6 pb-16 h-full max-h-[calc(100vh-128px)] md:max-h-[calc(100vh-53px)] scrollbar-hide overflow-scroll`}
      >
        <div className="relative w-full items-center justify-between mb-4 flex px-4">
          <DateTimePicker
            id="publishedAt"
            label="Date"
            date={document.publishedAt}
            setDate={(publishedAt) => editDocument('publishedAt', publishedAt)}
          />
        </div>
        <div className="hidden md:flex relative w-full items-center justify-between mb-4 px-4">
          <label
            htmlFor="status"
            className="block text-sm font-medium text-gray-900"
          >
            Status
          </label>

          <div className="min-w-[128px]">
            <FormField
              control={control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>
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
              extension={extension}
              onComplete={() => {
                router.push(`${dashboardRoute}/${collection}`)
              }}
              collection={collection}
              className="hover:bg-slate-200 max-h-[2.25rem]"
            />
          )}
          <Button onClick={saveFunc} disabled={loading || !hasChanges}>
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
          </Button>
        </div>
        <div className="w-full">
          <Accordion title="Author">
            <Input
              label="Name"
              name="author.name"
              id="author.name"
              defaultValue={document.author?.name ?? ''}
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
                      : slugify(e.target.value, { allowedChars: 'a-zA-Z0-9' })
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

              // Fix for NaN error when saving a non-required number
              if (field.fieldType === 'Number' && !field.required) {
                Field.props = {
                  ...Field.props,
                  registerOptions: {
                    setValueAs: (value: any) =>
                      isNaN(value) ? undefined : Number(value)
                  }
                }
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
      </aside>
    </>
  )
}

export default DocumentSettings
