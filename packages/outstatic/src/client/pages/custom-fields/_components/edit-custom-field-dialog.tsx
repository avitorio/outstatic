import Alert from '@/components/Alert'
import TagInput from '@/components/TagInput'
import { Button } from '@/components/ui/shadcn/button'
import { Input } from '@/components/ui/shadcn/input'
import {
  CustomFieldArrayValue,
  CustomFieldType,
  CustomFieldsType,
  customFieldTypes,
  isArrayCustomField
} from '@/types'
import { useGetCollectionSchema } from '@/utils/hooks/useGetCollectionSchema'
import { useOutstatic } from '@/utils/hooks/useOutstatic'
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
import { editCustomFieldSchema } from '@/utils/schemas/edit-custom-field-schema'

type CustomFieldForm = CustomFieldType<
  'string' | 'number' | 'array' | 'boolean'
> & { name: string; values?: CustomFieldArrayValue[] }

interface EditCustomFieldDialogProps {
  collection: string
  showEditModal: boolean
  setShowEditModal: (show: boolean) => void
  selectedField: string
  customFields: CustomFieldsType
  setCustomFields: (fields: CustomFieldsType) => void
}

export const EditCustomFieldDialog: React.FC<EditCustomFieldDialogProps> = ({
  collection,
  showEditModal,
  setShowEditModal,
  selectedField,
  customFields,
  setCustomFields
}) => {
  const [editing, setEditing] = useState(false)
  const { setHasChanges } = useOutstatic()
  const [error, setError] = useState('')
  const methods = useForm<CustomFieldForm>({
    mode: 'onChange',
    resolver: zodResolver(editCustomFieldSchema) as any
  })

  const { data: schema, isLoading } = useGetCollectionSchema({ collection })

  const capiHelper = useCustomFieldCommit()

  useEffect(() => {
    if (schema) {
      setCustomFields(schema.properties)
    }
  }, [schema, setCustomFields])

  const onSubmit: SubmitHandler<CustomFieldForm> = async (
    data: CustomFieldForm
  ) => {
    setEditing(true)
    const { title, ...rest } = data

    try {
      customFields[selectedField] = {
        ...customFields[selectedField],
        ...rest,
        title: data.title
      }

      if (isArrayCustomField(customFields[selectedField])) {
        customFields[selectedField] = {
          ...customFields[selectedField],
          values: data.values || []
        }
      }

      await capiHelper({
        customFields,
        deleteField: false,
        collection,
        fieldName: selectedField,
        selectedField
      })
    } catch (error) {
      setError('edit')
      console.log({ error })
    }

    onOpenChange(false)
  }

  const onOpenChange = (value: boolean) => {
    if (!value) {
      setHasChanges(false)
      setEditing(false)
    }
    setShowEditModal(value)
  }

  return (
    <Dialog open={showEditModal} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit {customFields[selectedField].title}</DialogTitle>
        </DialogHeader>
        <FormProvider {...methods}>
          <form
            onSubmit={methods.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <div className="pt-6">
              <Alert type="info">
                <>
                  <span className="font-medium">Field name</span> and{' '}
                  <span className="font-medium">Field type</span> editing is
                  disabled to avoid data conflicts.
                </>
              </Alert>
            </div>
            <div className="flex gap-4 mb-4">
              <FormField
                control={methods.control}
                name="title"
                defaultValue={customFields[selectedField].title}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="w-full max-w-sm md:w-80"
                        readOnly
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
                  defaultValue={customFields[selectedField].fieldType}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Field type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={customFields[selectedField].fieldType}
                        disabled
                      >
                        <FormControl>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue />
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
                defaultValue={customFields[selectedField].description}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input {...field} className="w-full max-w-sm md:w-80" />
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
                      defaultChecked={customFields[selectedField].required}
                    />
                  </div>
                  <div className="ml-2 text-sm">
                    <label
                      htmlFor="required"
                      className="cursor-pointer text-sm font-medium text-foreground"
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
            {customFields[selectedField].fieldType === 'Tags' &&
            customFields[selectedField].dataType === 'array' &&
            isArrayCustomField(customFields[selectedField]) ? (
              <div className="flex gap-4 mb-4">
                <TagInput
                  label="Your tags"
                  id="values"
                  helperText="Deleting tags will remove them from suggestions, not from existing documents."
                  defaultValue={customFields[selectedField].values}
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
                This field will be accessible on the frontend as:{' '}
                <code className="bg-gray-200 font-semibold">
                  {selectedField}
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
                <Button type="submit" disabled={editing}>
                  {editing ? (
                    <>
                      <SpinnerIcon className="text-background mr-2" />
                      Editing
                    </>
                  ) : (
                    'Save Changes'
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
