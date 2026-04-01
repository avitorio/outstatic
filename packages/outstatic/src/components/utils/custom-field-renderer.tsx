import { DocumentSettingsImageSelection } from '@/components/document-settings-image-selection'
import { TagInput } from '@/components/ui/outstatic/tag-input'
import { Button } from '@/components/ui/shadcn/button'
import { Input } from '@/components/ui/shadcn/input'
import { Textarea } from '@/components/ui/shadcn/textarea'
import {
  CustomFieldArrayValue,
  CustomFieldsType,
  isArrayCustomField,
  isSelectCustomField
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/shadcn/accordion'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/shadcn/select'
import { cn } from '@/utils/ui'

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
  Select: ComponentType
  Tags: ComponentType
  Boolean: ComponentType
  Date: ComponentType
  Image: ComponentType
}

const FieldDataMap: FieldDataMapType = {
  String: { component: Input, props: { type: 'text' } },
  Text: { component: Textarea, props: {} },
  Number: { component: Input, props: { type: 'number' } },
  Select: { component: Input, props: { type: 'text' } },
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
  const isDateField = field.fieldType === 'Date'

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

      case 'Select': {
        if (!isSelectCustomField(field)) return null

        const currentValue =
          typeof formField.value === 'string' && formField.value.length > 0
            ? formField.value
            : undefined

        return (
          <div className="flex flex-col items-start gap-2">
            <Select
              value={currentValue}
              onValueChange={(value) => formField.onChange(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {field.values.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!field.required && currentValue ? (
              <Button
                type="button"
                variant="ghost"
                className="h-auto p-0 text-sm"
                onClick={() => formField.onChange(undefined)}
              >
                Clear selection
              </Button>
            ) : null}
          </div>
        )
      }

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
      type="single"
      collapsible
      key={name}
      className={cn(
        'border-b first:border-t',
        errors[name]?.message && 'border-destructive'
      )}
    >
      <AccordionItem value={name}>
        <AccordionTrigger className="hover:no-underline hover:bg-muted px-4 rounded-none data-[state=open]:bg-muted">{`
          ${field.title}${field.required ? '*' : ''}
        `}</AccordionTrigger>
        <AccordionContent className="p-4 border-top">
          {isDateField ? (
            <DateTimePickerForm id={name} description={field.description} />
          ) : (
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
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
