import { AdminLayout } from '@/components'
import Alert from '@/components/Alert'
import { Input } from '@/components/ui/shadcn/input'
import { SpinnerIcon } from '@/components/ui/outstatic/spinner-icon'
import { Button } from '@/components/ui/shadcn/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/shadcn/card'
import { Label } from '@/components/ui/shadcn/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/shadcn/radio-group'
import { createCommitApi } from '@/utils/createCommitApi'
import { useCollections } from '@/utils/hooks'
import { useCreateCommit } from '@/utils/hooks/useCreateCommit'
import { useGetDocuments } from '@/utils/hooks/useGetDocuments'
import useOid from '@/utils/hooks/useOid'
import useOutstatic from '@/utils/hooks/useOutstatic'
import { useRebuildMetadata } from '@/utils/hooks/useRebuildMetadata'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { slugify } from 'transliteration'
import * as z from 'zod'
import GithubExplorer from '@/components/ui/outstatic/github-explorer'
import PathBreadcrumbs from '@/components/ui/outstatic/path-breadcrumb'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/shadcn/form'
import { Check } from 'lucide-react'
import { Checkbox } from '@/components/ui/shadcn/checkbox'

export default function NewCollection() {
  const { pages, hasChanges, setHasChanges } = useOutstatic()
  const {
    contentPath,
    monorepoPath,
    session,
    repoSlug,
    repoBranch,
    repoOwner,
    dashboardRoute
  } = useOutstatic()

  const router = useRouter()
  const fetchOid = useOid()
  const [collectionName, setCollectionName] = useState('')
  const [step, setStep] = useState(1)

  const ostContent = `${monorepoPath ? monorepoPath + '/' : ''}${contentPath}`
  const [path, setPath] = useState(ostContent)
  const [outstaticFolder, setOutstaticFolder] = useState(true)
  const [createFolder, setCreateFolder] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const { refetch: refetchCollections } = useCollections({ enabled: false })

  const { refetch: refetchDocuments } = useGetDocuments({
    enabled: false,
    collection: collectionName
  })

  const createCollectionSchema = z.object({
    name: z.string().refine(
      (val) => !pages.some((page) => page.toLowerCase() === val.toLowerCase()),
      (val) => ({ message: `${val} is a reserved name.` })
    ),
    contentPath: z.string().optional()
  })

  const form = useForm<z.infer<typeof createCollectionSchema>>({
    resolver: zodResolver(createCollectionSchema),
    defaultValues: {
      name: '',
      contentPath: ''
    }
  })

  const mutation = useCreateCommit()

  const rebuildMetadata = useRebuildMetadata()

  const onSubmit = async ({ name }: z.infer<typeof createCollectionSchema>) => {
    setLoading(true)
    setHasChanges(false)

    try {
      const [collectionsJson, oid] = await Promise.all([
        refetchCollections(),
        fetchOid()
      ])
      const owner = repoOwner || session?.user?.login || ''
      const slug = slugify(name, { allowedChars: 'a-zA-Z0-9.' })

      if (!oid) {
        throw new Error('Failed to fetch oid')
      }

      if (!collectionsJson.data) {
        throw new Error('Failed to fetch collections')
      }

      const collections = collectionsJson.data

      if (collections.find((col) => col.slug === slug)) {
        throw new Error(`${slug} already exists.`)
      }

      let collectionPath = ''

      if (path === ostContent) {
        collectionPath = `${ostContent}/${slug}`
      } else if (createFolder) {
        collectionPath = path ? `${path}/${slug}` : slug
      } else {
        collectionPath = path
      }

      collections.push({
        title: name,
        slug,
        path: collectionPath,
        children: []
      })

      const schemaJson = {
        title: name,
        slug,
        type: 'object',
        properties: {}
      }

      const commitApi = createCommitApi({
        message: `feat(content): create ${slug}`,
        owner,
        oid,
        name: repoSlug,
        branch: repoBranch
      })

      commitApi.replaceFile(
        `${ostContent}/${slug}/schema.json`,
        JSON.stringify(schemaJson, null, 2) + '\n'
      )

      commitApi.replaceFile(
        `${ostContent}/collections.json`,
        JSON.stringify(collections, null, 2) + '\n'
      )

      if (createFolder) {
        commitApi.replaceFile(`${collectionPath}/.gitkeep`, '')
      }

      const input = commitApi.createInput()

      toast.promise(mutation.mutateAsync(input), {
        loading: 'Creating collection...',
        success: async () => {
          // check if the collection has md(x) files in it
          const { data } = await refetchDocuments()

          const onComplete = async () => {
            await refetchCollections()
            setLoading(false)
            setHasChanges(false)
            router.push(`${dashboardRoute}/${slug})}`)
          }

          if (data?.documents && data.documents.length > 0) {
            await rebuildMetadata({ onComplete })
          } else {
            onComplete()
          }

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
    const subscription = form.watch(() => setHasChanges(true))

    return () => subscription.unsubscribe()
  }, [form, setHasChanges])

  return (
    <FormProvider {...form}>
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
                {step === 1 && 'Choose where to store your content.'}
                {step === 2 &&
                  !outstaticFolder &&
                  'Select or create a folder for your content.'}
                {step === 2 &&
                  outstaticFolder &&
                  'Create a new collection to store your content.'}
                {step === 3 && 'Create a new collection to store your content.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {step === 1 && (
                <div className="space-y-4">
                  <Label>
                    Where would you like to store your Markdown files?
                  </Label>
                  <RadioGroup
                    className="grid gap-4 md:grid-cols-2 -ml-2"
                    defaultValue={
                      outstaticFolder ? 'outstatic-folder' : 'select-folder'
                    }
                    onValueChange={(value: string) => {
                      setOutstaticFolder(value === 'outstatic-folder')
                      if (value === 'outstatic-folder') {
                        setPath(ostContent)
                      }
                      if (value === 'select-folder') {
                        setPath('')
                      }
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="outstatic-folder"
                        id="outstatic-folder"
                        className="sr-only"
                      />
                      <Label htmlFor="outstatic-folder">
                        <Card
                          className={`h-full cursor-pointer transition-all shadow-none group ${
                            outstaticFolder ? 'border-primary' : ''
                          }`}
                        >
                          <CardHeader className="relative">
                            <div
                              className={`absolute right-2 top-2 w-6 h-6 rounded-full border-2 border-primary flex items-center justify-center transition-all ${
                                outstaticFolder
                                  ? 'bg-primary text-primary-foreground opacity-100'
                                  : 'opacity-0'
                              }`}
                            >
                              <Check className="w-4 h-4" />
                            </div>
                            <CardTitle className="text-xl">
                              Outstatic Folder
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <CardDescription>
                              Default Outstatic setup
                            </CardDescription>
                            <ul className="mt-2 space-y-1 text-sm">
                              <li>
                                Stores markdown files in the outstatic/content
                                folder.
                              </li>
                            </ul>
                          </CardContent>
                        </Card>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="select-folder"
                        id="select-folder"
                        className="sr-only"
                      />
                      <Label htmlFor="select-folder">
                        <Card
                          className={`h-full cursor-pointer transition-all shadow-none group ${
                            !outstaticFolder ? 'border-primary' : ''
                          }`}
                        >
                          <CardHeader className="relative">
                            <div
                              className={`absolute right-2 top-2 w-6 h-6 rounded-full border-2 border-primary flex items-center justify-center transition-all ${
                                !outstaticFolder
                                  ? 'bg-primary text-primary-foreground opacity-100'
                                  : 'opacity-0'
                              }`}
                            >
                              <Check className="w-4 h-4" />
                            </div>
                            <CardTitle className="text-xl">
                              Select a folder
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <CardDescription>
                              For existing Markdown content
                            </CardDescription>
                            <ul className="mt-2 space-y-1 text-sm">
                              <li>
                                Works with Nextra, Astro, Gatsby FumaDocs &
                                more.
                              </li>
                            </ul>
                          </CardContent>
                        </Card>
                      </Label>
                    </div>
                  </RadioGroup>
                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={() => {
                        if (outstaticFolder) {
                          setStep(2)
                        } else {
                          setStep(2)
                        }
                      }}
                    >
                      Next Step
                    </Button>
                  </div>
                </div>
              )}

              {step === 2 && !outstaticFolder && (
                <div className="space-y-4">
                  <PathBreadcrumbs path={'/' + path} />
                  <GithubExplorer path={path} setPath={setPath} />
                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button
                      onClick={() => {
                        setCollectionName(path.split('/').pop() || '')
                        form.setValue('name', path.split('/').pop() || '')
                        setStep(3)
                      }}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}

              {((step === 2 && outstaticFolder) || step === 3) && (
                <form
                  className="w-full flex mb-4 items-start flex-col space-y-4"
                  onSubmit={form.handleSubmit(onSubmit)}
                >
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Collection Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Ex: Posts"
                              autoFocus
                              onChange={(e) => {
                                field.onChange(e)
                                setCollectionName(e.target.value)
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            We suggest naming the collection in plural form, ex:
                            Docs
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="space-y-4">
                    <Label>Content Path</Label>
                    {!outstaticFolder && (
                      <div className="flex items-center space-x-2 mb-2">
                        <Checkbox
                          id="create-folder"
                          checked={createFolder}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              form.setValue('name', '')
                            }
                            setCreateFolder(checked as boolean)
                          }}
                        />
                        <Label htmlFor="create-folder">
                          Create a new folder
                        </Label>
                      </div>
                    )}
                    <PathBreadcrumbs
                      path={
                        outstaticFolder
                          ? ostContent +
                            '/' +
                            slugify(
                              form.getValues('name') || 'your-collection',
                              { allowedChars: 'a-zA-Z0-9.' }
                            )
                          : createFolder
                          ? '/' +
                            (path ? path + '/' : '') +
                            slugify(
                              form.getValues('name') || 'your-collection',
                              { allowedChars: 'a-zA-Z0-9.' }
                            )
                          : '/' + path
                      }
                    />
                  </div>
                  <div className="flex justify-between w-full pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setStep(outstaticFolder ? 1 : 2)}
                    >
                      Back
                    </Button>
                    <SaveButton
                      loading={loading}
                      hasChanges={hasChanges}
                      collectionName={collectionName}
                    />
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
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
