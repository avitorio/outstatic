import { type DragEndEvent, DndContext } from '@dnd-kit/core'
import { restrictToParentElement } from '@dnd-kit/modifiers'
import { SortableContext, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useEffect, useState } from 'react'
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
import { SpinnerIcon } from '@/components/ui/outstatic/spinner-icon'
import { CustomFieldsType } from '@/types'
import { FieldSchemaTarget } from '@/utils/hooks/field-schema'
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
          <Badge variant="outline">{field.fieldType}</Badge>
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
  const router = useRouter()
  const { dashboardRoute } = useOutstatic()
  const commitFieldSchema = useFieldSchemaCommit(target)
  const { data: schema, isLoading } = useFieldSchema({ target })
  const { data: collections, isPending: collectionsPending } = useCollections({
    enabled: target.kind === 'collection'
  })

  const { data: singletons, refetch: refetchSingletons } = useSingletons({
    enabled: target.kind === 'singleton'
  })
  const singleton = singletons?.find((s) => s.slug === target.slug)
  const extension = singleton?.path?.endsWith('.mdx') ? 'mdx' : 'md'
  const collection = collections?.find((c) => c.slug === target.slug)

  useEffect(() => {
    if (schema) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCustomFields(schema.properties)
      setSavedCustomFields(schema.properties)
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
