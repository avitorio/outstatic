import { Alert, AlertTitle } from '@/components/ui/shadcn/alert'
import { TagInput } from '@/components/ui/outstatic/tag-input'
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
import { Checkbox } from '@/components/ui/shadcn/checkbox'
import { InfoCircledIcon } from '@radix-ui/react-icons'

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

  const { data: schema } = useGetCollectionSchema({ collection })

  const capiHelper = useCustomFieldCommit()

  useEffect(() => {
    if (schema) {
      setCustomFields(schema.properties)
      if (isArrayCustomField(customFields[selectedField])) {
        methods.setValue('values', customFields[selectedField].values)
      }
    }
  }, [schema, setCustomFields])

  const onSubmit: SubmitHandler<CustomFieldForm> = async (
    data: CustomFieldForm
  ) => {
    setEditing(true)
    const { title, ...rest } = data

    try {
      // eslint-disable-next-line react-hooks/immutability
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
      <DialogContent className="w-full md:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit {customFields[selectedField].title}</DialogTitle>
        </DialogHeader>
        <FormProvider {...methods}>
          <form
            onSubmit={methods.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <div>
              <Alert variant="default">
                <InfoCircledIcon />
                <AlertTitle>
                  Field name and field type editing are disabled to avoid data
                  conflicts.
                </AlertTitle>
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
                        disabled
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

              <FormField
                control={methods.control}
                defaultValue={
                  customFields[selectedField].required
                    ? customFields[selectedField].required
                    : false
                }
                name="required"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex flex-col gap-2">
                      <FormLabel>Required</FormLabel>
                      <div className="flex items-center gap-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange(true)
                                : field.onChange(false)
                            }}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          Set this custom field as required
                        </FormLabel>
                      </div>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            </div>
            {customFields[selectedField].fieldType === 'Tags' &&
            customFields[selectedField].dataType === 'array' &&
            isArrayCustomField(customFields[selectedField]) ? (
              <div className="flex gap-4 mb-4">
                <TagInput
                  label="Your tags"
                  id="values"
                  description="Deleting tags will remove them from suggestions, not from existing documents."
                  suggestions={customFields[selectedField].values}
                />
              </div>
            ) : null}

            <DialogFooter className="flex sm:justify-between items-center pt-6 border-t">
              <div className="text-sm">
                This field will be accessible on the frontend as:{' '}
                <code className="bg-muted font-semibold">{selectedField}</code>
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
