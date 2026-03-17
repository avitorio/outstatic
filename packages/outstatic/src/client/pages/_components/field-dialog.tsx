import { zodResolver } from '@hookform/resolvers/zod'
import { InfoCircledIcon } from '@radix-ui/react-icons'
import { camelCase } from 'change-case'
import { useEffect, useState } from 'react'
import { FormProvider, SubmitHandler, useForm, useWatch } from 'react-hook-form'
import {
  CustomFieldArrayValue,
  CustomFieldsType,
  Document,
  createCustomFieldDefinition,
  customFieldTypes,
  isFieldWithValues
} from '@/types'
import { SpinnerIcon } from '@/components/ui/outstatic/spinner-icon'
import {
  TagInput,
  preventTagInputEnterSubmit
} from '@/components/ui/outstatic/tag-input'
import { Button } from '@/components/ui/shadcn/button'
import { Checkbox } from '@/components/ui/shadcn/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/shadcn/dialog'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/shadcn/form'
import { Input } from '@/components/ui/shadcn/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/shadcn/select'
import { Alert, AlertTitle } from '@/components/ui/shadcn/alert'
import { DEFAULT_FIELDS } from '@/utils/constants'
import { FieldSchemaTarget } from '@/utils/hooks/field-schema'
import { useFieldSchemaCommit } from '@/utils/hooks/use-field-schema-commit'
import { editCustomFieldSchema } from '@/utils/schemas/edit-custom-field-schema'
import { addCustomFieldSchema } from '@/utils/schemas/add-custom-field-schema'
import { useOutstatic } from '@/utils/hooks/use-outstatic'

type CustomFieldForm = {
  title: string
  fieldType: (typeof customFieldTypes)[number]
  description?: string
  required?: boolean
  values?: CustomFieldArrayValue[]
}

type FieldDialogProps = {
  mode: 'add' | 'edit'
  open: boolean
  onOpenChange: (open: boolean) => void
  target: FieldSchemaTarget
  customFields: CustomFieldsType
  setCustomFields: (fields: CustomFieldsType) => void
  fieldTitle?: string
  selectedField?: string
}

const SaveFirstModal = ({
  open,
  onOpenChange
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save your singleton first</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          You need to save your singleton first before adding custom fields.
        </DialogDescription>
      </DialogContent>
    </Dialog>
  )
}

const getDefaultValues = ({
  mode,
  fieldTitle,
  selectedFieldDefinition
}: {
  mode: 'add' | 'edit'
  fieldTitle?: string
  selectedFieldDefinition?: CustomFieldsType[string]
}): Partial<CustomFieldForm> => {
  if (mode === 'edit' && selectedFieldDefinition) {
    return {
      title: selectedFieldDefinition.title,
      fieldType: selectedFieldDefinition.fieldType,
      description: selectedFieldDefinition.description ?? '',
      required: selectedFieldDefinition.required ?? false,
      values: isFieldWithValues(selectedFieldDefinition)
        ? selectedFieldDefinition.values
        : undefined
    }
  }

  return {
    title: fieldTitle ?? '',
    description: '',
    required: false
  }
}

export const FieldDialog = ({
  mode,
  open,
  onOpenChange,
  target,
  customFields,
  setCustomFields,
  fieldTitle,
  selectedField = ''
}: FieldDialogProps) => {
  const { setHasChanges } = useOutstatic()
  const [submitting, setSubmitting] = useState(false)
  const commitFieldSchema = useFieldSchemaCommit(target)
  const selectedFieldDefinition =
    mode === 'edit' ? customFields[selectedField] : undefined
  const methods = useForm<CustomFieldForm>({
    mode: 'onChange',
    resolver: zodResolver(
      mode === 'add' ? addCustomFieldSchema : editCustomFieldSchema
    ) as any,
    defaultValues: getDefaultValues({
      mode,
      fieldTitle,
      selectedFieldDefinition
    })
  })

  const selectedFieldType = useWatch({
    control: methods.control,
    name: 'fieldType'
  })
  const watchedTitle = useWatch({
    control: methods.control,
    name: 'title'
  })

  useEffect(() => {
    methods.reset(
      getDefaultValues({
        mode,
        fieldTitle,
        selectedFieldDefinition
      })
    )
  }, [fieldTitle, methods, mode, open, selectedFieldDefinition])

  const handleDialogChange = (value: boolean) => {
    if (!value) {
      setHasChanges(false)
      setSubmitting(false)
      methods.reset(
        getDefaultValues({
          mode,
          fieldTitle,
          selectedFieldDefinition
        })
      )
    }

    onOpenChange(value)
  }

  const onSubmit: SubmitHandler<CustomFieldForm> = async (data) => {
    setSubmitting(true)
    const { fieldType, title, ...rest } = data

    if (mode === 'add') {
      const fieldName = camelCase(title)

      if (DEFAULT_FIELDS.includes(fieldName as keyof Document)) {
        methods.setError('title', {
          type: 'manual',
          message: 'This field name is reserved and cannot be used.'
        })
        setSubmitting(false)
        return
      }

      if (customFields[fieldName]) {
        methods.setError('title', {
          type: 'manual',
          message: 'Field name is already taken.'
        })
        setSubmitting(false)
        return
      }

      const nextCustomFields = {
        ...customFields,
        [fieldName]: createCustomFieldDefinition({
          ...rest,
          fieldType,
          title,
          values: data.values
        })
      }

      const didCommit = await commitFieldSchema({
        customFields: nextCustomFields,
        action: 'add',
        fieldName
      })
      if (didCommit) {
        setCustomFields(nextCustomFields)
      }
      handleDialogChange(false)
      return
    }

    if (!selectedFieldDefinition) {
      setSubmitting(false)
      return
    }

    const nextCustomFields = {
      ...customFields,
      [selectedField]: createCustomFieldDefinition({
        ...rest,
        fieldType,
        title,
        values: data.values
      })
    }

    const didCommit = await commitFieldSchema({
      customFields: nextCustomFields,
      action: 'edit',
      fieldName: selectedField
    })
    if (didCommit) {
      setCustomFields(nextCustomFields)
    }
    handleDialogChange(false)
  }

  if (mode === 'add' && target.kind === 'singleton' && target.isNew) {
    return <SaveFirstModal open={open} onOpenChange={handleDialogChange} />
  }

  if (mode === 'edit' && !selectedFieldDefinition) {
    return null
  }

  const showValuesInput =
    mode === 'add'
      ? selectedFieldType === 'Select'
      : !!selectedFieldDefinition && isFieldWithValues(selectedFieldDefinition)

  const valuesLabel =
    mode === 'edit' && selectedFieldDefinition?.fieldType === 'Tags'
      ? 'Your tags'
      : 'Options'

  const valuesDescription =
    mode === 'edit' && selectedFieldDefinition?.fieldType === 'Tags'
      ? 'Deleting tags will remove them from suggestions, not from existing documents.'
      : mode === 'edit'
        ? 'Editing options updates the strict list of values available in this field.'
        : "Create the available options for this field. The stored YAML value will be each option's value."

  const fieldKeyPreview =
    mode === 'edit' ? selectedField : camelCase(watchedTitle ?? '')

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="w-full md:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add'
              ? `Add Custom Field to ${target.title}`
              : `Edit ${selectedFieldDefinition?.title}`}
          </DialogTitle>
          <DialogDescription>
            {mode === 'add'
              ? 'Configure the name, type, and validation for this field.'
              : 'Update the field configuration without changing its stored key.'}
          </DialogDescription>
        </DialogHeader>
        <FormProvider {...methods}>
          <form
            onSubmit={methods.handleSubmit(onSubmit)}
            onKeyDown={preventTagInputEnterSubmit}
            className="flex flex-col gap-4"
          >
            {mode === 'edit' ? (
              <div>
                <Alert variant="default">
                  <InfoCircledIcon />
                  <AlertTitle>
                    Field name and field type editing are disabled to avoid data
                    conflicts.
                  </AlertTitle>
                </Alert>
              </div>
            ) : null}

            <div className="flex pt-6 gap-4">
              <FormField
                control={methods.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Category"
                        {...field}
                        value={field.value ?? ''}
                        className="w-full max-w-sm md:w-80"
                        autoFocus
                        readOnly={mode === 'edit'}
                        disabled={mode === 'edit' || !!fieldTitle}
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
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={mode === 'edit'}
                      >
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
                        value={field.value ?? ''}
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

              <FormField
                control={methods.control}
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

            {showValuesInput ? (
              <div className="flex gap-4 mb-4">
                <TagInput
                  label={valuesLabel}
                  id="values"
                  description={valuesDescription}
                  suggestions={
                    mode === 'edit' && selectedFieldDefinition
                      ? isFieldWithValues(selectedFieldDefinition)
                        ? selectedFieldDefinition.values
                        : []
                      : methods.getValues('values') || []
                  }
                />
              </div>
            ) : null}

            <DialogFooter className="flex sm:justify-between items-center pt-6 border-t">
              <div className="text-sm">
                This field will be accessible on the frontend as:{' '}
                <code className="bg-muted font-semibold">
                  {fieldKeyPreview}
                </code>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDialogChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <SpinnerIcon className="text-background mr-2" />
                      {mode === 'add' ? 'Adding' : 'Editing'}
                    </>
                  ) : mode === 'add' ? (
                    'Add'
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
