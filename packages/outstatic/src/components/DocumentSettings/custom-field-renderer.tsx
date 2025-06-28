import Accordion from '@/components/Accordion'
import DocumentSettingsImageSelection from '@/components/DocumentSettingsImageSelection'
import { TagInput } from '@/components/ui/outstatic/tag-input'
import { Input } from '@/components/ui/shadcn/input'
import { Textarea } from '@/components/ui/shadcn/textarea'
import {
  CustomFieldArrayValue,
  CustomFieldsType,
  isArrayCustomField
} from '@/types'
import { RegisterOptions } from 'react-hook-form'
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
  FormLabel,
  FormDescription
} from '@/components/ui/shadcn/form'
import { DateTimePickerForm } from '@/components/ui/outstatic/date-time-picker-form'
import { Checkbox } from '@/components/ui/shadcn/checkbox'

type CustomFieldRendererProps = {
  name: string
  field: CustomFieldsType[string]
  control: any
  errors: any
}

interface CustomInputProps {
  type?: 'text' | 'number' | 'checkbox' | 'date' | 'image'
  suggestions?: CustomFieldArrayValue[]
  registerOptions?: RegisterOptions
}

type ComponentType = {
  component:
    | typeof Input
    | typeof Textarea
    | typeof TagInput
    | typeof Checkbox
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
  Text: { component: Textarea, props: {} },
  Number: { component: Input, props: { type: 'number' } },
  Tags: {
    component: TagInput,
    props: {
      suggestions: []
    }
  },
  Boolean: { component: Checkbox, props: { type: 'checkbox' } },
  Date: { component: DateTimePickerForm, props: { type: 'date' } },
  Image: { component: DocumentSettingsImageSelection, props: { type: 'image' } }
}

export const CustomFieldRenderer = ({
  name,
  field,
  control,
  errors
}: CustomFieldRendererProps) => {
  const Field = FieldDataMap[field.fieldType as keyof FieldDataMapType]

  const renderFieldContent = (formField: any) => {
    switch (field.fieldType) {
      case 'String':
        return <Input {...formField} value={formField.value ?? ''} />

      case 'Number':
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
          <Input
            {...formField}
            type="number"
            value={formField.value ?? ''}
            onChange={(e) => {
              if (e.target.value === '') return formField.onChange(undefined)
              formField.onChange(Number(e.target.value))
            }}
          />
        )

      case 'Boolean':
        return (
          <FormField
            control={control}
            name={name}
            render={({ field: formField }) => (
              <FormItem>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox
                        checked={formField.value}
                        onCheckedChange={(checked) => {
                          return checked
                            ? formField.onChange(true)
                            : formField.onChange(false)
                        }}
                      />
                    </FormControl>
                    {field.description && (
                      <FormLabel className="text-sm font-normal">
                        {field.description}
                      </FormLabel>
                    )}
                  </div>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
        )

      default:
        if (isArrayCustomField(field)) {
          Field.props.suggestions = field.values
        }

        return (
          <Field.component id={name} {...formField} {...(Field.props as any)} />
        )
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
            <FormControl>{renderFieldContent(formField)}</FormControl>
            <FormDescription>{field.description}</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </Accordion>
  )
}
