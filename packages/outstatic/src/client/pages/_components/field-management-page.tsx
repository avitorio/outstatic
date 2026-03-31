import { useEffect, useState } from 'react'
import { Trash } from 'lucide-react'
import { AdminLayout } from '@/components/admin-layout'
import { AdminLoading } from '@/components/admin-loading'
import LineBackground from '@/components/ui/outstatic/line-background'
import { Button } from '@/components/ui/shadcn/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/shadcn/card'
import { CustomFieldsType } from '@/types'
import { FieldSchemaTarget } from '@/utils/hooks/field-schema'
import { useFieldSchema } from '@/utils/hooks/use-field-schema'
import { DeleteFieldDialog } from './delete-field-dialog'
import { FieldDialog } from './field-dialog'

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

  const { data: schema, isLoading } = useFieldSchema({ target })

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

  if (isLoading) {
    return <AdminLoading />
  }

  return (
    <AdminLayout title="Add Custom Fields">
      <div className="mb-8 flex h-12 items-center">
        <h1 className="mr-12 text-2xl">{target.title} Fields</h1>
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
              <CardContent className="prose dark:prose-invert">
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
    </AdminLayout>
  )
}
