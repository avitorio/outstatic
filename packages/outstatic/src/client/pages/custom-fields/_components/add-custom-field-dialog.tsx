import { Button } from '@/components/ui/shadcn/button'
import { Input } from '@/components/ui/shadcn/input'
import {
  CustomFieldArrayValue,
  CustomFieldType,
  CustomFieldsType,
  Document,
  customFieldTypes
} from '@/types'
import { useGetCollectionSchema } from '@/utils/hooks/useGetCollectionSchema'
import { useOutstatic } from '@/utils/hooks/useOutstatic'
import { camelCase, capitalCase } from 'change-case'
import { useEffect, useState } from 'react'
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/shadcn/select'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage
} from '@/components/ui/shadcn/form'
import { SpinnerIcon } from '@/components/ui/outstatic/spinner-icon'
import { useCustomFieldCommit } from './use-custom-field-commit'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/shadcn/dialog'
import { zodResolver } from '@hookform/resolvers/zod'
import { addCustomFieldSchema } from '@/utils/schemas/add-custom-field-schema'
import { DEFAULT_FIELDS } from '@/utils/constants'
type CustomFieldForm = CustomFieldType<
  'string' | 'number' | 'array' | 'boolean' | 'date' | 'image'
> & { name: string; values?: CustomFieldArrayValue[] }

const fieldDataMap = {
  Text: 'string',
  String: 'string',
  Number: 'number',
  Tags: 'array',
  Boolean: 'boolean',
  Date: 'date',
  Image: 'image'
} as const

interface AddCustomFieldDialogProps {
  collection: string
  showAddModal: boolean
  setShowAddModal: (show: boolean) => void
  customFields: CustomFieldsType
  setCustomFields: (fields: CustomFieldsType) => void
  fieldTitle?: string
}

export const AddCustomFieldDialog: React.FC<AddCustomFieldDialogProps> = ({
  collection,
  showAddModal,
  setShowAddModal,
  customFields,
  setCustomFields,
  fieldTitle
}) => {
  const [adding, setAdding] = useState(false)
  const { setHasChanges } = useOutstatic()
  const [error, setError] = useState('')
  const [fieldName, setFieldName] = useState(fieldTitle ?? '')
  const methods = useForm<CustomFieldForm>({
    mode: 'onChange',
    resolver: zodResolver(addCustomFieldSchema)
  })

  const { data: schema } = useGetCollectionSchema({ collection })

  const capiHelper = useCustomFieldCommit()

  useEffect(() => {
    if (schema) {
      setCustomFields(schema.properties)
    }
  }, [schema])

  const onSubmit: SubmitHandler<CustomFieldForm> = async (
    data: CustomFieldForm
  ) => {
    setAdding(true)
    const { title, fieldType, ...rest } = data
    const fieldName = camelCase(title)

    if (DEFAULT_FIELDS.includes(fieldName as keyof Document)) {
      methods.setError('title', {
        type: 'manual',
        message: 'This field name is reserved and cannot be used.'
      })
      setAdding(false)
      return
    }

    if (customFields[fieldName]) {
      methods.setError('title', {
        type: 'manual',
        message: 'Field name is already taken.'
      })
      setAdding(false)
      return
    }

    try {
      customFields[fieldName] = {
        ...rest,
        fieldType,
        dataType: fieldDataMap[fieldType],
        title: data.title
      }

      if (fieldDataMap[fieldType] === 'array') {
        customFields[fieldName] = {
          ...customFields[fieldName],
          values: data?.values || []
        }
      }

      await capiHelper({
        customFields,
        deleteField: false,
        collection,
        fieldName,
        selectedField: ''
      })
    } catch (error) {
      setError('add')
      console.log({ error })
    }

    onOpenChange(false)
  }

  const onOpenChange = (value: boolean) => {
    if (!value) {
      setHasChanges(false)
      setFieldName('')
      setAdding(false)
      methods.reset()
    }
    setShowAddModal(value)
  }

  return (
    <Dialog open={showAddModal} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Add Custom Field to {capitalCase(collection)}
          </DialogTitle>
        </DialogHeader>
        <FormProvider {...methods}>
          <form
            onSubmit={methods.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <div className="flex pt-6 gap-4">
              <FormField
                control={methods.control}
                name="title"
                defaultValue={fieldTitle ?? ''}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Category"
                        {...field}
                        className="w-full max-w-sm md:w-80"
                        autoFocus
                        onChange={(e) => {
                          field.onChange(e)
                          setFieldName(camelCase(e.target.value))
                        }}
                        disabled={!!fieldTitle}
                      />
                    </FormControl>
                    <FormDescription>The name of the field</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="mb-5">
                <FormField
                  control={methods.control}
                  name="fieldType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Field type</FormLabel>
                      <Select onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select field type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customFieldTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex gap-4 mb-4">
              <FormField
                control={methods.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Add a category"
                        {...field}
                        className="w-full max-w-sm md:w-80"
                      />
                    </FormControl>
                    <FormDescription>
                      This will be the label of the field
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <fieldset>
                <div className="flex mt-7">
                  <div className="flex items-center h-5">
                    <input
                      {...methods.register('required')}
                      id="required"
                      type="checkbox"
                      className="cursor-pointer w-4 h-4 text-blue-600 bg-gray-100 rounded border-gray-300 focus:ring-blue-500 focus:ring-2"
                    />
                  </div>
                  <div className="ml-2 text-sm">
                    <label
                      htmlFor="required"
                      className="cursor-pointer text-sm font-medium text-gray-900"
                    >
                      Required field
                    </label>
                    <FormDescription>
                      This field must be filled out to save the document
                    </FormDescription>
                  </div>
                </div>
              </fieldset>
            </div>

            <DialogFooter className="flex sm:justify-between items-center pt-6 border-t">
              <div className="text-sm text-gray-700">
                This field will be accessible on the frontend as:{' '}
                <code className="bg-gray-200 font-semibold">
                  {camelCase(fieldName)}
                </code>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={adding}>
                  {adding ? (
                    <>
                      <SpinnerIcon className="text-background mr-2" />
                      Adding
                    </>
                  ) : (
                    'Add'
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  )
}
