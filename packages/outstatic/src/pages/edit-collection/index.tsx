import { yupResolver } from '@hookform/resolvers/yup'
import Link from 'next/link'
import { useContext, useEffect, useState } from 'react'
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form'
import capitalize from 'capitalize'
import * as yup from 'yup'
import { AdminLayout, Input } from '../../components'
import Alert from '../../components/Alert'
import Modal from '../../components/Modal'
import { OutstaticContext } from '../../context'
import { useCreateCommitMutation } from '../../graphql/generated'
import {
  Collection,
  CustomField,
  CustomFields,
  customFieldTypes
} from '../../types'
import useFileQuery from '../../utils/useFileQuery'
import useNavigationLock from '../../utils/useNavigationLock'
import useOid from '../../utils/useOid'
import { customFieldCommitInput } from '../../utils/customFieldCommitInput'

type EditCollectionProps = {
  collection: string
}

type CustomFieldForm = CustomField & { name: string }

export default function EditCollection({ collection }: EditCollectionProps) {
  const {
    contentPath,
    monorepoPath,
    session,
    repoSlug,
    repoBranch,
    repoOwner
  } = useContext(OutstaticContext)
  const [createCommit] = useCreateCommitMutation()
  const fetchOid = useOid()
  const [hasChanges, setHasChanges] = useState(false)
  const createCollection: yup.SchemaOf<Collection> = yup.object().shape({
    name: yup
      .string()
      .matches(/^[aA-zZ\s]+$/, 'Only alphabets are allowed for this field.')
      .required('Custom field name is required.')
  })
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState(false)
  const methods = useForm<CustomFieldForm>({
    resolver: yupResolver(createCollection)
  })
  const [showAddFieldModal, setShowAddFieldModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [customFields, setCustomFields] = useState<CustomFields>({})
  const { data: schemaQueryData } = useFileQuery({
    file: `${collection}/schema.json`
  })
  const [selectedField, setSelectedField] = useState('')

  const onSubmit: SubmitHandler<CustomFieldForm> = async (
    data: CustomFieldForm
  ) => {
    setAdding(true)
    setHasChanges(false)

    // TODO: convert name to camelCase
    // Check if name is already taken

    try {
      const { name, ...rest } = data
      const oid = await fetchOid()
      const owner = repoOwner || session?.user?.login || ''
      customFields[name] = { ...rest }
      const customFieldsJSON = JSON.stringify(customFields, null, 2)
      const commitInput = customFieldCommitInput({
        owner,
        oid,
        fieldName: name,
        customFieldsJSON,
        repoSlug,
        repoBranch,
        contentPath,
        monorepoPath,
        collection
      })
      const created = await createCommit({ variables: commitInput })
      if (created) {
        setCustomFields({ ...customFields })
        setSelectedField('')
      }
      setShowAddFieldModal(false)
    } catch (error) {
      // TODO: Better error treatment
      setAdding(false)
      setHasChanges(false)
      setError(true)
      setShowAddFieldModal(false)
      console.log({ error })
    }
  }

  useEffect(() => {
    const documentQueryObject = schemaQueryData?.repository?.object
    if (documentQueryObject?.__typename === 'Blob') {
      console.log(documentQueryObject.text)
      const schema = JSON.parse(documentQueryObject?.text || '{}')
      setCustomFields(schema)
    }
  }, [schemaQueryData])

  useEffect(() => {
    const subscription = methods.watch(() => setHasChanges(true))
    return () => subscription.unsubscribe()
  }, [methods])

  // Ask for confirmation before leaving page if changes were made.
  useNavigationLock(hasChanges)

  return (
    <FormProvider {...methods}>
      <AdminLayout title="New Collection">
        <div className="mb-8 flex h-12 items-center">
          <h1 className="mr-12 text-2xl">
            Edit <span className="capitalize">{collection}</span> Collection
          </h1>
          <button
            type="button"
            onClick={() => {
              methods.reset()
              setShowAddFieldModal(true)
            }}
          >
            <div className="cursor-pointer rounded-lg border px-5 py-2.5 text-sm font-medium focus:outline-none focus:ring-4 border-gray-600 bg-gray-800 text-white hover:border-gray-600 hover:bg-gray-700 focus:ring-gray-700 no-underline">
              Add Custom Field
            </div>
          </button>
        </div>
        <div className="max-w-5xl w-full grid grid-cols-3 gap-6">
          {customFields &&
            Object.entries(customFields).map(([name, field]) => {
              return (
                <div
                  key={name}
                  className="relative flex p-6 justify-between items-center max-w-sm bg-white rounded-lg border border-gray-200 shadow-md hover:bg-slate-100"
                >
                  <button
                    type="button"
                    onClick={() => {
                      methods.reset()
                      setSelectedField(name)
                      setShowAddFieldModal(true)
                    }}
                    className="text-left"
                  >
                    <span className="block text-xl cursor-pointer font-bold tracking-tight text-gray-900 capitalize hover:text-blue-500 mb-2">
                      {/* TODO: convert camelCase to name */}
                      {name}
                      <span className="absolute top-0 bottom-0 left-0 right-16"></span>
                    </span>
                    <span className="bg-blue-100 text-blue-800 text-sm font-medium mr-2 px-2.5 py-0.5 rounded">
                      Type: {field.type}
                    </span>
                    {field.required ? (
                      <span className="bg-red-100 text-red-800 text-sm font-medium mr-2 px-2.5 py-0.5 rounded">
                        Required
                      </span>
                    ) : null}
                  </button>
                  <button
                    className="z-10 inline-block text-gray-500 hover:bg-white focus:ring-4 focus:outline-none focus:ring-gray-200 rounded-lg text-sm p-1.5"
                    type="button"
                    onClick={() => {
                      setShowDeleteModal(true)
                      setSelectedField(name)
                    }}
                  >
                    <span className="sr-only">Delete content</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="24"
                      height="24"
                    >
                      <path fill="none" d="M0 0h24v24H0z" />
                      <path d="M17 6h5v2h-2v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8H2V6h5V3a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v3zm1 2H6v12h12V8zm-9 3h2v6H9v-6zm4 0h2v6h-2v-6zM9 4v2h6V4H9z" />
                    </svg>
                  </button>
                </div>
              )
            })}
        </div>
        {error ? (
          <Alert type="error">
            <span className="font-medium">Oops!</span> We couldn&apos;t create
            your custom field. Please, make sure your settings are correct by{' '}
            <Link href="/outstatic/settings">
              <span className="underline">clicking here</span>
            </Link>{' '}
            .
          </Alert>
        ) : null}
        {showAddFieldModal && (
          <Modal
            title={`Add Field to ${capitalize(collection)}`}
            close={() => {
              setHasChanges(false)
              setSelectedField('')
              setShowAddFieldModal(false)
            }}
          >
            <form onSubmit={methods.handleSubmit(onSubmit)}>
              <div key={selectedField} className="flex p-6 text-left gap-4">
                <Input
                  label="Field name"
                  id="name"
                  inputSize="medium"
                  className="w-full max-w-sm md:w-80"
                  placeholder="Ex: Category"
                  type="text"
                  helperText="The name of the field"
                  defaultValue={selectedField ? capitalize(selectedField) : ''}
                />
                <div className="mb-5">
                  <label
                    htmlFor="status"
                    className="block mb-2 text-sm font-medium text-gray-900"
                  >
                    Field type
                  </label>
                  <select
                    {...methods.register('type')}
                    name="type"
                    id="type"
                    className="block cursor-pointer appearance-none rounded-lg border border-gray-300 bg-gray-50 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-blue-500 capitalize"
                    defaultValue={
                      selectedField
                        ? customFields[selectedField].type
                        : 'string'
                    }
                  >
                    {customFieldTypes.map((type) => {
                      return (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      )
                    })}
                  </select>
                </div>
              </div>
              <div className="flex px-6 text-left gap-4 mb-4">
                <Input
                  label="Label"
                  id="label"
                  inputSize="medium"
                  className="w-full max-w-sm md:w-80"
                  placeholder="Ex: Add a category"
                  type="text"
                  helperText="This will be the label of the field"
                  defaultValue={
                    selectedField ? customFields[selectedField].label : ''
                  }
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
                        Required field.
                      </label>
                      <p
                        id="helper-checkbox-text"
                        className="text-xs font-normal text-gray-500"
                      >
                        Documents will not be saved if this field is empty.
                      </p>
                    </div>
                  </div>
                </fieldset>
              </div>
              <div className="flex items-center space-x-2 rounded-b border-t p-6">
                <button
                  type="submit"
                  disabled={adding}
                  className="flex rounded-lg bg-red-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-red-800 focus:outline-none"
                >
                  {adding ? (
                    <>
                      <svg
                        className="mr-3 -ml-1 h-5 w-5 animate-spin text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Adding
                    </>
                  ) : (
                    'Add'
                  )}
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium focus:z-10 focus:outline-none focus:ring-4 order-gray-600 bg-gray-800 text-white hover:border-gray-600 hover:bg-gray-700 focus:ring-gray-700"
                  onClick={() => {
                    setHasChanges(false)
                    setSelectedField('')
                    setShowAddFieldModal(false)
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </Modal>
        )}
        {showDeleteModal && (
          <Modal
            title="Delete Custom Field"
            close={() => {
              setShowDeleteModal(false)
              setSelectedField('')
            }}
          >
            <div className="space-y-6 p-6 text-left">
              <p className="text-base leading-relaxed text-gray-500">
                Are you sure you want to delete the {capitalize(selectedField)}{' '}
                field?
              </p>
              <p className="text-base leading-relaxed text-gray-500">
                This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center space-x-2 rounded-b border-t p-6">
              <button
                type="button"
                className="flex rounded-lg bg-red-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-red-800 focus:outline-none"
                onClick={() => {
                  setDeleting(true)
                  // deleteField(selectedField)
                }}
              >
                {deleting ? (
                  <>
                    <svg
                      className="mr-3 -ml-1 h-5 w-5 animate-spin text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Deleting
                  </>
                ) : (
                  'Delete'
                )}
              </button>
              <button
                type="button"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedField('')
                }}
              >
                Cancel
              </button>
            </div>
          </Modal>
        )}
      </AdminLayout>
    </FormProvider>
  )
}
