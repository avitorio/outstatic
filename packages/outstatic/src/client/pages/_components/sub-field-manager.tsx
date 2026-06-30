import { camelCase } from 'change-case'
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { Button } from '@/components/ui/shadcn/button'
import { Checkbox } from '@/components/ui/shadcn/checkbox'
import { Input } from '@/components/ui/shadcn/input'
import { ArrayItemType } from '@/types'
import { MAX_ARRAY_FIELD_DEPTH } from '@/utils/schemas/custom-field-schema'

const SUB_FIELD_TYPES = [
  'String',
  'Text',
  'Number',
  'Boolean',
  'Date',
  'Image',
  'Object',
  'Array'
] as const

type SubFieldType = (typeof SUB_FIELD_TYPES)[number]

const ARRAY_SUB_FIELD_ITEM_TYPES = [
  'String',
  'Text',
  'Number',
  'Boolean',
  'Date',
  'Image',
  'Object'
] as const

export type SubFieldFormEntry = {
  name: string
  title: string
  fieldType: SubFieldType
  itemType?: ArrayItemType
  description?: string
  required?: boolean
  fields?: SubFieldFormEntry[]
}

const emptySubField = (): SubFieldFormEntry => ({
  name: '',
  title: '',
  fieldType: 'String',
  required: false,
  description: ''
})

const normalizeForFieldType = (
  field: SubFieldFormEntry,
  fieldType: SubFieldType,
  allowObjectItem = true
): SubFieldFormEntry => {
  const next: SubFieldFormEntry = {
    ...field,
    fieldType
  }

  if (fieldType === 'Object') {
    delete next.itemType
    next.fields = next.fields ?? []
    return next
  }

  if (fieldType === 'Array') {
    next.itemType = next.itemType ?? 'String'
    if (!allowObjectItem && next.itemType === 'Object') {
      next.itemType = 'String'
    }
    if (next.itemType === 'Object') {
      next.fields = next.fields ?? []
    } else {
      delete next.fields
    }
    return next
  }

  delete next.itemType
  delete next.fields
  return next
}

const normalizeForItemType = (
  field: SubFieldFormEntry,
  itemType: ArrayItemType
): SubFieldFormEntry => {
  const next: SubFieldFormEntry = {
    ...field,
    itemType
  }

  if (itemType === 'Object') {
    next.fields = next.fields ?? []
  } else {
    delete next.fields
  }

  return next
}

const isNestable = (field: SubFieldFormEntry) =>
  field.fieldType === 'Object' ||
  (field.fieldType === 'Array' && field.itemType === 'Object')

const describeField = (field: SubFieldFormEntry) =>
  field.fieldType === 'Array'
    ? `Array<${field.itemType ?? 'String'}>`
    : field.fieldType

const fieldsPathForTrail = (path: number[]) =>
  path.reduce((fieldPath, index) => `${fieldPath}.${index}.fields`, 'fields')

const getFieldsAtPath = (
  fields: SubFieldFormEntry[] | undefined,
  path: number[]
): SubFieldFormEntry[] => {
  let current = fields ?? []

  for (const index of path) {
    const node = current[index]
    if (!node || !isNestable(node)) {
      return []
    }
    current = node.fields ?? []
  }

  return current
}

const getValidPath = (
  fields: SubFieldFormEntry[] | undefined,
  path: number[]
): number[] => {
  const validPath: number[] = []
  let current = fields ?? []

  for (const index of path) {
    const node = current[index]
    if (!node || !isNestable(node)) {
      break
    }
    validPath.push(index)
    current = node.fields ?? []
  }

  return validPath
}

const isSamePath = (left: number[], right: number[]) =>
  left.length === right.length &&
  left.every((value, index) => value === right[index])

const collectErrorMessages = (error: unknown): string[] => {
  if (!error || typeof error !== 'object') {
    return []
  }

  const maybeMessage = (error as { message?: unknown }).message
  const messages =
    typeof maybeMessage === 'string' && maybeMessage.length > 0
      ? [maybeMessage]
      : []

  for (const value of Object.values(error)) {
    if (value && typeof value === 'object') {
      messages.push(...collectErrorMessages(value))
    }
  }

  return messages
}

const getTrail = (
  fields: SubFieldFormEntry[] | undefined,
  path: number[]
): SubFieldFormEntry[] => {
  const trail: SubFieldFormEntry[] = []
  let current = fields ?? []

  for (const index of path) {
    const node = current[index]
    if (!node) break
    trail.push(node)
    current = node.fields ?? []
  }

  return trail
}

export const SubFieldManager = ({
  disabled,
  rootLabel = 'Items',
  description = 'Each item in the array is an object with these sub-fields.',
  framed = true
}: {
  disabled?: boolean
  rootLabel?: string
  description?: string
  framed?: boolean
}) => {
  const { control, formState, setValue } = useFormContext()
  const [path, setPath] = useState<number[]>([])
  const watchedFields = useWatch({ control, name: 'fields' }) as
    | SubFieldFormEntry[]
    | undefined
  const validPath = useMemo(
    () => getValidPath(watchedFields, path),
    [watchedFields, path]
  )
  const fieldErrorMessages = useMemo(
    () => Array.from(new Set(collectErrorMessages(formState.errors.fields))),
    [formState.errors.fields]
  )

  const currentFields = useMemo(
    () => getFieldsAtPath(watchedFields, validPath),
    [watchedFields, validPath]
  )
  const trail = useMemo(
    () => getTrail(watchedFields, validPath),
    [watchedFields, validPath]
  )
  const currentPath = fieldsPathForTrail(validPath)
  const depth = validPath.length + 1
  const atDepthLimit = depth >= MAX_ARRAY_FIELD_DEPTH
  const availableArrayItemTypes = atDepthLimit
    ? ARRAY_SUB_FIELD_ITEM_TYPES.filter((type) => type !== 'Object')
    : ARRAY_SUB_FIELD_ITEM_TYPES

  const updateCurrentFields = (nextFields: SubFieldFormEntry[]) => {
    if (!isSamePath(validPath, path)) {
      setPath(validPath)
    }

    setValue(currentPath, nextFields, {
      shouldDirty: true,
      shouldValidate: true
    })
  }

  const updateSubField = (index: number, nextField: SubFieldFormEntry) => {
    const nextFields = [...currentFields]
    nextFields[index] = nextField
    updateCurrentFields(nextFields)
  }

  const handleAdd = () => {
    if (disabled) return
    updateCurrentFields([...currentFields, emptySubField()])
  }

  const handleRemove = (index: number) => {
    updateCurrentFields(
      currentFields.filter((_, currentIndex) => currentIndex !== index)
    )
  }

  return (
    <div
      className={
        framed
          ? 'flex min-h-0 flex-col gap-3 rounded-md border border-border p-4'
          : 'flex min-h-0 flex-col gap-3'
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">Sub-fields</p>
          <p className="text-sm text-muted-foreground">{description}</p>
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

      {fieldErrorMessages.length > 0 ? (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <p className="font-medium">Fix sub-field errors</p>
          <ul className="mt-1 list-disc space-y-1 pl-4">
            {fieldErrorMessages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <nav
        aria-label="Sub-field path"
        className="flex flex-wrap items-center gap-1 rounded-md bg-muted/40 px-2 py-1.5 text-sm"
      >
        <button
          type="button"
          onClick={() => setPath([])}
          className="rounded-sm px-1.5 py-0.5 font-medium hover:bg-background"
        >
          {rootLabel}
        </button>
        {trail.map((node, index) => {
          const isLast = index === trail.length - 1
          return (
            <span
              key={`${node.name}-${index}`}
              className="flex items-center gap-1"
            >
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              <button
                type="button"
                onClick={() =>
                  setPath((current) => current.slice(0, index + 1))
                }
                aria-current={isLast ? 'page' : undefined}
                className="rounded-sm px-1.5 py-0.5 font-medium hover:bg-background"
              >
                {node.title || node.name || 'Untitled'}
              </button>
            </span>
          )
        })}
      </nav>

      <p className="text-xs text-muted-foreground">
        Level {depth} / {MAX_ARRAY_FIELD_DEPTH}
      </p>

      {currentFields.length === 0 ? (
        <p className="text-sm italic text-muted-foreground">
          No sub-fields yet. Click &quot;Add sub-field&quot; to start.
        </p>
      ) : null}

      <div className="flex max-h-[45vh] min-h-0 flex-col gap-3 overflow-y-auto pr-1">
        {currentFields.map((subField, index) => (
          <div
            key={`${currentPath}.${index}`}
            className="rounded-lg border border-border bg-card p-3"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <span className="mb-1.5 block text-sm font-semibold text-foreground">
                  Name
                </span>
                <Input
                  value={subField.title ?? ''}
                  placeholder="Ex: Author name"
                  disabled={disabled}
                  aria-label="Sub-field name"
                  className="h-9 rounded-lg border-border bg-background text-sm text-foreground shadow-none"
                  onChange={(event) => {
                    const title = event.target.value
                    const previousAuto = camelCase(subField.title || '')
                    const name =
                      !subField.name || subField.name === previousAuto
                        ? camelCase(title)
                        : subField.name

                    updateSubField(index, {
                      ...subField,
                      title,
                      name
                    })
                  }}
                />
              </div>

              <div className="w-full sm:w-36">
                <span className="mb-1.5 block text-sm font-semibold text-foreground">
                  Type
                </span>
                <div className="relative">
                  <select
                    value={subField.fieldType}
                    disabled={disabled}
                    aria-label="Sub-field type"
                    className="h-9 w-full appearance-none rounded-lg border border-border bg-background px-3 pr-9 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                    onChange={(event) =>
                      updateSubField(
                        index,
                        normalizeForFieldType(
                          subField,
                          event.target.value as SubFieldType,
                          !atDepthLimit
                        )
                      )
                    }
                  >
                    {SUB_FIELD_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                </div>
              </div>

              {subField.fieldType === 'Array' ? (
                <div className="w-full sm:w-36">
                  <span className="mb-1.5 block text-sm font-semibold text-foreground">
                    Item type
                  </span>
                  <div className="relative">
                    <select
                      value={subField.itemType ?? 'String'}
                      disabled={disabled}
                      aria-label="Sub-field item type"
                      className="h-9 w-full appearance-none rounded-lg border border-border bg-background px-3 pr-9 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                      onChange={(event) =>
                        updateSubField(
                          index,
                          normalizeForItemType(
                            subField,
                            event.target.value as ArrayItemType
                          )
                        )
                      }
                    >
                      {availableArrayItemTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              ) : null}

              <div className="flex items-center gap-3 sm:pb-1.5">
                <div className="flex flex-col items-center gap-1">
                  <span className="mb-0 block text-sm font-semibold text-foreground">
                    Req.
                  </span>
                  <Checkbox
                    checked={!!subField.required}
                    onCheckedChange={(checked) =>
                      updateSubField(index, {
                        ...subField,
                        required: checked === true
                      })
                    }
                    disabled={disabled}
                    className="size-5 rounded-md border-border bg-background shadow-none hover:bg-muted"
                  />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemove(index)}
                  disabled={disabled}
                  aria-label="Delete sub-field"
                  className="size-7 rounded-md text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                Key:{' '}
                <span className="font-mono text-foreground">
                  {subField.name || '—'}
                </span>
              </p>

              {isNestable(subField) ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setPath([...validPath, index])}
                  disabled={disabled || atDepthLimit}
                >
                  {atDepthLimit
                    ? 'Max depth'
                    : `${describeField(subField)} · ${
                        subField.fields?.length ?? 0
                      }`}
                  {!atDepthLimit ? <ChevronRight className="h-4 w-4" /> : null}
                </Button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
