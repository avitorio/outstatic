import { AdminLayout } from '@/components'
import Alert from '@/components/Alert'
import { Button } from '@/components/ui/button'
import Input from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Collection } from '@/types'
import { createCommitApi } from '@/utils/createCommitApi'
import { useCreateCommit } from '@/utils/hooks/useCreateCommit'
import useOid from '@/utils/hooks/useOid'
import { useOutstaticNew } from '@/utils/hooks/useOstData'
import useOutstatic from '@/utils/hooks/useOutstatic'
import { yupResolver } from '@hookform/resolvers/yup'
import { kebabCase } from 'change-case'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { slugify } from 'transliteration'
import * as yup from 'yup'
import GithubExplorer from './components/github-explorer'
import PathBreadcrumbs from './components/path-breadcrumb'

export default function NewCollection() {
  const { pages, hasChanges, setHasChanges } = useOutstatic()
  const {
    contentPath,
    monorepoPath,
    session,
    repoSlug,
    repoBranch,
    repoOwner,
    ostDetach
  } = useOutstaticNew()

  const router = useRouter()
  const fetchOid = useOid()
  const [collectionName, setCollectionName] = useState('')
  const pagesRegex = new RegExp(`^(?!${pages.join('$|')}$)`, 'i')
  const createCollection: yup.SchemaOf<Collection> = yup.object().shape({
    name: yup
      .string()
      .matches(pagesRegex, `${collectionName} is already taken.`)
      .required('Collection name is required.'),
    contentPath: yup.string()
  })
  const [path, setPath] = useState('')
  const [createFolder, setCreateFolder] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const methods = useForm<Collection>({
    resolver: yupResolver(createCollection)
  })

  const ostContent = `${monorepoPath ? monorepoPath + '/' : ''}${contentPath}`

  const mutation = useCreateCommit()

  const onSubmit: SubmitHandler<Collection> = async ({ name }: Collection) => {
    setLoading(true)
    setHasChanges(false)

    try {
      const oid = await fetchOid()
      const owner = repoOwner || session?.user?.login || ''
      const collection = slugify(name, { allowedChars: 'a-zA-Z0-9' })

      if (!oid) {
        throw new Error('Failed to fetch oid')
      }

      const collectionPath = !ostDetach
        ? `${ostContent}/${collection}`
        : createFolder
        ? `${path}/${collection}`
        : path

      const collectionJSON = JSON.stringify(
        {
          title: collection,
          type: 'object',
          path: collectionPath,
          properties: {}
        },
        null,
        2
      )

      const capi = createCommitApi({
        message: `feat(content): create ${collection}`,
        owner,
        oid,
        name: repoSlug,
        branch: repoBranch
      })

      capi.replaceFile(
        `${ostContent}/${collection}/schema.json`,
        collectionJSON + '\n'
      )

      if (createFolder) {
        capi.replaceFile(`${collectionPath}/.gitkeep`, '')
      }

      const input = capi.createInput()

      mutation.mutate(input, {
        onSuccess: () => {
          setLoading(false)
          router.push(`/outstatic/${collection}`)
        },
        onError: () => {
          throw new Error('Failed to create collection')
        }
      })
    } catch (error) {
      // TODO: Better error treatment
      toast.error('Failed to create collection.')
      setLoading(false)
      setHasChanges(false)
      setError(true)
      console.log({ error })
    }
  }

  useEffect(() => {
    const subscription = methods.watch(() => setHasChanges(true))

    return () => subscription.unsubscribe()
  }, [methods, setHasChanges])

  return (
    <FormProvider {...methods}>
      <AdminLayout title="New Collection">
        <div className="mb-8 flex h-12 items-center">
          <h1 className="mr-12 text-2xl">Create a Collection</h1>
        </div>
        {error ? (
          <Alert type="error">
            <span className="font-medium">Oops!</span> We couldn&apos;t create
            your collection. Please, make sure your settings are correct by{' '}
            <Link href="/outstatic/settings">
              <span className="underline">clicking here</span>
            </Link>{' '}
            .
          </Alert>
        ) : null}
        <form
          className="max-w-5xl w-full flex mb-4 items-start flex-col space-y-4"
          onSubmit={methods.handleSubmit(onSubmit)}
        >
          <div className="space-y-4">
            <Input
              label="Collection Name"
              id="name"
              inputSize="medium"
              className="w-full max-w-sm md:w-80"
              placeholder="Ex: Posts"
              type="text"
              helperText="We suggest naming the collection in plural form, ex: Docs"
              registerOptions={{
                onChange: (e) => {
                  setCollectionName(e.target.value)
                },
                onBlur: (e) => {
                  methods.setValue('name', e.target.value)
                }
              }}
              autoFocus
            />

            {collectionName && (
              <Alert type="info">
                The collection will appear as{' '}
                <span className="font-semibold capitalize">
                  {collectionName}
                </span>{' '}
                on the sidebar.
              </Alert>
            )}
          </div>

          {ostDetach ? (
            <div className="space-y-4">
              <Label htmlFor="create-folder">Content Path</Label>
              <Input id="contentPath" type="hidden" value={path} />
              <RadioGroup
                defaultValue="select-folder"
                onValueChange={(value: string) =>
                  setCreateFolder(value === 'create-folder')
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="select-folder" id="select-folder" />
                  <Label htmlFor="select-folder">Select existing folder</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="create-folder" id="create-folder" />
                  <Label htmlFor="create-folder">Create new folder</Label>
                </div>
              </RadioGroup>
              <PathBreadcrumbs
                path={
                  createFolder
                    ? path +
                      '/' +
                      kebabCase(methods.getValues('name') || 'your-collection')
                    : '/' + path
                }
              />
              <p className="text-xs text-gray-500">
                This is where your .md(x) files will be stored and read from.
              </p>

              <GithubExplorer path={path} setPath={setPath} />
            </div>
          ) : null}
          <Button
            type="submit"
            disabled={loading || !hasChanges}
            className="ml-1 mt-7 mb-5"
          >
            {loading ? (
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
                Saving
              </>
            ) : (
              'Save'
            )}
          </Button>
        </form>
      </AdminLayout>
    </FormProvider>
  )
}
