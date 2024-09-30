import Alert from '@/components/Alert'
import TagInput from '@/components/TagInput'
import { Button } from '@/components/ui/shadcn/button'
import { Input } from '@/components/ui/shadcn/input'
import { CustomFieldType, CustomFieldsType, customFieldTypes } from '@/types'
import { useGetCollectionSchema } from '@/utils/hooks/useGetCollectionSchema'
import useOutstatic from '@/utils/hooks/useOutstatic'
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

type CustomFieldForm = CustomFieldType<
  'string' | 'number' | 'array' | 'boolean'
> & { name: string }

const fieldDataMap = {
  Text: 'string',
  String: 'string',
  Number: 'number',
  Tags: 'array',
  Boolean: 'boolean'
} as const

interface AddCustomFieldDialogProps {
  collection: string
  showAddModal: boolean
  setShowAddModal: (show: boolean) => void
  fieldName: string
  setFieldName: (name: string) => void
  selectedField: string
  setSelectedField: (field: string) => void
  customFields: CustomFieldsType
  setCustomFields: (fields: CustomFieldsType) => void
}

export const AddCustomFieldDialog: React.FC<AddCustomFieldDialogProps> = ({
  collection,
  showAddModal,
  setShowAddModal,
  fieldName,
  setFieldName,
  selectedField,
  setSelectedField,
  customFields,
  setCustomFields
}) => {
  const [adding, setAdding] = useState(false)
  const { setHasChanges } = useOutstatic()
  const [error, setError] = useState('')
  const methods = useForm<CustomFieldForm>({
    mode: 'onChange',
    // @ts-ignore
    resolver: zodResolver(addCustomFieldSchema)
  })

  const { data: schema, isLoading } = useGetCollectionSchema({ collection })

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

    if (!selectedField && customFields[fieldName]) {
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
          // @ts-ignore
          values: data?.values || []
        }
      }

      await capiHelper({
        customFields,
        deleteField: false,
        collection,
        schema,
        fieldName,
        selectedField,
        setCustomFields
      })
    } catch (error) {
      // TODO: Better error treatment
      setError('add')
      console.log({ error })
    }

    onOpenChange(false)
  }

  const onOpenChange = (value: boolean) => {
    if (!value) {
      setHasChanges(false)
      setSelectedField('')
      setFieldName('')
      setAdding(false)
    }
    setShowAddModal(value)
  }

  return (
    <Dialog open={showAddModal} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {selectedField
              ? `Edit ${customFields[selectedField].title}`
              : `Add Custom Field to ${capitalCase(collection)}`}
          </DialogTitle>
        </DialogHeader>
        <FormProvider {...methods}>
          <form
            onSubmit={methods.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            {!!selectedField ? (
              <div className="pt-6">
                <Alert type="info">
                  <>
                    <span className="font-medium">Field name</span> and{' '}
                    <span className="font-medium">Field type</span> editing is
                    disabled to avoid data conflicts.
                  </>
                </Alert>
              </div>
            ) : null}
            <div
              key={selectedField}
              className={`flex pt-6 gap-4 ${
                !!selectedField
                  ? 'pt-0 opacity-50 cursor-not-allowed pointer-events-none hidden'
                  : ''
              }`}
            >
              <FormField
                control={methods.control}
                name="title"
                defaultValue={
                  selectedField ? customFields[selectedField].title : ''
                }
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Category"
                        {...field}
                        className="w-full max-w-sm md:w-80"
                        readOnly={!!selectedField}
                        autoFocus={!selectedField}
                        onChange={(e) => {
                          field.onChange(e)
                          setFieldName(camelCase(e.target.value))
                        }}
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
                  defaultValue={
                    selectedField
                      ? customFields[selectedField].fieldType
                      : 'String'
                  }
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Field type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={
                          selectedField
                            ? customFields[selectedField].fieldType
                            : 'String'
                        }
                      >
                        <FormControl>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select field type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customFieldTypes.map((type) => (
                            <SelectItem
                              key={type}
                              value={type}
                              disabled={!!selectedField}
                            >
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
                        defaultValue={
                          selectedField
                            ? customFields[selectedField].description
                            : ''
                        }
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
                      defaultChecked={
                        selectedField
                          ? customFields[selectedField].required
                          : false
                      }
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
            {selectedField &&
            customFields[selectedField].fieldType === 'Tags' &&
            customFields[selectedField].dataType === 'array' ? (
              <div className="flex gap-4 mb-4">
                <TagInput
                  label="Your tags"
                  id="values"
                  helperText="Deleting tags will remove them from suggestions, not from existing documents."
                  //@ts-ignore
                  defaultValue={customFields[selectedField].values || []}
                  noOptionsMessage={() => null}
                  isClearable={false}
                  isSearchable={false}
                  components={{
                    DropdownIndicator: () => null,
                    IndicatorSeparator: () => null
                  }}
                />
              </div>
            ) : null}

            <DialogFooter className="flex sm:justify-between items-center pt-6 border-t">
              <div className="text-sm text-gray-700">
                This field will be accessible on the frontend as:{'  '}
                <code className="bg-gray-200 font-semibold">
                  {selectedField ? selectedField : fieldName}
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
                      {selectedField ? 'Editing' : 'Adding'}
                    </>
                  ) : selectedField ? (
                    'Edit'
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
