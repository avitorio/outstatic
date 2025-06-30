import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/shadcn/accordion'
import DeleteDocumentButton from '@/components/DeleteDocumentButton'
import DocumentSettingsImageSelection from '@/components/DocumentSettingsImageSelection'
import { Input } from '@/components/ui/shadcn/input'
import { DocumentContext } from '@/context'
import { CustomFieldsType } from '@/types'
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
import { DateTimePickerForm } from '@/components/ui/outstatic/date-time-picker-form'

import { CustomFieldRenderer } from './custom-field-renderer'
import { cn } from '@/utils/ui'

type DocumentSettingsProps = {
  saveDocument: () => void
  loading: boolean
  registerOptions?: RegisterOptions
  showDelete: boolean
  customFields: CustomFieldsType
  setCustomFields: (fields: CustomFieldsType) => void
  metadata: Record<string, any>
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
    control,
    reset
  } = useFormContext()
  const router = useRouter()

  const { document, extension, hasChanges, collection } =
    useContext(DocumentContext)

  const [showAddModal, setShowAddModal] = useState(false)
  const [fieldTitle, setFieldTitle] = useState('')

  const { dashboardRoute, session } = useOutstatic()

  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    reset((prev) => ({
      ...prev,
      status: prev.status || 'draft',
      author: {
        name: prev.author?.name || session?.user?.name,
        picture: prev.author?.picture || session?.user?.image
      }
    }))
  }, [session?.user?.name, session?.user?.image, reset])

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
      <div className="absolute w-full items-center justify-between flex p-4 border-t z-10 bottom-0 bg-background md:hidden">
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
        } md:block w-full border-l bg-background md:w-64 md:flex-none md:flex-col md:flex-wrap md:items-start md:justify-start md:border-b-0 md:border-l py-6 h-full max-h-[calc(100vh-128px)] md:max-h-[calc(100vh-56px)] no-scrollbar overflow-y-scroll`}
      >
        <div className="relative w-full items-center justify-between mb-4 flex px-4">
          <label
            htmlFor="publishedAt"
            className="block text-sm font-medium text-foreground"
          >
            Date
          </label>
          <DateTimePickerForm id="publishedAt" />
        </div>
        <div className="hidden md:flex relative w-full items-center justify-between mb-4 px-4">
          <label
            htmlFor="status"
            className="block text-sm font-medium text-foreground"
          >
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
                <FormMessage />
              </FormItem>
            )}
          />
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
              className="hover:bg-foreground/30 max-h-[2.25rem]"
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
          <Accordion
            type="single"
            collapsible
            className={cn('border-b first:border-t')}
          >
            <AccordionItem value={'author'}>
              <AccordionTrigger className="hover:no-underline hover:bg-muted px-4 rounded-none data-[state=open]:bg-muted">
                Author
              </AccordionTrigger>
              <AccordionContent className="p-4 border-top">
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
                <div className="w-full mt-4 gap-2 flex flex-col">
                  <FormLabel>Avatar</FormLabel>
                  <DocumentSettingsImageSelection
                    id="author.picture"
                    defaultValue={
                      document.author?.picture || session?.user?.image
                    }
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <Accordion
            type="single"
            collapsible
            className={cn(
              'border-b first:border-t',
              errors['slug']?.message && 'border-destructive'
            )}
          >
            <AccordionItem value={'slug'}>
              <AccordionTrigger className="hover:no-underline hover:bg-muted px-4 rounded-none data-[state=open]:bg-muted">
                Slug*
              </AccordionTrigger>
              <AccordionContent className="p-4 border-top">
                <FormField
                  control={control}
                  name="slug"
                  defaultValue={document.slug || ''}
                  render={({ field }) => (
                    <FormItem>
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
                      <FormDescription>The document slug</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {customFields &&
            Object.entries(customFields).map(([name, field]) => (
              <CustomFieldRenderer
                key={name}
                name={name}
                field={field}
                control={control}
                errors={errors}
              />
            ))}

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
