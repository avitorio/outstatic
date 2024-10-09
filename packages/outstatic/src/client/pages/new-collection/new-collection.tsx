import { AdminLayout } from '@/components'
import Alert from '@/components/Alert'
import { Button } from '@/components/ui/shadcn/button'
import Input from '@/components/ui/outstatic/input'
import { Label } from '@/components/ui/shadcn/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/shadcn/radio-group'
import { Collection } from '@/types'
import { createCommitApi } from '@/utils/createCommitApi'
import { useCreateCommit } from '@/utils/hooks/useCreateCommit'
import useOid from '@/utils/hooks/useOid'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/shadcn/dialog'
import { SpinnerIcon } from '@/components/ui/outstatic/spinner-icon'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/shadcn/card'
import { MetadataBuilder } from '@/components/MetadataBuilder'
import { useCollections } from '@/utils/hooks'
import { useGetDocuments } from '@/utils/hooks/useGetDocuments'

export default function NewCollection() {
  const { pages, hasChanges, setHasChanges } = useOutstatic()
  const {
    contentPath,
    monorepoPath,
    session,
    repoSlug,
    repoBranch,
    repoOwner,
    ostDetach,
    dashboardRoute
  } = useOutstatic()

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
  const ostContent = `${monorepoPath ? monorepoPath + '/' : ''}${contentPath}`
  const [path, setPath] = useState(ostContent)
  const [outstaticFolder, setOutstaticFolder] = useState(true)
  const [createFolder, setCreateFolder] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [showSelectFolderButton, setShowSelectFolderButton] = useState(false)
  const [rebuild, setRebuild] = useState(false)
  const { refetch: refetchCollections } = useCollections({
    enabled: false,
    detailed: true
  })
  const { refetch: refetchDocuments } = useGetDocuments({
    enabled: false,
    collection: collectionName
  })

  const methods = useForm<Collection>({
    // @ts-ignore
    resolver: yupResolver(createCollection)
  })

  const mutation = useCreateCommit()

  const onSubmit: SubmitHandler<Collection> = async ({ name }: Collection) => {
    setLoading(true)
    setHasChanges(false)

    try {
      const [collectionsJson, oid] = await Promise.all([
        refetchCollections(),
        fetchOid()
      ])
      const owner = repoOwner || session?.user?.login || ''
      const collection = slugify(name, { allowedChars: 'a-zA-Z0-9' })

      if (!oid) {
        throw new Error('Failed to fetch oid')
      }

      if (!collectionsJson.data || !collectionsJson?.data?.fullData) {
        throw new Error('Failed to fetch collections')
      }

      const { collections, fullData } = collectionsJson.data

      if (collections.includes(collection)) {
        throw new Error(`${collection} already exists.`)
      }

      let collectionPath = ''

      if (!ostDetach || path === ostContent) {
        collectionPath = `${ostContent}/${collection}`
      } else if (createFolder) {
        collectionPath = path ? `${path}/${collection}` : collection
      } else {
        collectionPath = path
      }

      fullData.push({
        name: collection,
        path: collectionPath,
        children: []
      })

      const collectionJSON = {
        title: collection,
        type: 'object',
        properties: {}
      }

      const capi = createCommitApi({
        message: `feat(content): create ${collection}`,
        owner,
        oid,
        name: repoSlug,
        branch: repoBranch
      })

      capi.replaceFile(
        `${ostContent}/${collection}/schema.json`,
        JSON.stringify(collectionJSON, null, 2) + '\n'
      )

      capi.replaceFile(
        `${ostContent}/collections.json`,
        JSON.stringify(fullData, null, 2) + '\n'
      )

      if (createFolder) {
        capi.replaceFile(`${collectionPath}/.gitkeep`, '')
      }

      const input = capi.createInput()

      toast.promise(mutation.mutateAsync(input), {
        loading: 'Creating collection...',
        success: async () => {
          // check if the collection has md(x) files in it
          const { data } = await refetchDocuments()

          if (data?.documents && data.documents.length > 0) {
            setRebuild(true)
          }

          await refetchCollections()
          setLoading(false)
          setHasChanges(false)
          router.push(
            `${dashboardRoute}/${slugify(collection, {
              allowedChars: 'a-zA-Z0-9'
            })}`
          )
          return 'Collection created successfully'
        },
        error: () => {
          setLoading(false)
          setHasChanges(false)
          setError(true)
          return 'Failed to create collection'
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
        {error ? (
          <Alert type="error">
            <span className="font-medium">Oops!</span> We couldn&apos;t create
            your collection. Please, make sure your settings are correct by{' '}
            <Link href={`${dashboardRoute}/settings`}>
              <span className="underline">clicking here</span>
            </Link>{' '}
            .
          </Alert>
        ) : null}
        <div className="max-w-2xl w-full">
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle>Create a Collection</CardTitle>
              <CardDescription>
                Create a new collection to store your content.
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                </div>
                <div className="space-y-4">
                  <Label>Content Path</Label>
                  <PathBreadcrumbs
                    path={
                      outstaticFolder
                        ? ostContent +
                          '/' +
                          kebabCase(
                            methods.getValues('name') || 'your-collection'
                          )
                        : createFolder
                        ? '/' +
                          (path ? path + '/' : '') +
                          kebabCase(
                            methods.getValues('name') || 'your-collection'
                          )
                        : '/' + path
                    }
                  />
                  <p className="text-xs text-gray-500">
                    This is where your .md(x) files will be stored and read
                    from.
                  </p>
                  <Input id="contentPath" type="hidden" value={path} />
                  <RadioGroup
                    defaultValue="outstatic-folder"
                    onValueChange={(value: string) => {
                      setOutstaticFolder(value === 'outstatic-folder')
                      if (value === 'outstatic-folder') {
                        setPath(ostContent)
                        setShowSelectFolderButton(false)
                      }
                      if (value === 'select-or-create') {
                        setPath('')
                        setShowSelectFolderButton(true)
                      }
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="outstatic-folder"
                        id="outstatic-folder"
                      />
                      <Label htmlFor="outstatic-folder">
                        Use Outstatic&apos;s default structure
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="select-or-create"
                        id="select-or-create"
                      />
                      <Label htmlFor="select-or-create">
                        Select or create a new folder
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Content Path</DialogTitle>
                      <DialogDescription>
                        Choose where your .md(x) files will be stored and read
                        from.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input id="contentPath" type="hidden" value={path} />
                      <RadioGroup
                        defaultValue="select-folder"
                        onValueChange={(value: string) =>
                          setCreateFolder(value === 'create-folder')
                        }
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="select-folder"
                            id="select-folder"
                          />
                          <Label htmlFor="select-folder">
                            Select an existing folder
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="create-folder"
                            id="create-folder"
                          />
                          <Label htmlFor="create-folder">
                            Create a new folder
                          </Label>
                        </div>
                      </RadioGroup>
                      <PathBreadcrumbs
                        path={
                          createFolder
                            ? '/' +
                              (path ? path + '/' : '') +
                              kebabCase(
                                methods.getValues('name') || 'your-collection'
                              )
                            : '/' + path
                        }
                      />
                      <GithubExplorer path={path} setPath={setPath} />
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setDialogOpen(false)}
                      >
                        Cancel
                      </Button>

                      <SaveButton
                        loading={loading}
                        hasChanges={hasChanges}
                        onClick={methods.handleSubmit(onSubmit)}
                        collectionName={collectionName}
                      />
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                {showSelectFolderButton ? (
                  <Button
                    onClick={(e) => {
                      e.preventDefault()
                      setDialogOpen(true)
                    }}
                    className="mt-7 mb-5"
                    disabled={loading || !collectionName}
                  >
                    Select or Create Folder
                  </Button>
                ) : (
                  <SaveButton
                    loading={loading}
                    hasChanges={hasChanges}
                    collectionName={collectionName}
                  />
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
      <div className="hidden">
        <MetadataBuilder
          onComplete={() => {
            setRebuild(false)
            router.push(
              `${dashboardRoute}/${slugify(collectionName, {
                allowedChars: 'a-zA-Z0-9'
              })}`
            )
          }}
          rebuild={rebuild}
        />
      </div>
    </FormProvider>
  )
}

const SaveButton = ({
  loading,
  hasChanges,
  onClick,
  collectionName
}: {
  loading: boolean
  hasChanges: boolean
  onClick?: () => void
  collectionName: string
}) => {
  return (
    <Button
      type="submit"
      disabled={loading || !hasChanges || !collectionName}
      onClick={onClick}
    >
      {loading ? (
        <>
          <SpinnerIcon className="text-background mr-2" />
          Creating Collection
        </>
      ) : (
        'Create Collection'
      )}
    </Button>
  )
}
