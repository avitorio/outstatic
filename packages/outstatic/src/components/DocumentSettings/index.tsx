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
  CustomFieldsType,
  isArrayCustomField
} from '@/types'
import {
  ArrowDown,
  PanelRight,
  PanelRightClose,
  PlusCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useContext, useEffect, useState } from 'react'
import { RegisterOptions, useFormContext } from 'react-hook-form'
import { slugify } from 'transliteration'
import { CheckboxWithLabel } from '@/components/ui/outstatic/checkbox-with-label'
import { Button } from '@/components/ui/shadcn/button'
import useOutstatic from '@/utils/hooks/useOutstatic'
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage
} from '@/components/ui/shadcn/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/shadcn/select'
import { SpinnerIcon } from '@/components/ui/outstatic/spinner-icon'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/shadcn/tooltip'
import { AddCustomFieldDialog } from '@/client/pages/custom-fields/_components/add-custom-field-dialog'

type DocumentSettingsProps = {
  saveFunc: () => void
  loading: boolean
  registerOptions?: RegisterOptions
  showDelete: boolean
  customFields: CustomFieldsType
  setCustomFields: (fields: CustomFieldsType) => void
  metadata: Record<string, any>
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
  customFields,
  setCustomFields,
  metadata
}: DocumentSettingsProps) => {
  const {
    setValue,
    register,
    formState: { errors },
    control
  } = useFormContext()
  const router = useRouter()

  const { document, extension, editDocument, hasChanges, collection } =
    useContext(DocumentContext)

  const [showAddModal, setShowAddModal] = useState(false)
  const [fieldTitle, setFieldTitle] = useState('')

  const { dashboardRoute } = useOutstatic()

  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!document.status) {
      setValue('status', 'draft')
    }
  }, [document.status])

  const onModalChange = (value: boolean) => {
    if (!value) {
      setFieldTitle('')
    }
    setShowAddModal(value)
  }

  const missingCustomFields = Object.keys(metadata)
    .filter((key) => !customFields.hasOwnProperty(key) && key !== 'date')
    .reduce<Record<string, { title: string }>>((acc, key) => {
      const title = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim()
      acc[key] = { title }
      return acc
    }, {})

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
            {...register('status', registerOptions)}
            control={control}
            name="status"
            defaultValue={document.status}
            render={({ field }) => (
              <FormItem>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
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
              <div className="flex gap-3">
                <SpinnerIcon className="text-background" />
                Saving
              </div>
            ) : (
              'Save'
            )}
          </Button>
        </div>
      </div>
      <aside
        className={`${
          isOpen ? 'block absolute' : 'hidden relative'
        } md:block w-full border-b border-gray-300 bg-white md:w-64 md:flex-none md:flex-col md:flex-wrap md:items-start md:justify-start md:border-b-0 md:border-l pt-6 pb-16 h-full max-h-[calc(100vh-128px)] md:max-h-[calc(100vh-56px)] scrollbar-hide overflow-scroll`}
      >
        <div className="relative w-full items-center justify-between mb-4 flex px-4">
          {document.publishedAt ? (
            <DateTimePicker
              id="publishedAt"
              label="Date"
              date={document.publishedAt}
              setDate={(publishedAt) =>
                editDocument('publishedAt', publishedAt)
              }
            />
          ) : null}
          {document?.date && !document.publishedAt ? (
            <DateTimePicker
              id="date"
              label="Date"
              date={document.date}
              setDate={(date) => editDocument('date', date)}
            />
          ) : null}
        </div>
        <div className="hidden md:flex relative w-full items-center justify-between mb-4 px-4">
          <label
            htmlFor="status"
            className="block text-sm font-medium text-gray-900"
          >
            Status
          </label>

          <div className="min-w-[128px] ">
            <FormField
              {...register('status', registerOptions)}
              control={control}
              name="status"
              defaultValue={document.status}
              render={({ field }) => (
                <FormItem>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
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
                  <FormMessage />
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
              <div className="flex gap-3">
                <SpinnerIcon className="text-background" />
                Saving
              </div>
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

          {missingCustomFields &&
            Object.keys(missingCustomFields).length > 0 && (
              <>
                <div className="w-full flex items-center justify-center py-4 gap-2">
                  <ArrowDown className="h-4 w-4" />
                  <p className="semiblod text-sm">Set up Custom Fields</p>
                </div>
                {Object.entries(missingCustomFields).map(([name, field]) => {
                  return (
                    <div
                      key={name}
                      className="w-full flex items-center justify-between px-4 py-2 gap-2"
                    >
                      <p className="semiblod text-sm truncate">{field.title}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs flex gap-2"
                        onClick={() => {
                          setFieldTitle(field.title)
                          setShowAddModal(true)
                        }}
                      >
                        <PlusCircle className="h-4 w-4" /> Create
                      </Button>
                    </div>
                  )
                })}
              </>
            )}
          <div className="w-full flex items-center justify-center px-4 py-2 gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-xs flex gap-2"
                    onClick={() => setShowAddModal(true)}
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add Custom Field</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        {showAddModal ? (
          <AddCustomFieldDialog
            collection={collection}
            showAddModal={showAddModal}
            setShowAddModal={onModalChange}
            customFields={customFields}
            setCustomFields={setCustomFields}
            fieldTitle={fieldTitle ?? ''}
          />
        ) : null}
      </aside>
    </>
  )
}

export default DocumentSettings
