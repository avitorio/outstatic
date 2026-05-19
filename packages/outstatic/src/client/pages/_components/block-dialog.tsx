import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
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
import { blockFormSchema } from '@/utils/schemas/blocks-schema'
import { blockPropTypes, Block } from '@/utils/metadata/types'
import { useUpdateBlocks } from '@/utils/hooks/use-update-blocks'
import { CustomFieldArrayValue } from '@/types'

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
    props: []
  }
}

const toBlock = (values: BlockFormValue): Block => ({
  name: values.name.trim(),
  description: values.description?.trim() || undefined,
  keywords: toStoredValues(values.keywords),
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
  const { addBlock, updateBlock } = useUpdateBlocks()
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

  useEffect(() => {
    methods.reset(getDefaultValues({ mode, block }))
  }, [block, methods, mode, open])

  const handleDialogChange = (value: boolean) => {
    if (!value) {
      setSubmitting(false)
      methods.reset(getDefaultValues({ mode, block }))
    }

    onOpenChange(value)
  }

  const onSubmit: SubmitHandler<BlockFormValue> = async (data) => {
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
      return
    }

    const nextBlock = toBlock(data)

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

  if (mode === 'edit' && !block) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] w-full overflow-y-auto md:max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Add Block' : `Edit ${block?.name}`}
          </DialogTitle>
          <DialogDescription>
            Define the component name, search keywords, and props editors can
            fill in from the slash command.
          </DialogDescription>
        </DialogHeader>
        <FormProvider {...methods}>
          <form
            onSubmit={methods.handleSubmit(onSubmit)}
            onKeyDown={preventTagInputEnterSubmit}
            className="flex flex-col gap-6"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={methods.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
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

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-medium">Props</h3>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    append({
                      name: '',
                      type: 'String',
                      required: false,
                      description: '',
                      defaultValue: '',
                      options: []
                    })
                  }
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
                <div className="space-y-4">
                  {fields.map((field, index) => {
                    const selectedType = watchedProps?.[index]?.type
                    return (
                      <div
                        key={field.id}
                        className="rounded-md border bg-card p-4"
                      >
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
                                <div className="flex h-10 items-center gap-2">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={(checked) =>
                                        field.onChange(checked === true)
                                      }
                                    />
                                  </FormControl>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => remove(index)}
                                  >
                                    <span className="sr-only">Remove prop</span>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
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
                                methods.getValues(`props.${index}.options`) ??
                                []
                              }
                            />
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <DialogFooter className="border-t pt-4">
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
                    <SpinnerIcon className="mr-2 text-background" />
                    {mode === 'add' ? 'Adding' : 'Saving'}
                  </>
                ) : mode === 'add' ? (
                  'Add Block'
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  )
}
