import { AdminLayout } from '@/components'
import Alert from '@/components/Alert'
import Modal from '@/components/Modal'
import TagInput from '@/components/TagInput'
import LineBackground from '@/components/ui/outstatic/line-background'
import { Button } from '@/components/ui/shadcn/button'
import { Card, CardContent } from '@/components/ui/shadcn/card'
import { Input } from '@/components/ui/shadcn/input'
import { CustomField, CustomFields, customFieldTypes } from '@/types'
import { createCommitApi } from '@/utils/createCommitApi'
import { useCreateCommit } from '@/utils/hooks/useCreateCommit'
import { useGetCollectionSchema } from '@/utils/hooks/useGetCollectionSchema'
import useOid from '@/utils/hooks/useOid'
import useOutstatic from '@/utils/hooks/useOutstatic'
import { yupResolver } from '@hookform/resolvers/yup'
import camelCase from 'camelcase'
import { useEffect, useState } from 'react'
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as yup from 'yup'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/shadcn/select'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage
} from '@/components/ui/shadcn/form'
import { SpinnerIcon } from '@/components/ui/outstatic/spinner-icon'
import { Trash } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

type AddCustomFieldProps = {
  collection: string
}

type CustomFieldForm = CustomField<
  'string' | 'number' | 'array' | 'boolean'
> & { name: string }

const fieldDataMap = {
  Text: 'string',
  String: 'string',
  Number: 'number',
  Tags: 'array',
  Boolean: 'boolean'
} as const

export default function AddCustomField({ collection }: AddCustomFieldProps) {
  const {
    session,
    repoSlug,
    repoBranch,
    repoOwner,
    ostContent,
    setHasChanges
  } = useOutstatic()
  const queryClient = useQueryClient()
  const createCommit = useCreateCommit()
  const fetchOid = useOid()
  const [customFields, setCustomFields] = useState<CustomFields>({})
  const yupSchema = yup.object().shape({
    title: yup
      .string()
      .matches(/^[aA-zZ\s]+$/, 'Only alphabets are allowed for this field.')
      .required('Custom field name is required.'),
    fieldType: yup
      .string()
      .oneOf([...customFieldTypes])
      .required(),
    description: yup.string(),
    required: yup.boolean().required()
  })
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const methods = useForm<CustomFieldForm>({
    mode: 'onChange',
    // @ts-ignore
    resolver: yupResolver(yupSchema)
  })
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const { data: schema, isLoading } = useGetCollectionSchema({ collection })
  const [selectedField, setSelectedField] = useState('')
  const [fieldName, setFieldName] = useState('')

  const capiHelper = async ({
    customFields,
    deleteField = false
  }: {
    customFields: any
    deleteField?: boolean
  }) => {
    try {
      const oid = await fetchOid()
      const customFieldsJSON = JSON.stringify(
        {
          title: collection,
          type: 'object',
          path: schema?.path,
          properties: { ...customFields }
        },
        null,
        2
      )

      const capi = createCommitApi({
        message: `feat(${collection}): ${
          deleteField ? 'delete' : 'add'
        } ${fieldName} field`,
        owner: repoOwner || session?.user?.login || '',
        oid: oid ?? '',
        name: repoSlug,
        branch: repoBranch
      })

      capi.replaceFile(
        `${ostContent}/${collection}/schema.json`,
        customFieldsJSON + '\n'
      )

      const input = capi.createInput()

      toast.promise(createCommit.mutateAsync(input), {
        loading: `${
          deleteField ? 'Deleting' : selectedField ? 'Editing' : 'Adding'
        } field...`,
        success: `Field ${
          deleteField ? 'deleted' : selectedField ? 'edited' : 'added'
        } successfully`,
        error: `Failed to ${
          deleteField ? 'delete' : selectedField ? 'edit' : 'add'
        } field`
      })

      if (createCommit.isError) {
        throw new Error(
          `Failed to ${
            deleteField ? 'delete' : selectedField ? 'edit' : 'add'
          } field`
        )
      }

      const filePath = `${repoBranch}:${ostContent}/${collection}/schema.json`
      await queryClient.invalidateQueries({
        queryKey: ['collection-schema', { filePath }]
      })
    } catch (error) {
      console.error('Error in capiHelper:', error)
      return false
    }
  }

  const onSubmit: SubmitHandler<CustomFieldForm> = async (
    data: CustomFieldForm
  ) => {
    setAdding(true)
    const { title, fieldType, ...rest } = data
    const fieldName = camelCase(title)

    if (!selectedField && customFields[fieldName]) {
      methods.setError('title', {
        type: 'manual',
        message: 'Field name is already taken.'
      })
      setAdding(false)
      return
    }

    try {
      customFields[fieldName] = {
        ...rest,
        fieldType,
        dataType: fieldDataMap[fieldType],
        title: data.title
      }

      if (fieldDataMap[fieldType] === 'array') {
        customFields[fieldName] = {
          ...customFields[fieldName],
          // @ts-ignore
          values: data?.values || []
        }
      }

      await capiHelper({ customFields })
    } catch (error) {
      // TODO: Better error treatment
      setError('add')
      console.log({ error })
    }

    setHasChanges(false)
    setSelectedField('')
    setShowAddModal(false)
    setAdding(false)
  }

  const deleteField = async (name: string) => {
    setDeleting(true)

    try {
      let newCustomFields = { ...customFields }
      delete newCustomFields[name]
      await capiHelper({
        customFields: newCustomFields,
        deleteField: true
      })
      setCustomFields(newCustomFields)
    } catch (error) {
      // TODO: Better error treatment
      setError('delete')
      console.log({ error })
    }
    setSelectedField('')
    setShowDeleteModal(false)
    setDeleting(false)
    setHasChanges(false)
  }

  useEffect(() => {
    if (schema) {
      setCustomFields(schema.properties)
    }
  }, [schema])

  useEffect(() => {
    const subscription = methods.watch(() => setHasChanges(true))
    return () => subscription.unsubscribe()
  }, [methods])

  return (
    <AdminLayout title="Add Custom Fields">
      <FormProvider {...methods}>
        <div className="mb-8 flex h-12 items-center">
          <h1 className="mr-12 text-2xl">
            <span className="capitalize">{collection}</span> Fields
          </h1>
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
                  <div className="mb-20 max-w-2xl p-8 px-4 md:p-8 text-black bg-white rounded-lg border border-gray-200 shadow-md prose prose-base">
                    <h3>Add Custom Fields to your collections.</h3>
                    <p>
                      Create your first Custom Field by clicking the button
                      below.
                    </p>

                    <Button
                      onClick={() => {
                        setShowAddModal(true)
                      }}
                    >
                      Add Custom Field
                    </Button>
                    <p>
                      To learn more about how Custom Fields work checkout{' '}
                      <a
                        href="https://outstatic.com/docs/custom-fields"
                        target="_blank"
                        rel="noreferrer"
                      >
                        the docs.
                      </a>
                      .
                    </p>
                  </div>
                </div>
              </LineBackground>
            ) : (
              <>
                <div className="max-w-5xl w-full grid grid-cols-3 gap-6">
                  {customFields &&
                    Object.entries(customFields).map(([name, field]) => {
                      return (
                        <Card key={name}>
                          <CardContent className="relative flex p-6 justify-between items-center max-w-sm">
                            <button
                              type="button"
                              onClick={() => {
                                methods.reset()
                                setSelectedField(name)
                                setShowAddModal(true)
                              }}
                              className="text-left"
                            >
                              <span className="block text-xl cursor-pointer font-bold tracking-tight text-gray-900 capitalize hover:text-blue-500 mb-2">
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
        {error ? (
          <div className="mt-8">
            <Alert type="error">
              <>
                <span className="font-medium">Oops!</span> We are unable to{' '}
                {error} your custom field.
              </>
            </Alert>
          </div>
        ) : null}
        {showAddModal && (
          <Modal
            title={
              selectedField
                ? `Edit ${customFields[selectedField].title}`
                : `Add Custom Field to ${collection}`
            }
            close={() => {
              setHasChanges(false)
              setSelectedField('')
              setShowAddModal(false)
            }}
          >
            <form onSubmit={methods.handleSubmit(onSubmit)}>
              {!!selectedField ? (
                <div className="pt-6 pl-6">
                  <Alert type="info">
                    <>
                      <span className="font-medium">Field name</span> and{' '}
                      <span className="font-medium">Field type</span> editing is
                      disabled to avoid data conflicts.
                    </>
                  </Alert>
                </div>
              ) : null}
              <div
                key={selectedField}
                className={`flex p-6 text-left gap-4 ${
                  !!selectedField
                    ? 'pt-0 opacity-50 cursor-not-allowed pointer-events-none hidden'
                    : ''
                }`}
              >
                <FormField
                  control={methods.control}
                  name="title"
                  defaultValue={
                    selectedField ? customFields[selectedField].title : ''
                  }
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Field name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Category"
                          {...field}
                          className="w-full max-w-sm md:w-80"
                          readOnly={!!selectedField}
                          autoFocus={!selectedField}
                          onChange={(e) => {
                            field.onChange(e)
                            setFieldName(camelCase(e.target.value))
                          }}
                        />
                      </FormControl>
                      <FormDescription>The name of the field</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="mb-5">
                  <FormField
                    control={methods.control}
                    name="fieldType"
                    defaultValue={
                      selectedField
                        ? customFields[selectedField].fieldType
                        : 'String'
                    }
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Field type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={
                            selectedField
                              ? customFields[selectedField].fieldType
                              : 'String'
                          }
                        >
                          <FormControl>
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Select field type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {customFieldTypes.map((type) => (
                              <SelectItem
                                key={type}
                                value={type}
                                disabled={!!selectedField}
                              >
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex px-6 text-left gap-4 mb-4">
                <FormField
                  control={methods.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Add a category"
                          {...field}
                          className="w-full max-w-sm md:w-80"
                          defaultValue={
                            selectedField
                              ? customFields[selectedField].description
                              : ''
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        This will be the label of the field
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <fieldset>
                  <div className="flex mt-7">
                    <div className="flex items-center h-5">
                      <input
                        {...methods.register('required')}
                        id="required"
                        type="checkbox"
                        className="cursor-pointer w-4 h-4 text-blue-600 bg-gray-100 rounded border-gray-300 focus:ring-blue-500 focus:ring-2"
                        defaultChecked={
                          selectedField
                            ? customFields[selectedField].required
                            : false
                        }
                      />
                    </div>
                    <div className="ml-2 text-sm">
                      <label
                        htmlFor="required"
                        className="cursor-pointer text-sm font-medium text-gray-900"
                      >
                        Required field
                      </label>
                      <FormDescription>
                        This field must be filled out to save the document
                      </FormDescription>
                    </div>
                  </div>
                </fieldset>
              </div>
              {selectedField &&
              customFields[selectedField].fieldType === 'Tags' &&
              customFields[selectedField].dataType === 'array' ? (
                <div className="flex px-6 text-left gap-4 mb-4">
                  <TagInput
                    label="Your tags"
                    id="values"
                    helperText="Deleting tags will remove them from suggestions, not from existing documents."
                    //@ts-ignore
                    defaultValue={customFields[selectedField].values || []}
                    noOptionsMessage={() => null}
                    isClearable={false}
                    isSearchable={false}
                    components={{
                      DropdownIndicator: () => null,
                      IndicatorSeparator: () => null
                    }}
                  />
                </div>
              ) : null}
              <div className="space-x-2 rounded-b border-t p-6 text-sm text-gray-700">
                This field will be accessible on the frontend as:{'  '}
                <code className="bg-gray-200 font-semibold">
                  {selectedField ? selectedField : fieldName}
                </code>
              </div>
              <div className="flex items-center justify-end space-x-2 rounded-b border-t p-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setHasChanges(false)
                    setSelectedField('')
                    setShowAddModal(false)
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={adding}>
                  {adding ? (
                    <>
                      <SpinnerIcon className="text-background mr-2" />
                      {selectedField ? 'Editing' : 'Adding'}
                    </>
                  ) : selectedField ? (
                    'Edit'
                  ) : (
                    'Add'
                  )}
                </Button>
              </div>
            </form>
          </Modal>
        )}
        {showDeleteModal && (
          <Modal
            title={`Delete ${customFields[selectedField].title} Field`}
            close={() => {
              setShowDeleteModal(false)
              setSelectedField('')
            }}
          >
            <div className="space-y-6 p-6 text-left">
              <p className="text-base leading-relaxed text-gray-500">
                Are you sure you want to delete the{' '}
                {customFields[selectedField].title} field?
              </p>
              <p className="text-base leading-relaxed text-gray-500">
                This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center space-x-2 rounded-b border-t p-6 justify-end">
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedField('')
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={deleting}
                onClick={() => {
                  setDeleting(true)
                  deleteField(selectedField)
                }}
              >
                {deleting ? (
                  <>
                    <SpinnerIcon className="text-background mr-2" />
                    Deleting
                  </>
                ) : (
                  'Delete'
                )}
              </Button>
            </div>
          </Modal>
        )}
      </FormProvider>
    </AdminLayout>
  )
}
