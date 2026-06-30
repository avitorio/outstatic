import { zodResolver } from '@hookform/resolvers/zod'
import { InfoCircledIcon } from '@radix-ui/react-icons'
import { camelCase } from 'change-case'
import { useEffect, useState } from 'react'
import { FormProvider, SubmitHandler, useForm, useWatch } from 'react-hook-form'
import {
  ArrayItemType,
  ArraySubField,
  ArraySubFieldDefinition,
  CustomFieldArrayValue,
  CustomFieldsType,
  Document,
  arrayItemTypes,
  createCustomFieldDefinition,
  customFieldTypeLabels,
  customFieldTypes,
  isFieldWithValues,
  isObjectCustomField,
  isRepeatableArrayCustomField
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
import { SubFieldFormEntry, SubFieldManager } from './sub-field-manager'

type CustomFieldForm = {
  title: string
  fieldType: (typeof customFieldTypes)[number]
  description?: string
  required?: boolean
  values?: CustomFieldArrayValue[]
  itemType?: ArrayItemType
  minItems?: number
  maxItems?: number
  fields?: SubFieldFormEntry[]
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

const schemaFieldsToFormEntries = (fields?: {
  [key: string]: ArraySubField
}): SubFieldFormEntry[] =>
  Object.entries(fields ?? {}).map(([name, sub]) => {
    const base = {
      name,
      title: sub.title,
      fieldType: sub.fieldType,
      description: sub.description,
      required: sub.required ?? false
    }

    if (sub.fieldType === 'Object') {
      return {
        ...base,
        fields: schemaFieldsToFormEntries(sub.fields)
      }
    }

    if (sub.fieldType === 'Array') {
      return {
        ...base,
        itemType: sub.itemType,
        fields:
          sub.itemType === 'Object'
            ? schemaFieldsToFormEntries(sub.fields)
            : undefined
      }
    }

    return base
  })

const formEntriesToSchemaFields = (
  fields?: SubFieldFormEntry[]
): { [key: string]: ArraySubFieldDefinition } | undefined => {
  if (!fields || fields.length === 0) {
    return undefined
  }

  const record: { [key: string]: ArraySubFieldDefinition } = {}

  for (const sub of fields) {
    if (sub.fieldType === 'Object') {
      record[sub.name] = {
        title: sub.title,
        fieldType: 'Object',
        description: sub.description,
        required: sub.required,
        fields: formEntriesToSchemaFields(sub.fields)
      }
      continue
    }

    if (sub.fieldType === 'Array') {
      record[sub.name] = {
        title: sub.title,
        fieldType: 'Array',
        itemType: sub.itemType ?? 'String',
        description: sub.description,
        required: sub.required,
        fields:
          sub.itemType === 'Object'
            ? formEntriesToSchemaFields(sub.fields)
            : undefined
      }
      continue
    }

    record[sub.name] = {
      title: sub.title,
      fieldType: sub.fieldType,
      description: sub.description,
      required: sub.required
    }
  }

  return record
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
    const base: Partial<CustomFieldForm> = {
      title: selectedFieldDefinition.title,
      fieldType: selectedFieldDefinition.fieldType,
      description: selectedFieldDefinition.description ?? '',
      required: selectedFieldDefinition.required ?? false,
      values: isFieldWithValues(selectedFieldDefinition)
        ? selectedFieldDefinition.values
        : undefined,
      minItems: isRepeatableArrayCustomField(selectedFieldDefinition)
        ? selectedFieldDefinition.minItems
        : undefined,
      maxItems: isRepeatableArrayCustomField(selectedFieldDefinition)
        ? selectedFieldDefinition.maxItems
        : undefined
    }

    if (isRepeatableArrayCustomField(selectedFieldDefinition)) {
      base.itemType = selectedFieldDefinition.itemType
      base.fields = schemaFieldsToFormEntries(selectedFieldDefinition.fields)
    }

    if (isObjectCustomField(selectedFieldDefinition)) {
      base.fields = schemaFieldsToFormEntries(selectedFieldDefinition.fields)
    }

    return base
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
  const [objectStep, setObjectStep] = useState<'details' | 'sub-fields'>(
    'details'
  )
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
  const selectedItemType = useWatch({
    control: methods.control,
    name: 'itemType'
  })
  const watchedTitle = useWatch({
    control: methods.control,
    name: 'title'
  })
  const watchedFields = useWatch({
    control: methods.control,
    name: 'fields'
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
      setObjectStep('details')
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

  const validateAddFieldDetails = () => {
    const title = methods.getValues('title')?.trim() ?? ''

    methods.clearErrors(['title', 'fields'])

    if (!title) {
      methods.setError('title', {
        type: 'manual',
        message: 'Custom field name is required.'
      })
      return false
    }

    if (!/^[a-zA-Z\s]+$/.test(title)) {
      methods.setError('title', {
        type: 'manual',
        message: 'Only alphabets are allowed for this field.'
      })
      return false
    }

    const fieldName = camelCase(title)

    if (DEFAULT_FIELDS.includes(fieldName as keyof Document)) {
      methods.setError('title', {
        type: 'manual',
        message: 'This field name is reserved and cannot be used.'
      })
      return false
    }

    if (customFields[fieldName]) {
      methods.setError('title', {
        type: 'manual',
        message: 'Field name is already taken.'
      })
      return false
    }

    return true
  }

  const handleObjectNext = () => {
    if (!validateAddFieldDetails()) return

    setObjectStep('sub-fields')
  }

  const onSubmit: SubmitHandler<CustomFieldForm> = async (data) => {
    setSubmitting(true)
    const { fieldType, title } = data

    const fieldsRecord =
      fieldType === 'Object' ||
      (fieldType === 'Array' && data.itemType === 'Object')
        ? formEntriesToSchemaFields(data.fields)
        : undefined

    const definitionInput = {
      title,
      fieldType,
      description: data.description,
      required: data.required,
      values: data.values,
      itemType: fieldType === 'Array' ? data.itemType : undefined,
      minItems: fieldType === 'Array' ? data.minItems : undefined,
      maxItems: fieldType === 'Array' ? data.maxItems : undefined,
      fields: fieldsRecord
    }

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
        [fieldName]: createCustomFieldDefinition(definitionInput)
      }

      const didCommit = await commitFieldSchema({
        customFields: nextCustomFields,
        action: 'add',
        fieldName
      })
      if (!didCommit) {
        setSubmitting(false)
        return
      }

      setCustomFields(nextCustomFields)
      handleDialogChange(false)
      return
    }

    if (!selectedFieldDefinition) {
      setSubmitting(false)
      return
    }

    const nextCustomFields = {
      ...customFields,
      [selectedField]: createCustomFieldDefinition(definitionInput)
    }

    const didCommit = await commitFieldSchema({
      customFields: nextCustomFields,
      action: 'edit',
      fieldName: selectedField
    })
    if (!didCommit) {
      setSubmitting(false)
      return
    }

    setCustomFields(nextCustomFields)
    handleDialogChange(false)
  }

  if (mode === 'add' && target.kind === 'singleton' && target.isNew) {
    return <SaveFirstModal open={open} onOpenChange={handleDialogChange} />
  }

  if (mode === 'edit' && !selectedFieldDefinition) {
    return null
  }

  const activeFieldType =
    mode === 'edit' ? selectedFieldDefinition?.fieldType : selectedFieldType
  const activeItemType =
    mode === 'edit' && isRepeatableArrayCustomField(selectedFieldDefinition)
      ? selectedFieldDefinition.itemType
      : selectedItemType
  const isTagsField = activeFieldType === 'Tags'
  const isArrayField = activeFieldType === 'Array'
  const isObjectField = activeFieldType === 'Object'
  const isObjectArray = isArrayField && activeItemType === 'Object'
  const isSubFieldObject = isObjectField || isObjectArray
  const isAddingObjectDetailsStep =
    mode === 'add' && isSubFieldObject && objectStep === 'details'
  const isAddingObjectSubFieldsStep =
    mode === 'add' && isSubFieldObject && objectStep === 'sub-fields'
  const showValuesInput =
    activeFieldType === 'Select' || activeFieldType === 'Tags'
  const hasSubFields = Array.isArray(watchedFields) && watchedFields.length > 0
  const isSubmitDisabled =
    submitting || (isAddingObjectSubFieldsStep && !hasSubFields)

  const valuesLabel = isTagsField ? 'Your tags' : 'Options'

  const valuesDescription = isTagsField
    ? mode === 'edit'
      ? 'Deleting tags will remove them from suggestions, not from existing documents.'
      : 'Add starter tags to seed suggestions for editors. Documents can still use other tags.'
    : mode === 'edit'
      ? 'Editing options updates the strict list of values available in this field.'
      : "Create the available options for this field. The stored YAML value will be each option's value."

  const fieldKeyPreview =
    mode === 'edit' ? selectedField : camelCase(watchedTitle ?? '')
  const objectRootLabel = watchedTitle?.trim() || 'Object'

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent
        className="w-full md:max-w-2xl"
        showCloseButton={!isAddingObjectSubFieldsStep}
      >
        {isAddingObjectSubFieldsStep ? (
          <DialogTitle className="sr-only">Sub-fields</DialogTitle>
        ) : (
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
        )}
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

            {!isAddingObjectSubFieldsStep ? (
              <>
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
                                  {customFieldTypeLabels[type]}
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
              </>
            ) : null}

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

            {isArrayField && !isAddingObjectSubFieldsStep ? (
              <div className="flex flex-col gap-4 mb-4">
                <FormField
                  control={methods.control}
                  name="itemType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? ''}
                        disabled={mode === 'edit'}
                      >
                        <FormControl>
                          <SelectTrigger className="w-[220px]">
                            <SelectValue placeholder="Pick an item type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {arrayItemTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Each entry in this array will be a value of the chosen
                        type. Pick &quot;Object&quot; to define sub-fields.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isObjectArray && mode === 'edit' ? <SubFieldManager /> : null}

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={methods.control}
                    name="minItems"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum items</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            step={1}
                            placeholder="No minimum"
                            value={field.value ?? ''}
                            onChange={(event) => {
                              const value = event.target.value
                              field.onChange(
                                value === '' ? undefined : Number(value)
                              )
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Leave blank to allow any number of items.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={methods.control}
                    name="maxItems"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum items</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            step={1}
                            placeholder="No maximum"
                            value={field.value ?? ''}
                            onChange={(event) => {
                              const value = event.target.value
                              field.onChange(
                                value === '' ? undefined : Number(value)
                              )
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Leave blank to allow any number of items.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            ) : null}

            {(isObjectField && mode === 'edit') ||
            isAddingObjectSubFieldsStep ? (
              <div className="flex flex-col gap-4 mb-4">
                <SubFieldManager
                  rootLabel={
                    isAddingObjectSubFieldsStep ? objectRootLabel : 'Object'
                  }
                  description="This object is made of these sub-fields."
                  framed={!isAddingObjectSubFieldsStep}
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
                {isAddingObjectSubFieldsStep ? (
                  <Button
                    key="back"
                    type="button"
                    variant="outline"
                    onClick={() => setObjectStep('details')}
                    disabled={submitting}
                  >
                    Back
                  </Button>
                ) : null}
                {isAddingObjectDetailsStep ? (
                  <Button
                    key="next"
                    type="button"
                    onClick={handleObjectNext}
                    disabled={submitting}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    key="submit"
                    type="submit"
                    disabled={isSubmitDisabled}
                  >
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
                )}
              </div>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  )
}
