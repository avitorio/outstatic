import { type DragEndEvent, DndContext } from '@dnd-kit/core'
import { restrictToParentElement } from '@dnd-kit/modifiers'
import { SortableContext, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useEffect, useMemo, useState } from 'react'
import { GripVertical, Trash } from 'lucide-react'
import { AdminLayout } from '@/components/admin-layout'
import { AdminLoading } from '@/components/admin-loading'
import { Button } from '@/components/ui/shadcn/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/shadcn/card'
import { Checkbox } from '@/components/ui/shadcn/checkbox'
import { SpinnerIcon } from '@/components/ui/outstatic/spinner-icon'
import { CustomFieldsType, customFieldTypeLabels } from '@/types'
import {
  FieldSchemaSettings,
  FieldSchemaTarget,
  isFieldsOnlyModeEnabled,
  normalizeFieldSchemaSettings
} from '@/utils/hooks/field-schema'
import { useFieldSchema } from '@/utils/hooks/use-field-schema'
import { useFieldSchemaCommit } from '@/utils/hooks/use-field-schema-commit'
import { DeleteFieldDialog } from './delete-field-dialog'
import { FieldDialog } from './field-dialog'
import DeleteCollectionModal from '../collections/_components/delete-collection-modal'
import { useCollections, useOutstatic } from '@/utils/hooks'
import { DeleteDocumentButton } from '@/components/delete-document-button'
import { useSingletons } from '@/utils/hooks/use-singletons'
import { useRouter } from 'next/navigation'
import { reorderCustomFields } from './field-reorder'
import { Badge } from '@/components/ui/shadcn/badge'
import { Label } from '@/components/ui/shadcn/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/shadcn/select'
import { createCommitApi } from '@/utils/create-commit-api'
import { createOutstaticCommitMessage } from '@/utils/commit-message'
import { useCreateCommit } from '@/utils/hooks/use-create-commit'
import useOid from '@/utils/hooks/use-oid'
import { stringifyError } from '@/utils/errors/stringify-error'
import {
  getValidParentCollectionOptions,
  updateCollectionParent
} from '@/utils/collections/collection-tree'
import { toast } from 'sonner'

const NO_PARENT_COLLECTION_VALUE = '__none__'

type SortableFieldCardProps = {
  name: string
  field: CustomFieldsType[string]
  onEdit: () => void
  onDelete: () => void
}

const SortableFieldCard = ({
  name,
  field,
  onEdit,
  onDelete
}: SortableFieldCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: name
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`transition-[border-color,box-shadow] duration-150 hover:border-gray-500 ${isDragging ? 'z-10 border-gray-500 shadow-md' : ''}`}
    >
      <CardContent className="relative flex items-center justify-between max-w-sm gap-2 pl-2">
        <Button
          variant="ghost"
          size="icon"
          className="cursor-grab text-muted-foreground active:cursor-grabbing"
          type="button"
          aria-label={`Reorder ${field.title}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-6 h-6" />
        </Button>
        <button type="button" onClick={onEdit} className="text-left flex-1">
          <span className="block cursor-pointer font-bold tracking-tight text-foreground/90 capitalize hover:text-foreground mb-2">
            {field.title}
            <span className="absolute top-0 bottom-0 left-12 right-16"></span>
          </span>
          <Badge variant="outline">
            {customFieldTypeLabels[field.fieldType]}
          </Badge>
          {field.required ? <Badge>required</Badge> : null}
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="z-10"
          type="button"
          onClick={onDelete}
        >
          <span className="sr-only">Delete {field.title}</span>
          <Trash className="w-6 h-6" />
        </Button>
      </CardContent>
    </Card>
  )
}

type FieldManagementPageProps = {
  target: FieldSchemaTarget
  emptyStateSubject: 'collection' | 'singleton'
  canManage?: boolean
}

export const FieldManagementPage = ({
  target,
  emptyStateSubject,
  canManage = true
}: FieldManagementPageProps) => {
  const [customFields, setCustomFields] = useState<CustomFieldsType>({})
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedField, setSelectedField] = useState('')
  const [showDeleteContentModal, setShowDeleteContentModal] = useState(false)
  const [savedCustomFields, setSavedCustomFields] = useState<CustomFieldsType>(
    {}
  )
  const [hasPendingOrderChange, setHasPendingOrderChange] = useState(false)
  const [savingOrder, setSavingOrder] = useState(false)
  const [schemaSettings, setSchemaSettings] = useState<FieldSchemaSettings>({})
  const [pendingSchemaSettings, setPendingSchemaSettings] =
    useState<FieldSchemaSettings>({})
  const [savingSettings, setSavingSettings] = useState(false)
  const [pendingParent, setPendingParent] = useState<string | null>(null)
  const [savingParent, setSavingParent] = useState(false)
  const router = useRouter()
  const {
    dashboardRoute,
    ostContent,
    repoOwner,
    repoSlug,
    repoBranch,
    session
  } = useOutstatic()
  const fetchOid = useOid()
  const createCommit = useCreateCommit()
  const commitFieldSchema = useFieldSchemaCommit(target)
  const { data: schema, isLoading } = useFieldSchema({ target })
  const {
    data: collections,
    isPending: collectionsPending,
    refetch: refetchCollections
  } = useCollections({
    enabled: target.kind === 'collection'
  })

  const { data: singletons, refetch: refetchSingletons } = useSingletons({
    enabled: target.kind === 'singleton'
  })
  const singleton = singletons?.find((s) => s.slug === target.slug)
  const extension = singleton?.path?.endsWith('.mdx') ? 'mdx' : 'md'
  const collection = collections?.find((c) => c.slug === target.slug)
  const parentCollectionOptions = useMemo(() => {
    if (!collections || target.kind !== 'collection') {
      return []
    }

    return getValidParentCollectionOptions(collections, target.slug).sort(
      (a, b) => a.title.localeCompare(b.title)
    )
  }, [collections, target])
  const hasPendingParentChange =
    target.kind === 'collection' &&
    collection !== undefined &&
    pendingParent !== collection.parent

  useEffect(() => {
    if (collection) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPendingParent(collection.parent)
    }
  }, [collection?.slug, collection?.parent])

  useEffect(() => {
    if (schema) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCustomFields(schema.properties)
      setSavedCustomFields(schema.properties)
      setSchemaSettings(schema.settings ?? {})
      setPendingSchemaSettings(schema.settings ?? {})
      setHasPendingOrderChange(false)
    }
  }, [schema])

  const handleCommittedCustomFieldsChange = (fields: CustomFieldsType) => {
    setCustomFields(fields)
    setSavedCustomFields(fields)
    setHasPendingOrderChange(false)
  }

  const handleFieldReorder = ({
    activeFieldName,
    overFieldName
  }: {
    activeFieldName: string
    overFieldName?: string
  }) => {
    const nextCustomFields = reorderCustomFields({
      customFields,
      activeFieldName,
      overFieldName
    })

    if (nextCustomFields === customFields) {
      return
    }

    setCustomFields(nextCustomFields)
    setHasPendingOrderChange(true)
  }

  const handleCancelOrderChange = () => {
    setCustomFields(savedCustomFields)
    setHasPendingOrderChange(false)
  }

  const handleSaveOrderChange = async () => {
    if (savingOrder) {
      return
    }

    setSavingOrder(true)
    const didCommit = await commitFieldSchema({
      customFields,
      action: 'reorder',
      fieldName: 'field order'
    })
    setSavingOrder(false)

    if (!didCommit) {
      return
    }

    setSavedCustomFields(customFields)
    setHasPendingOrderChange(false)
  }

  const hasPendingSettingsChange =
    isFieldsOnlyModeEnabled(pendingSchemaSettings) !==
    isFieldsOnlyModeEnabled(schemaSettings)

  const handleSaveSettings = async () => {
    if (savingSettings) {
      return
    }

    setSavingSettings(true)
    const didCommit = await commitFieldSchema({
      customFields: savedCustomFields,
      settings: pendingSchemaSettings,
      action: 'settings',
      fieldName: 'editor settings'
    })
    setSavingSettings(false)

    if (!didCommit) {
      return
    }

    setSchemaSettings(pendingSchemaSettings)
  }

  const handleSaveParent = async () => {
    if (savingParent || !collection || target.kind !== 'collection') {
      return
    }

    setSavingParent(true)

    try {
      const [{ data: latestCollections }, oid] = await Promise.all([
        refetchCollections(),
        fetchOid()
      ])

      if (!latestCollections) {
        throw new Error('Failed to fetch collections')
      }

      if (!oid) {
        throw new Error('No oid found')
      }

      const owner = repoOwner || session?.user?.login || ''
      const updatedCollections = updateCollectionParent(
        latestCollections,
        collection.slug,
        pendingParent
      )

      const commitApi = createCommitApi({
        message: createOutstaticCommitMessage({
          scope: 'config',
          action: 'update',
          target: 'collection',
          label: collection.slug
        }),
        owner,
        oid,
        name: repoSlug,
        branch: repoBranch
      })

      commitApi.replaceFile(
        `${ostContent}/collections.json`,
        JSON.stringify(updatedCollections, null, 2) + '\n'
      )

      await toast.promise(createCommit.mutateAsync(commitApi.createInput()), {
        loading: 'Updating parent collection...',
        success: 'Parent collection updated',
        error: 'Failed to update parent collection'
      })

      await refetchCollections()
    } catch (error) {
      console.error('Failed to update parent collection', error)
      const errorToast = toast.error('Failed to update parent collection.', {
        action: {
          label: 'Copy Logs',
          onClick: () => {
            navigator.clipboard.writeText(`Error: ${stringifyError(error)}`)
            toast.message('Logs copied to clipboard', {
              id: errorToast
            })
          }
        }
      })
    } finally {
      setSavingParent(false)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    if (savingOrder) {
      return
    }

    handleFieldReorder({
      activeFieldName: String(event.active.id),
      overFieldName: event.over ? String(event.over.id) : undefined
    })
  }

  if (!canManage) {
    return (
      <AdminLayout title="Add Custom Fields">
        <div className="mb-4 flex h-12 items-center">
          <h1 className="mr-4 text-2xl">
            You are not authorized to access this page
          </h1>
        </div>
      </AdminLayout>
    )
  }

  if (isLoading || (target.kind === 'collection' && collectionsPending)) {
    return <AdminLoading />
  }

  return (
    <AdminLayout title="Add Custom Fields">
      <div className="mb-4 flex h-12 items-center">
        <h1 className="text-2xl">{target.title} Settings</h1>
      </div>

      <div className="space-y-10">
        <div className="flex flex-1 flex-col space-y-6">
          <div className="relative max-w-5xl w-full">
            {hasPendingOrderChange ? (
              <div className="absolute inset-x-0 -top-[10px] z-20 flex flex-col gap-3 rounded-md bg-background py-3 sm:flex-row sm:items-center sm:justify-between border border-border px-4">
                <p className="text-base">Custom fields order modified.</p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    type="button"
                    disabled={savingOrder}
                    onClick={handleCancelOrderChange}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    disabled={savingOrder}
                    onClick={handleSaveOrderChange}
                  >
                    {savingOrder ? (
                      <>
                        <SpinnerIcon className="mr-2 text-background" />
                        Saving
                      </>
                    ) : (
                      'Save changes'
                    )}
                  </Button>
                </div>
              </div>
            ) : null}
            <div className="flex items-center">
              <h2 className="mr-4 text-xl">Custom Fields</h2>
              {Object.keys(customFields).length > 0 ? (
                <Button onClick={() => setShowAddModal(true)}>
                  Add Custom Field
                </Button>
              ) : null}
            </div>
          </div>
          {Object.keys(customFields).length === 0 ? (
            <div className="max-w-2xl">
              <Card>
                <CardHeader>
                  <CardTitle>
                    Add Custom Fields to your {emptyStateSubject}.
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm dark:prose-invert">
                  <p>
                    Create your first Custom Field by clicking the button below.
                  </p>

                  <div>
                    <Button onClick={() => setShowAddModal(true)}>
                      Add Custom Field
                    </Button>
                  </div>
                  <p>
                    To learn more about how Custom Fields work checkout{' '}
                    <a
                      href="https://outstatic.com/docs/custom-fields"
                      target="_blank"
                      rel="noreferrer"
                    >
                      the docs
                    </a>
                    .
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <DndContext
              modifiers={[restrictToParentElement]}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={Object.keys(customFields)}>
                <div className="max-w-5xl w-full grid grid-cols-3 gap-6">
                  {Object.entries(customFields).map(([name, field]) => {
                    return (
                      <SortableFieldCard
                        key={name}
                        name={name}
                        field={field}
                        onEdit={() => {
                          setSelectedField(name)
                          setShowEditModal(true)
                        }}
                        onDelete={() => {
                          setSelectedField(name)
                          setShowDeleteModal(true)
                        }}
                      />
                    )
                  })}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
        {target.kind === 'collection' && collection ? (
          <div className="flex flex-1 max-w-2xl flex-col space-y-6">
            <div className="flex items-center">
              <h2 className="text-xl">Collection</h2>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Parent collection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="parent-collection">Parent collection</Label>
                  <Select
                    value={pendingParent ?? NO_PARENT_COLLECTION_VALUE}
                    disabled={savingParent}
                    onValueChange={(value) => {
                      setPendingParent(
                        value === NO_PARENT_COLLECTION_VALUE ? null : value
                      )
                    }}
                  >
                    <SelectTrigger id="parent-collection" className="w-full">
                      <SelectValue placeholder="Select a parent collection" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_PARENT_COLLECTION_VALUE}>
                        None
                      </SelectItem>
                      {parentCollectionOptions.map((parentOption) => (
                        <SelectItem
                          key={parentOption.slug}
                          value={parentOption.slug}
                        >
                          {parentOption.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Nest this collection under another in the sidebar. You
                    cannot select the collection itself or its descendants.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="justify-start">
                <Button
                  type="button"
                  disabled={
                    !hasPendingParentChange ||
                    savingParent ||
                    hasPendingOrderChange
                  }
                  onClick={handleSaveParent}
                >
                  {savingParent ? (
                    <>
                      <SpinnerIcon className="mr-2 text-background" />
                      Updating
                    </>
                  ) : (
                    'Update'
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        ) : null}
        <div className="flex flex-1 max-w-2xl flex-col space-y-6">
          <div className="flex items-center">
            <h2 className="text-xl">Editor</h2>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Fields only mode</CardTitle>
            </CardHeader>
            <CardContent>
              <label className="flex items-start gap-3">
                <Checkbox
                  checked={isFieldsOnlyModeEnabled(pendingSchemaSettings)}
                  disabled={savingSettings}
                  onCheckedChange={(checked) => {
                    setPendingSchemaSettings(
                      (current) =>
                        normalizeFieldSchemaSettings({
                          ...current,
                          fieldsOnlyMode: checked === true
                        }) ?? {}
                    )
                  }}
                  aria-label="Fields only mode"
                />
                <span className="flex flex-col gap-1">
                  <span className="font-medium">Fields only mode</span>
                  <span className="text-sm text-muted-foreground">
                    Disable the block editor for this {emptyStateSubject}.
                  </span>
                </span>
              </label>
            </CardContent>
            <CardFooter className="justify-start">
              <Button
                type="button"
                disabled={
                  !hasPendingSettingsChange ||
                  savingSettings ||
                  hasPendingOrderChange
                }
                onClick={handleSaveSettings}
              >
                {savingSettings ? (
                  <>
                    <SpinnerIcon className="mr-2 text-background" />
                    Updating
                  </>
                ) : (
                  'Update'
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
        <div className="flex flex-1 max-w-2xl flex-col space-y-6">
          <div className="flex items-center">
            <h2 className="text-xl">Danger Zone</h2>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>
                Delete {target.title}{' '}
                {target.kind === 'collection' ? 'collection' : 'singleton'}
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert">
              <p>
                Delete the <span className="font-bold">{target.title}</span>{' '}
                {target.kind === 'collection' ? 'collection' : 'singleton'} and
                all its content.
              </p>
              <p>This action cannot be undone.</p>
            </CardContent>
            <CardFooter>
              {collection ? (
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteContentModal(true)}
                >
                  Delete {target.title}
                </Button>
              ) : (
                <DeleteDocumentButton
                  icon={false}
                  slug={target.slug}
                  extension={extension}
                  collection={'_singletons'}
                  title={target.title}
                  onComplete={() => {
                    refetchSingletons()
                    router.push(`${dashboardRoute}`)
                    setShowDeleteContentModal(false)
                  }}
                />
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
      {showAddModal ? (
        <FieldDialog
          mode="add"
          open={showAddModal}
          onOpenChange={setShowAddModal}
          target={target}
          customFields={customFields}
          setCustomFields={handleCommittedCustomFieldsChange}
        />
      ) : null}

      {showEditModal ? (
        <FieldDialog
          mode="edit"
          open={showEditModal}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedField('')
            }
            setShowEditModal(open)
          }}
          target={target}
          customFields={customFields}
          setCustomFields={handleCommittedCustomFieldsChange}
          selectedField={selectedField}
        />
      ) : null}

      {showDeleteModal ? (
        <DeleteFieldDialog
          open={showDeleteModal}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedField('')
            }
            setShowDeleteModal(open)
          }}
          target={target}
          selectedField={selectedField}
          customFields={customFields}
          setCustomFields={handleCommittedCustomFieldsChange}
        />
      ) : null}

      {showDeleteContentModal && collection ? (
        <DeleteCollectionModal
          setShowDeleteModal={setShowDeleteContentModal}
          collection={collection}
        />
      ) : null}
    </AdminLayout>
  )
}
