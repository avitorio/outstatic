import Accordion from '@/components/Accordion'
import DeleteDocumentButton from '@/components/DeleteDocumentButton'
import DocumentSettingsImageSelection from '@/components/DocumentSettingsImageSelection'
import TagInput from '@/components/TagInput'
import { Input } from '@/components/ui/shadcn/input'
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
import { useOutstatic } from '@/utils/hooks/useOutstatic'
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
  FormLabel,
  FormDescription
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
import { DateTimePickerForm } from '../ui/shadcn/date-time-picker-form'

type DocumentSettingsProps = {
  saveDocument: () => void
  loading: boolean
  registerOptions?: RegisterOptions
  showDelete: boolean
  customFields: CustomFieldsType
  setCustomFields: (fields: CustomFieldsType) => void
  metadata: Record<string, any>
}

interface CustomInputProps {
  type?: 'text' | 'number' | 'checkbox' | 'date' | 'image'
  suggestions?: CustomFieldArrayValue[]
  registerOptions?: RegisterOptions
}

type ComponentType = {
  component:
    | typeof Input
    | typeof TextArea
    | typeof TagInput
    | typeof CheckboxWithLabel
    | typeof DateTimePickerForm
    | typeof DocumentSettingsImageSelection
  props: CustomInputProps
}

type FieldDataMapType = {
  String: ComponentType
  Text: ComponentType
  Number: ComponentType
  Tags: ComponentType
  Boolean: ComponentType
  Date: ComponentType
  Image: ComponentType
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
  Boolean: { component: CheckboxWithLabel, props: { type: 'checkbox' } },
  Date: { component: DateTimePickerForm, props: { type: 'date' } },
  Image: { component: DocumentSettingsImageSelection, props: { type: 'image' } }
}

const DocumentSettings = ({
  saveDocument,
  loading,
  showDelete,
  customFields,
  setCustomFields,
  metadata
}: DocumentSettingsProps) => {
  const {
    setValue,
    formState: { errors },
    control
  } = useFormContext()
  const router = useRouter()

  const { document, extension, hasChanges, collection } =
    useContext(DocumentContext)

  const [showAddModal, setShowAddModal] = useState(false)
  const [fieldTitle, setFieldTitle] = useState('')

  const { dashboardRoute, session } = useOutstatic()

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

  const defaultMetadata = ['title', 'status', 'author', 'slug', 'publishedAt']

  const missingCustomFields = Object.keys(metadata)
    .filter(
      (key) =>
        !customFields.hasOwnProperty(key) && !defaultMetadata.includes(key)
    )
    .reduce<Record<string, { title: string }>>((acc, key) => {
      const title = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim()
      acc[key] = { title }
      return acc
    }, {})

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        saveDocument()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [saveDocument])

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
            defaultValue={document.status}
            render={({ field }) => (
              <FormItem>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value ?? 'draft'}
                  value={field.value ?? 'draft'}
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
          <Button onClick={saveDocument} disabled={loading || !hasChanges}>
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
          <label
            htmlFor="publishedAt"
            className="block text-sm font-medium text-gray-900"
          >
            Date
          </label>
          <DateTimePickerForm id="publishedAt" />
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
              control={control}
              name="status"
              defaultValue={document.status}
              render={({ field }) => (
                <FormItem>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value ?? 'draft'}
                    value={field.value ?? 'draft'}
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
          <Button onClick={saveDocument} disabled={loading || !hasChanges}>
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
            <div className="flex flex-col gap-2">
              <FormField
                control={control}
                name="author.name"
                defaultValue={document.author?.name || session?.user?.name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="w-full mt-2 gap-2 flex flex-col">
                <FormLabel>Avatar</FormLabel>
                <DocumentSettingsImageSelection
                  label="Add an avatar"
                  id="author.picture"
                  defaultValue={
                    document.author?.picture || session?.user?.image
                  }
                />
              </div>
            </div>
          </Accordion>
          <Accordion title="URL Slug*" error={!!errors['slug']?.message}>
            <FormField
              control={control}
              name="slug"
              defaultValue={document.slug || ''}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Write a slug</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => {
                        const lastChar = e.target.value.slice(-1)
                        field.onChange(
                          lastChar === ' ' || lastChar === '-'
                            ? e.target.value
                            : slugify(e.target.value, {
                                allowedChars: 'a-zA-Z0-9.'
                              })
                        )
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Accordion>

          {customFields &&
            Object.entries(customFields).map(([name, field]) => {
              const Field = FieldDataMap[field.fieldType]
              if (isArrayCustomField(field)) {
                Field.props.suggestions = field.values
              }

              if (field.fieldType === 'String') {
                return (
                  <Accordion
                    key={name}
                    title={`${field.title}${field.required ? '*' : ''}`}
                    error={!!errors[name]?.message}
                  >
                    <FormField
                      control={control}
                      name={name}
                      render={({ field: formField }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              {...formField}
                              value={formField.value ?? ''}
                            />
                          </FormControl>
                          <FormDescription>{field.description}</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </Accordion>
                )
              }

              if (field.fieldType === 'Number') {
                // Fix for NaN error when saving a non-required number
                if (!field.required) {
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
                    <FormField
                      control={control}
                      name={name}
                      render={({ field: formField }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              {...formField}
                              type="number"
                              value={formField.value ?? ''}
                              onChange={(e) => {
                                if (e.target.value === '')
                                  return formField.onChange(undefined)
                                formField.onChange(Number(e.target.value))
                              }}
                            />
                          </FormControl>
                          <FormDescription>{field.description}</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </Accordion>
                )
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
