import { camelCase } from 'change-case'
import { Trash } from 'lucide-react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { Button } from '@/components/ui/shadcn/button'
import { Checkbox } from '@/components/ui/shadcn/checkbox'
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

const SUB_FIELD_TYPES = [
  'String',
  'Text',
  'Number',
  'Boolean',
  'Date',
  'Image'
] as const

export const SubFieldManager = ({ disabled }: { disabled?: boolean }) => {
  const { control, setValue, getValues } = useFormContext()
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'fields'
  })

  const handleAdd = () => {
    if (disabled) return
    append({
      name: '',
      title: '',
      fieldType: 'String',
      required: false,
      description: ''
    })
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">Sub-fields</p>
          <p className="text-sm text-muted-foreground">
            Each item in the array is an object with these sub-fields.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={disabled}
        >
          + Add sub-field
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          No sub-fields yet. Click &quot;Add sub-field&quot; to start.
        </p>
      ) : null}

      {fields.map((subField, index) => (
        <div
          key={subField.id}
          className="grid grid-cols-[1fr_140px_auto_auto] items-end gap-2 rounded-md border border-border p-3"
        >
          <FormField
            control={control}
            name={`fields.${index}.title`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ''}
                    placeholder="Ex: Author name"
                    disabled={disabled}
                    onChange={(e) => {
                      field.onChange(e.target.value)
                      const current = getValues(`fields.${index}.name`)
                      const previousAuto = camelCase(
                        getValues(`fields.${index}.title`) || ''
                      )
                      if (!current || current === previousAuto) {
                        setValue(
                          `fields.${index}.name`,
                          camelCase(e.target.value)
                        )
                      }
                    }}
                  />
                </FormControl>
                <FormDescription>
                  Key:{' '}
                  <code className="bg-muted">
                    {getValues(`fields.${index}.name`) || ''}
                  </code>
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name={`fields.${index}.fieldType`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={disabled}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {SUB_FIELD_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name={`fields.${index}.required`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Required</FormLabel>
                <FormControl>
                  <div className="flex h-9 items-center">
                    <Checkbox
                      checked={!!field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                      disabled={disabled}
                    />
                  </div>
                </FormControl>
              </FormItem>
            )}
          />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => remove(index)}
            disabled={disabled}
            aria-label="Remove sub-field"
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  )
}
