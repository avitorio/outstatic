import { AdminLayout } from '@/components'
import { AdminLoading } from '@/components/AdminLoading'
import LineBackground from '@/components/ui/outstatic/line-background'
import { Button } from '@/components/ui/shadcn/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/shadcn/card'
import { CustomFieldType, CustomFieldsType } from '@/types'
import { useGetCollectionSchema } from '@/utils/hooks/useGetCollectionSchema'
import { addCustomFieldSchema } from '@/utils/schemas/add-custom-field-schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { Trash } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { AddCustomFieldDialog } from './_components/add-custom-field-dialog'
import { DeleteCustomFieldDialog } from './_components/delete-custom-field-dialog'
import { EditCustomFieldDialog } from './_components/edit-custom-field-dialog'

type CustomFieldsProps = {
  collection: string
  title: string
}

type CustomFieldForm = CustomFieldType<
  'string' | 'number' | 'array' | 'boolean'
> & { name: string }

export default function CustomFields({ collection, title }: CustomFieldsProps) {
  const [customFields, setCustomFields] = useState<CustomFieldsType>({})
  const methods = useForm<CustomFieldForm>({
    mode: 'onChange',
    // @ts-ignore
    resolver: zodResolver(addCustomFieldSchema)
  })
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const [selectedField, setSelectedField] = useState('')
  const [fieldName, setFieldName] = useState('')

  const { data: schema, isLoading } = useGetCollectionSchema({ collection })

  useEffect(() => {
    if (schema) {
      setCustomFields(schema.properties)
    }
  }, [schema])

  if (isLoading) {
    return <AdminLoading />
  }

  return (
    <AdminLayout title="Add Custom Fields">
      <div className="mb-8 flex h-12 items-center">
        <h1 className="mr-12 text-2xl">{title} Fields</h1>
        {Object.keys(customFields).length > 0 ? (
          <Button
            onClick={() => {
              methods.reset()
              setShowAddModal(true)
            }}
          >
            Add Custom Field
          </Button>
        ) : null}
      </div>
      {!isLoading ? (
        <>
          {Object.keys(customFields).length === 0 ? (
            <LineBackground>
              <div className="relative">
                <Card>
                  <CardHeader>
                    <CardTitle>Add Custom Fields to your collection.</CardTitle>
                  </CardHeader>
                  <CardContent className="prose dark:prose-invert">
                    <p>
                      Create your first Custom Field by clicking the button
                      below.
                    </p>

                    <div>
                      <Button
                        onClick={() => {
                          setShowAddModal(true)
                        }}
                      >
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
            <>
              <div className="max-w-5xl w-full grid grid-cols-3 gap-6">
                {customFields &&
                  Object.entries(customFields).map(([name, field]) => {
                    return (
                      <Card
                        key={name}
                        className="hover:border-gray-500 transition-all duration-300"
                      >
                        <CardContent className="relative flex justify-between items-center max-w-sm">
                          <button
                            type="button"
                            onClick={() => {
                              methods.reset()
                              setSelectedField(name)
                              if (customFields[name]) {
                                setShowEditModal(true)
                              } else {
                                setShowAddModal(true)
                              }
                            }}
                            className="text-left"
                          >
                            <span className="block text-xl cursor-pointer font-bold tracking-tight text-foreground/90 capitalize hover:text-foreground mb-2">
                              {field.title}
                              {/* This span allows for full card click */}
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
                              setShowDeleteModal(true)
                              setSelectedField(name)
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
            </>
          )}
        </>
      ) : null}
      {showAddModal && (
        <AddCustomFieldDialog
          collection={collection}
          showAddModal={showAddModal}
          setShowAddModal={setShowAddModal}
          customFields={customFields}
          setCustomFields={setCustomFields}
        />
      )}
      {showEditModal && (
        <EditCustomFieldDialog
          collection={collection}
          showEditModal={showEditModal}
          setShowEditModal={setShowEditModal}
          selectedField={selectedField}
          customFields={customFields}
          setCustomFields={setCustomFields}
        />
      )}
      {showDeleteModal && (
        <DeleteCustomFieldDialog
          collection={collection}
          showDeleteModal={showDeleteModal}
          setShowDeleteModal={setShowDeleteModal}
          fieldName={fieldName}
          setFieldName={setFieldName}
          selectedField={selectedField}
          setSelectedField={setSelectedField}
          customFields={customFields}
          setCustomFields={setCustomFields}
        />
      )}
    </AdminLayout>
  )
}
