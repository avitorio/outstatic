'use client'

import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import { restrictToParentElement } from '@dnd-kit/modifiers'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash } from 'lucide-react'
import { useId } from 'react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import {
  ArrayCustomField,
  ArrayItemType,
  ArraySubField,
  ObjectCustomField,
  PrimitiveArrayItemType
} from '@/types'
import { DocumentSettingsImageSelection } from '@/components/document-settings-image-selection'
import { Button } from '@/components/ui/shadcn/button'
import { Card, CardContent } from '@/components/ui/shadcn/card'
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
import { Textarea } from '@/components/ui/shadcn/textarea'
import { DateTimePickerForm } from '@/components/ui/outstatic/date-time-picker-form'
import { cn } from '@/utils/ui'

type ArrayFieldInputProps = {
  name: string
  field: ArrayCustomField
}

type ArrayFieldLike = {
  title: string
  itemType: ArrayItemType
  fields?: { [key: string]: ArraySubField }
  minItems?: number
  maxItems?: number
}

const buildEmptyItem = (field: ArrayFieldLike): any => {
  if (field.itemType === 'Object' && field.fields) {
    const item: Record<string, any> = {}
    for (const [key, sub] of Object.entries(field.fields)) {
      item[key] = defaultForSubField(sub)
    }
    return item
  }
  return defaultForItemType(field.itemType)
}

const defaultForItemType = (
  itemType: ArrayItemType | PrimitiveArrayItemType
): any => {
  switch (itemType) {
    case 'Number':
      return undefined
    case 'Boolean':
      return false
    case 'Date':
      return undefined
    case 'Image':
      return ''
    case 'Object':
      return {}
    default:
      return ''
  }
}

const defaultForSubField = (field: ArraySubField): any => {
  if (field.fieldType === 'Object') {
    const item: Record<string, any> = {}
    for (const [key, sub] of Object.entries(field.fields ?? {})) {
      item[key] = defaultForSubField(sub)
    }
    return item
  }

  if (field.fieldType === 'Array') {
    return []
  }

  return defaultForItemType(field.fieldType)
}

const itemHeader = (
  field: ArrayFieldLike,
  value: any,
  index: number
): string => {
  if (field.itemType === 'Object' && field.fields && value) {
    const firstStringKey = Object.entries(field.fields).find(
      ([, sub]) => sub.fieldType === 'String' || sub.fieldType === 'Text'
    )?.[0]
    if (firstStringKey && typeof value[firstStringKey] === 'string') {
      const text = value[firstStringKey].trim()
      if (text) return text
    }
  } else if (typeof value === 'string' && value.trim()) {
    return value.trim()
  } else if (typeof value === 'number') {
    return String(value)
  }
  return `Item ${index + 1}`
}

const PrimitiveInput = ({
  name,
  itemType
}: {
  name: string
  itemType: PrimitiveArrayItemType
}) => {
  const { control } = useFormContext()

  if (itemType === 'Image') {
    return <DocumentSettingsImageSelection id={name} />
  }

  if (itemType === 'Date') {
    return <DateTimePickerForm id={name} />
  }

  return (
    <FormField
      control={control}
      name={name}
      render={({ field: formField }) => {
        if (itemType === 'Boolean') {
          return (
            <FormItem>
              <FormControl>
                <Checkbox
                  checked={!!formField.value}
                  onCheckedChange={(checked) =>
                    formField.onChange(checked === true)
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )
        }

        if (itemType === 'Number') {
          return (
            <FormItem>
              <FormControl>
                <Input
                  type="number"
                  {...formField}
                  value={formField.value ?? ''}
                  onChange={(e) => {
                    if (e.target.value === '')
                      return formField.onChange(undefined)
                    formField.onChange(Number(e.target.value))
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )
        }

        if (itemType === 'Text') {
          return (
            <FormItem>
              <FormControl>
                <Textarea {...formField} value={formField.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )
        }

        return (
          <FormItem>
            <FormControl>
              <Input type="text" {...formField} value={formField.value ?? ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}

const ObjectItemFields = ({
  baseName,
  fields
}: {
  baseName: string
  fields: { [key: string]: ArraySubField }
}) => {
  return (
    <div className="grid gap-3">
      {Object.entries(fields).map(([subName, sub]) => (
        <div key={subName} className="flex flex-col gap-1">
          <FormLabel className="text-sm">
            {sub.title}
            {sub.required ? '*' : ''}
          </FormLabel>
          <SubFieldInput name={`${baseName}.${subName}`} field={sub} />
          {sub.description ? (
            <FormDescription>{sub.description}</FormDescription>
          ) : null}
        </div>
      ))}
    </div>
  )
}

type SortableItemProps = {
  id: string
  index: number
  field: ArrayFieldLike
  name: string
  onRemove: () => void
  value: any
}

const SortableItem = ({
  id,
  index,
  field,
  name,
  onRemove,
  value
}: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  const itemName = `${name}.${index}`

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'transition-[border-color,box-shadow] duration-150 py-0 rounded-sm',
        isDragging && 'z-10 border-gray-500 shadow-md'
      )}
    >
      <CardContent className="flex flex-col gap-3 p-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="cursor-grab text-muted-foreground active:cursor-grabbing"
            aria-label={`Reorder item ${index + 1}`}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </Button>
          <span className="flex-1 truncate text-sm font-medium">
            {itemHeader(field, value, index)}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            aria-label={`Remove item ${index + 1}`}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
        <div className="pl-0">
          {field.itemType === 'Object' ? (
            <ObjectItemFields baseName={itemName} fields={field.fields ?? {}} />
          ) : (
            <PrimitiveInput name={itemName} itemType={field.itemType} />
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export const ArrayFieldInput = ({ name, field }: ArrayFieldInputProps) => {
  return <ArrayItems name={name} field={field} />
}

export const ObjectFieldInput = ({
  name,
  field
}: {
  name: string
  field: ObjectCustomField
}) => {
  return <ObjectItemFields baseName={name} fields={field.fields ?? {}} />
}

const SubFieldInput = ({
  name,
  field
}: {
  name: string
  field: ArraySubField
}) => {
  if (field.fieldType === 'Object') {
    return <ObjectItemFields baseName={name} fields={field.fields ?? {}} />
  }

  if (field.fieldType === 'Array') {
    return (
      <ArrayItems
        name={name}
        field={{
          title: field.title,
          itemType: field.itemType,
          fields: field.fields
        }}
      />
    )
  }

  return <PrimitiveInput name={name} itemType={field.fieldType} />
}

const ArrayItems = ({
  name,
  field
}: {
  name: string
  field: ArrayFieldLike
}) => {
  const baseId = useId()
  const { control, watch } = useFormContext()
  const { fields, append, remove, move } = useFieldArray({
    control,
    name
  })

  const values = (watch(name) as any[] | undefined) ?? []

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = fields.findIndex((f) => `${baseId}-${f.id}` === active.id)
    const newIndex = fields.findIndex((f) => `${baseId}-${f.id}` === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    move(oldIndex, newIndex)
  }

  const sortableIds = fields.map((f) => `${baseId}-${f.id}`)

  return (
    <div className="flex flex-col gap-3">
      {fields.length === 0 ? (
        <p className="text-sm italic text-muted-foreground">No items yet.</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToParentElement]}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortableIds}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-2">
              {fields.map((rhfField, index) => (
                <SortableItem
                  key={rhfField.id}
                  id={`${baseId}-${rhfField.id}`}
                  index={index}
                  field={field}
                  name={name}
                  onRemove={() => remove(index)}
                  value={values[index]}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append(buildEmptyItem(field))}
        >
          + Add item
        </Button>
      </div>

      {arrayConstraintHint(field)}
    </div>
  )
}

const arrayConstraintHint = (field: ArrayFieldLike): React.ReactNode => {
  const hints: string[] = []
  if (typeof field.minItems === 'number') {
    hints.push(`min ${field.minItems}`)
  }
  if (typeof field.maxItems === 'number') {
    hints.push(`max ${field.maxItems}`)
  }
  if (hints.length === 0) return null
  return (
    <p className="text-xs text-muted-foreground">{hints.join(' · ')} items</p>
  )
}
