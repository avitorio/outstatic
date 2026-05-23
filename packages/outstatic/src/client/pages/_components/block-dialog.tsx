import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  FieldPath,
  FormProvider,
  SubmitHandler,
  useFieldArray,
  useForm,
  useWatch
} from 'react-hook-form'
import {
  TagInput,
  preventTagInputEnterSubmit
} from '@/components/ui/outstatic/tag-input'
import { SpinnerIcon } from '@/components/ui/outstatic/spinner-icon'
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
import { Textarea } from '@/components/ui/shadcn/textarea'
import { blockFormSchema } from '@/utils/schemas/blocks-schema'
import { blockPropTypes, Block } from '@/utils/metadata/types'
import { useUpdateBlocks } from '@/utils/hooks/use-update-blocks'
import { usePermissions } from '@/utils/hooks/use-permissions'
import { CustomFieldArrayValue } from '@/types'
import { IconPicker } from './icon-picker'

type BlockDialogProps = {
  mode: 'add' | 'edit'
  open: boolean
  onOpenChange: (open: boolean) => void
  blocks: Block[]
  block?: Block | null
  onSaved: (block: Block, previousName?: string) => void
}

type BlockPropFormValue = {
  name: string
  type: (typeof blockPropTypes)[number]
  required?: boolean
  description?: string
  defaultValue?: string
  options?: CustomFieldArrayValue[]
}

type BlockFormValue = {
  name: string
  description?: string
  keywords?: CustomFieldArrayValue[]
  imports?: string
  additionalAttributes?: string
  icon?: string
  props: BlockPropFormValue[]
}

const BUILT_IN_SLASH_TITLES = [
  'Continue writing',
  'Text',
  'Heading 1',
  'Heading 2',
  'Heading 3',
  'Bullet List',
  'Numbered List',
  'Quote',
  'Code',
  'MDX',
  'Image',
  'Table'
]

const TOTAL_STEPS = 3

const STEP_FIELDS: Record<number, FieldPath<BlockFormValue>[]> = {
  1: ['name', 'description', 'keywords', 'imports', 'icon'],
  2: ['props'],
  3: ['additionalAttributes']
}

const STEP_DESCRIPTIONS: Record<number, string> = {
  1: 'Step 1 of 3 — Component basics and imports.',
  2: 'Step 2 of 3 — Props editors fill in from the slash command.',
  3: 'Step 3 of 3 — Additional attributes appended to every inserted instance.'
}

const toTagValues = (values?: string[]): CustomFieldArrayValue[] =>
  values?.map((value) => ({ label: value, value })) ?? []

const toStoredValues = (values?: CustomFieldArrayValue[]) =>
  values?.map((value) => value.label.trim()).filter((value) => value.length > 0)

const getDefaultValues = ({
  mode,
  block
}: {
  mode: 'add' | 'edit'
  block?: Block | null
}): BlockFormValue => {
  if (mode === 'edit' && block) {
    return {
      name: block.name,
      description: block.description ?? '',
      keywords: toTagValues(block.keywords),
      imports: block.imports ?? '',
      additionalAttributes: block.additionalAttributes ?? '',
      icon: block.icon ?? undefined,
      props: block.props.map((prop) => ({
        ...prop,
        required: prop.required ?? false,
        description: prop.description ?? '',
        defaultValue: prop.defaultValue ?? '',
        options: toTagValues(prop.options)
      }))
    }
  }

  return {
    name: '',
    description: '',
    keywords: [],
    imports: '',
    additionalAttributes: '',
    icon: undefined,
    props: []
  }
}

const toBlock = (values: BlockFormValue, includeImports: boolean): Block => ({
  name: values.name.trim(),
  description: values.description?.trim() || undefined,
  keywords: toStoredValues(values.keywords),
  imports:
    includeImports && values.imports?.trim()
      ? values.imports.trim()
      : undefined,
  additionalAttributes: values.additionalAttributes?.trim() || undefined,
  icon: values.icon?.trim() || undefined,
  props: values.props.map((prop) => ({
    name: prop.name.trim(),
    type: prop.type,
    required: prop.required || undefined,
    description: prop.description?.trim() || undefined,
    defaultValue: prop.defaultValue?.trim() || undefined,
    options: prop.type === 'Select' ? toStoredValues(prop.options) : undefined
  }))
})

export const BlockDialog = ({
  mode,
  open,
  onOpenChange,
  blocks,
  block,
  onSaved
}: BlockDialogProps) => {
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState(1)
  const { addBlock, updateBlock } = useUpdateBlocks()
  const { canManageCollections } = usePermissions()
  const methods = useForm<BlockFormValue>({
    mode: 'onChange',
    resolver: zodResolver(blockFormSchema) as any,
    defaultValues: getDefaultValues({ mode, block })
  })
  const { fields, append, remove } = useFieldArray({
    control: methods.control,
    name: 'props'
  })
  const watchedProps = useWatch({
    control: methods.control,
    name: 'props'
  })
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [shouldExpandNewField, setShouldExpandNewField] = useState(false)
  const [previousOpen, setPreviousOpen] = useState(open)
  const [previousFieldsLength, setPreviousFieldsLength] = useState(
    fields.length
  )
  const [hasImports, setHasImports] = useState(
    mode === 'edit' && !!block?.imports
  )

  useEffect(() => {
    methods.reset(getDefaultValues({ mode, block }))
  }, [block, methods, mode, open])

  useEffect(() => {
    if (!canManageCollections && open) {
      onOpenChange(false)
    }
  }, [canManageCollections, onOpenChange, open])

  if (previousOpen !== open) {
    setPreviousOpen(open)
    setExpandedIds(new Set())
    setHasImports(mode === 'edit' && !!block?.imports)
    setStep(1)
  }

  if (fields.length !== previousFieldsLength) {
    setPreviousFieldsLength(fields.length)
    if (shouldExpandNewField && fields.length > 0) {
      setShouldExpandNewField(false)
      const lastField = fields[fields.length - 1]
      if (lastField) {
        setExpandedIds((prev) => {
          const next = new Set(prev)
          next.add(lastField.id)
          return next
        })
      }
    }
  }

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleAddProp = () => {
    setShouldExpandNewField(true)
    append({
      name: '',
      type: 'String',
      required: false,
      description: '',
      defaultValue: '',
      options: []
    })
  }

  const handleDialogChange = (value: boolean) => {
    if (!value) {
      setSubmitting(false)
      methods.reset(getDefaultValues({ mode, block }))
      setHasImports(mode === 'edit' && !!block?.imports)
      setStep(1)
    }

    onOpenChange(value)
  }

  const handleImportsToggle = (checked: boolean) => {
    setHasImports(checked)
    if (!checked) {
      methods.setValue('imports', '', { shouldDirty: true })
    }
  }

  const handleNext = async () => {
    const valid = await methods.trigger(STEP_FIELDS[step], {
      shouldFocus: true
    })
    if (valid) {
      setStep((current) => Math.min(TOTAL_STEPS, current + 1))
    }
  }

  const handleBack = () => {
    setStep((current) => Math.max(1, current - 1))
  }

  const onSubmit: SubmitHandler<BlockFormValue> = async (data) => {
    if (!canManageCollections) {
      return
    }

    if (step !== TOTAL_STEPS) {
      return
    }
    setSubmitting(true)
    const blockName = data.name.trim()
    const normalizedName = blockName.toLowerCase()
    const nameIsBuiltIn = BUILT_IN_SLASH_TITLES.some(
      (title) => title.toLowerCase() === normalizedName
    )
    const nameIsTaken = blocks.some(
      (existingBlock) =>
        existingBlock.name.toLowerCase() === normalizedName &&
        existingBlock.name !== block?.name
    )

    if (nameIsBuiltIn || nameIsTaken) {
      methods.setError('name', {
        type: 'manual',
        message: nameIsBuiltIn
          ? 'This block name is reserved by a built-in editor command.'
          : 'Block name is already taken.'
      })
      setSubmitting(false)
      setStep(1)
      return
    }

    const nextBlock = toBlock(data, hasImports)

    try {
      if (mode === 'add') {
        await addBlock(nextBlock)
      } else if (block) {
        await updateBlock(block.name, nextBlock)
      }

      onSaved(nextBlock, block?.name)
      handleDialogChange(false)
    } catch {
      setSubmitting(false)
    }
  }

  if (!canManageCollections || (mode === 'edit' && !block)) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] w-full overflow-y-auto md:max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Add Block' : `Edit ${block?.name}`}
          </DialogTitle>
          <DialogDescription>{STEP_DESCRIPTIONS[step]}</DialogDescription>
        </DialogHeader>
        <FormProvider {...methods}>
          <form
            onSubmit={methods.handleSubmit(onSubmit)}
            onKeyDown={preventTagInputEnterSubmit}
            className="flex flex-col gap-6"
          >
            {step === 1 ? (
              <div className="flex flex-col gap-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <FormField
                      control={methods.control}
                      name="icon"
                      render={({ field }) => (
                        <FormItem className="shrink-0">
                          <FormLabel>Icon</FormLabel>
                          <FormControl>
                            <IconPicker
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={methods.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="min-w-0 flex-1">
                          <FormLabel>Component Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Callout"
                              {...field}
                              value={field.value ?? ''}
                              autoFocus
                            />
                          </FormControl>
                          <FormDescription>
                            Use the exported MDX component name.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={methods.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Highlight important content"
                            {...field}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormDescription>
                          Shown in the editor slash menu.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <TagInput
                  label="Keywords"
                  id="keywords"
                  placeholder="Add keyword"
                  description="Additional search terms for the slash command."
                  suggestions={methods.getValues('keywords') ?? []}
                />

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="has-imports"
                      checked={hasImports}
                      onCheckedChange={(checked) =>
                        handleImportsToggle(checked === true)
                      }
                    />
                    <label
                      htmlFor="has-imports"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Add imports
                    </label>
                  </div>
                  {hasImports ? (
                    <FormField
                      control={methods.control}
                      name="imports"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              placeholder={`import Callout from '@/components/Callout'`}
                              rows={4}
                              className="font-mono text-sm"
                              {...field}
                              value={field.value ?? ''}
                            />
                          </FormControl>
                          <FormDescription>
                            Added to the top of the document (below the
                            frontmatter) when a document uses this block.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : null}
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-medium">Props</h3>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddProp}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Prop
                  </Button>
                </div>

                {fields.length === 0 ? (
                  <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                    This block has no props.
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto">
                    {fields.map((field, index) => {
                      const selectedType = watchedProps?.[index]?.type
                      const propName = watchedProps?.[index]?.name?.trim()
                      const hasError = !!(
                        methods.formState.errors.props as any
                      )?.[index]
                      const isExpanded = expandedIds.has(field.id) || hasError
                      return (
                        <div
                          key={field.id}
                          className="rounded-md border bg-card overflow-hidden"
                        >
                          <div
                            role="button"
                            tabIndex={0}
                            className="flex items-center justify-between gap-2 p-3 cursor-pointer hover:bg-accent/50"
                            onClick={() => toggleExpanded(field.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                toggleExpanded(field.id)
                              }
                            }}
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                              )}
                              <span className="font-medium truncate">
                                {propName || 'Untitled prop'}
                              </span>
                              {selectedType ? (
                                <span className="text-xs text-muted-foreground shrink-0">
                                  ({selectedType})
                                </span>
                              ) : null}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation()
                                remove(index)
                              }}
                            >
                              <span className="sr-only">Remove prop</span>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          {isExpanded ? (
                            <div className="border-t p-4">
                              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px_auto]">
                                <FormField
                                  control={methods.control}
                                  name={`props.${index}.name`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Prop name</FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="title"
                                          {...field}
                                          value={field.value ?? ''}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={methods.control}
                                  name={`props.${index}.type`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Type</FormLabel>
                                      <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                      >
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Type" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {blockPropTypes.map((type) => (
                                            <SelectItem key={type} value={type}>
                                              {type}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={methods.control}
                                  name={`props.${index}.required`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Required</FormLabel>
                                      <div className="flex h-10 items-center">
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value}
                                            onCheckedChange={(checked) =>
                                              field.onChange(checked === true)
                                            }
                                          />
                                        </FormControl>
                                      </div>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <div className="mt-4 grid gap-4 md:grid-cols-2">
                                <FormField
                                  control={methods.control}
                                  name={`props.${index}.description`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Description</FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="Shown in the insert form"
                                          {...field}
                                          value={field.value ?? ''}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={methods.control}
                                  name={`props.${index}.defaultValue`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Default value</FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="Optional"
                                          {...field}
                                          value={field.value ?? ''}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              {selectedType === 'Select' ? (
                                <div className="mt-4">
                                  <TagInput
                                    label="Options"
                                    id={`props.${index}.options`}
                                    placeholder="Add option"
                                    description="Values available when inserting this block."
                                    suggestions={
                                      methods.getValues(
                                        `props.${index}.options`
                                      ) ?? []
                                    }
                                  />
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ) : null}

            {step === 3 ? (
              <FormField
                control={methods.control}
                name="additionalAttributes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional attributes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={`className="my-callout" data-variant="info"`}
                        rows={4}
                        className="font-mono text-sm"
                        {...field}
                        value={field.value ?? ''}
                        autoFocus
                      />
                    </FormControl>
                    <FormDescription>
                      Appended verbatim to every inserted instance of this
                      block, after any prop attributes. Useful for static
                      className, data-*, or framework-specific attributes.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            <DialogFooter className="border-t pt-4 sm:justify-between">
              {step === 1 ? (
                <Button
                  key="cancel"
                  type="button"
                  variant="outline"
                  onClick={() => handleDialogChange(false)}
                >
                  Cancel
                </Button>
              ) : (
                <Button
                  key="back"
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                >
                  Back
                </Button>
              )}
              {step < TOTAL_STEPS ? (
                <Button key="next" type="button" onClick={handleNext}>
                  Next
                </Button>
              ) : (
                <Button key="submit" type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <SpinnerIcon className="mr-2 text-background" />
                      {mode === 'add' ? 'Adding' : 'Saving'}
                    </>
                  ) : mode === 'add' ? (
                    'Add Block'
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              )}
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  )
}
