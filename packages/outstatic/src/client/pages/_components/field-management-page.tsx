import { useEffect, useState } from 'react'
import { Trash } from 'lucide-react'
import { AdminLayout } from '@/components/admin-layout'
import { AdminLoading } from '@/components/admin-loading'
import LineBackground from '@/components/ui/outstatic/line-background'
import { Button } from '@/components/ui/shadcn/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/shadcn/card'
import { CustomFieldsType } from '@/types'
import { FieldSchemaTarget } from '@/utils/hooks/field-schema'
import { useFieldSchema } from '@/utils/hooks/use-field-schema'
import { DeleteFieldDialog } from './delete-field-dialog'
import { FieldDialog } from './field-dialog'
import DeleteCollectionModal from '../collections/_components/delete-collection-modal'
import { useCollections, useOutstatic } from '@/utils/hooks'
import { DeleteDocumentButton } from '@/components/delete-document-button'
import { useSingletons } from '@/utils/hooks/use-singletons'
import { useRouter } from 'next/navigation'

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
  const router = useRouter()
  const { dashboardRoute } = useOutstatic()
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
    }
  }, [schema])

  if (!canManage) {
    return (
      <AdminLayout title="Add Custom Fields">
        <div className="mb-8 flex h-12 items-center">
          <h1 className="mr-12 text-2xl">
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
      <div className="mb-8 flex h-12 items-center">
        <h1 className="text-2xl">{target.title} Settings</h1>
      </div>

      <div className="space-y-10">
        <div className="flex flex-1 flex-col space-y-6">
          <div className="flex items-center">
            <h2 className="mr-12 text-xl">Custom Fields</h2>
            {Object.keys(customFields).length > 0 ? (
              <Button onClick={() => setShowAddModal(true)}>
                Add Custom Field
              </Button>
            ) : null}
          </div>
          {Object.keys(customFields).length === 0 ? (
            <LineBackground>
              <div className="relative">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Add Custom Fields to your {emptyStateSubject}.
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="prose prose-sm dark:prose-invert">
                    <p>
                      Create your first Custom Field by clicking the button
                      below.
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
            </LineBackground>
          ) : (
            <div className="max-w-5xl w-full grid grid-cols-3 gap-6">
              {Object.entries(customFields).map(([name, field]) => {
                return (
                  <Card
                    key={name}
                    className="hover:border-gray-500 transition-all duration-300"
                  >
                    <CardContent className="relative flex justify-between items-center max-w-sm">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedField(name)
                          setShowEditModal(true)
                        }}
                        className="text-left"
                      >
                        <span className="block text-xl cursor-pointer font-bold tracking-tight text-foreground/90 capitalize hover:text-foreground mb-2">
                          {field.title}
                          <span className="absolute top-0 bottom-0 left-0 right-16"></span>
                        </span>
                        <span className="bg-blue-100 text-blue-800 text-sm font-medium mr-2 px-2.5 py-0.5 rounded">
                          {field.fieldType}
                        </span>
                        {field.required ? (
                          <span className="bg-red-100 text-red-800 text-sm font-medium mr-2 px-2.5 py-0.5 rounded">
                            required
                          </span>
                        ) : null}
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="z-10"
                        type="button"
                        onClick={() => {
                          setSelectedField(name)
                          setShowDeleteModal(true)
                        }}
                      >
                        <span className="sr-only">Delete content</span>
                        <Trash className="w-6 h-6" />
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
        <div className="flex flex-1 max-w-2xl flex-col space-y-6 relative z-10">
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
          setCustomFields={setCustomFields}
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
          setCustomFields={setCustomFields}
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
          setCustomFields={setCustomFields}
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
