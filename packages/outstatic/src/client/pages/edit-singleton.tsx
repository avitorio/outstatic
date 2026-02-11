import { AdminLayout } from '@/components/admin-layout'
import { DocumentSettings } from '@/components/document-settings'
import { DocumentTitleInput } from '@/components/document-title-input'
import { MDEditor } from '@/components/editor/editor'
import { DocumentContext } from '@/context'
import { CustomFieldsType, Document, MDExtensions } from '@/types'
import { deepReplace } from '@/utils/deepReplace'
import { useSingletonUpdateEffect } from '@/utils/hooks/useSingletonUpdateEffect'
import { useFileStore } from '@/utils/hooks/useFileStore'
import { useGetSingletonSchema } from '@/utils/hooks/useGetSingletonSchema'
import { useGetConfig } from '@/utils/hooks/useGetConfig'
import { useOutstatic } from '@/utils/hooks/useOutstatic'
import useSubmitSingleton from '@/utils/hooks/useSubmitSingleton'
import { useTipTap } from '@/components/editor/hooks/use-tip-tap'
import { editDocumentSchema } from '@/utils/schemas/edit-document-schema'
import { zodResolver } from '@hookform/resolvers/zod'
import Head from 'next/head'
import { useEffect, useState, useRef } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { convertSchemaToZod } from '@/utils/zod'
import { FormMessage } from '@/components/ui/shadcn/form'
import { toast } from 'sonner'
import MediaSettingsDialog from '@/components/ui/outstatic/media-settings-dialog'
import { MarkdownExtensionDialog } from '@/components/ui/outstatic/markdown-extension-dialog'
import { UpgradeDialog } from '@/components/ui/outstatic/upgrade-dialog'
import { useEditor } from '@/components/editor/editor-context'
import { useSingletons } from '@/utils/hooks/useSingletons'
import NewSingletonModal from './_components/new-singleton-modal'
import { useSearchParams } from 'next/navigation'
import { useGetFileByPath } from '@/utils/hooks/useGetFileByPath'
import { parseContent } from '@/utils/parseContent'
import { getLocalDate } from '@/utils/getLocalDate'
import matter from 'gray-matter'
import { slugify } from 'transliteration'

export default function EditSingleton({ slug: initialSlug }: { slug: string }) {
  const [slug, setSlug] = useState(initialSlug)
  const [isNew, setIsNew] = useState(initialSlug === 'new')
  useEffect(() => {
    setIsNew(initialSlug === 'new')
  }, [initialSlug])
  const [loading, setLoading] = useState(false)
  const {
    basePath,
    session,
    hasChanges,
    setHasChanges,
    dashboardRoute,
    repoMediaPath,
    publicMediaPath,
    repoOwner,
    repoSlug,
    repoBranch,
    projectInfo
  } = useOutstatic()

  // Get openFile query parameter for opening existing files
  const searchParams = useSearchParams()
  const openFilePath = searchParams?.get('openFile') ?? null
  const [openFileLoaded, setOpenFileLoaded] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [documentSchema, setDocumentSchema] = useState(editDocumentSchema)
  const [showSingletonModal, setShowSingletonModal] = useState(false)
  const [singletonContentPath, setSingletonContentPath] = useState<
    string | undefined
  >(undefined)
  //@ts-ignore
  const methods = useForm<Document>({ resolver: zodResolver(documentSchema) })

  const { editor, setEditor } = useEditor()
  const {
    editor: tiptapEditor,
    showUpgradeDialog,
    setShowUpgradeDialog
  } = useTipTap({ ...methods })

  useEffect(() => {
    setEditor(tiptapEditor)
  }, [tiptapEditor, setEditor])

  const [customFields, setCustomFields] = useState<CustomFieldsType>({})
  const files = useFileStore((state) => state.files)
  const [extension, setExtension] = useState<MDExtensions>('md')
  const [metadata, setMetadata] = useState<Record<string, any>>({})
  const [showMediaPathDialog, setShowMediaPathDialog] = useState(false)
  const [showExtensionDialog, setShowExtensionDialog] = useState(false)
  const pendingFormDataRef = useRef<Document | null>(null)
  const pendingSingletonPathRef = useRef<string | null>(null)
  const editDocument = (property: string, value: any) => {
    const formValues = methods.getValues()
    const newValue = deepReplace(formValues, property, value)
    methods.reset(newValue)
  }
  const [mediaPathUpdated, setMediaPathUpdated] = useState(false)

  const { data: schema } = useGetSingletonSchema({ slug, enabled: !isNew })
  const { data: config } = useGetConfig()
  const { data: singletons } = useSingletons()

  // Fetch file content when opening from file
  const { data: openedFileData } = useGetFileByPath({
    filePath: openFilePath,
    enabled: isNew && !!openFilePath && !openFileLoaded
  })

  const singletonTitle = isNew
    ? 'New Singleton'
    : singletons?.find((s) => s.slug === slug)?.title || slug

  const onSubmit = useSubmitSingleton({
    session,
    slug,
    setSlug,
    isNew,
    setIsNew,
    setShowDelete,
    setLoading,
    files,
    methods,
    customFields,
    setCustomFields,
    setHasChanges,
    editor,
    extension,
    documentMetadata: metadata,
    path: openFilePath ? undefined : singletonContentPath,
    existingFilePath: openFilePath ?? undefined
  })

  // Only fetch existing singleton data when editing (not creating new)
  useSingletonUpdateEffect({
    slug,
    methods,
    editor,
    setHasChanges,
    setShowDelete,
    setExtension,
    setMetadata,
    enabled: !isNew && !openFilePath,
    setSingletonContentPath
  })

  // Load content from opened file
  useEffect(() => {
    if (!openedFileData || !editor || openFileLoaded || !openFilePath) return

    const { content: fileContent, extension: fileExtension } = openedFileData
    const { data, content } = matter(fileContent)

    setMetadata(data)
    const parsedContent = parseContent({
      content,
      basePath,
      repoOwner,
      repoSlug,
      repoBranch,
      publicMediaPath,
      repoMediaPath
    })

    // Extract title from frontmatter or filename
    const filename = openFilePath.substring(openFilePath.lastIndexOf('/') + 1)
    const titleFromFilename = filename.replace(/\.mdx?$/, '')
    const title = data.title || titleFromFilename

    // Generate slug from title if not present in frontmatter
    const slug = data.slug || slugify(title, { allowedChars: 'a-zA-Z0-9.' })

    const newDate = data.publishedAt
      ? new Date(data.publishedAt)
      : getLocalDate()

    const newDocument = {
      ...data,
      title,
      slug,
      status: data.status || 'draft',
      publishedAt: newDate,
      content: parsedContent,
      author: {
        name: data.author?.name || session?.user?.name || '',
        picture: data.author?.picture || session?.user?.image || ''
      }
    }

    // Set the singleton content path to the full file path
    setSingletonContentPath(openFilePath)
    setExtension(fileExtension)

    Promise.resolve().then(() => {
      methods.reset(newDocument)
      editor.commands.setContent(parsedContent)
      editor.commands.focus('start')
    })

    // Set hasChanges to true when opening a file so save button is enabled
    // and content lock is active (prevents navigation without saving)
    setHasChanges(true)
    setOpenFileLoaded(true)
  }, [
    openedFileData,
    editor,
    openFileLoaded,
    openFilePath,
    basePath,
    repoOwner,
    repoSlug,
    repoBranch,
    publicMediaPath,
    repoMediaPath,
    methods,
    setHasChanges
  ])

  // Update URL when slug changes (after first save of new singleton)
  useEffect(() => {
    if (slug !== 'new' && slug !== initialSlug) {
      window.history.replaceState(
        {},
        '',
        `${basePath}${dashboardRoute}/singletons/${slug}`
      )
    }
  }, [slug, initialSlug, basePath, dashboardRoute])

  // Add custom fields
  useEffect(() => {
    if (schema) {
      const zodSchema = convertSchemaToZod(schema)

      setDocumentSchema(zodSchema)
      setCustomFields(schema.properties)
    }
  }, [schema])

  // Convert date strings to Date objects
  useEffect(() => {
    if (schema && metadata) {
      const dateFields: string[] = []

      // Find all date fields in schema
      const findDateFields = (obj: any) => {
        Object.entries(obj).forEach(([key, value]: [string, any]) => {
          if (value?.dataType === 'date') {
            dateFields.push(key)
          }
        })
      }

      findDateFields(schema.properties)

      // Update form values for date fields
      const currentValues = methods.getValues()
      const updates: Record<string, Date> = {}

      dateFields.forEach((field) => {
        if (
          currentValues[field as keyof Document] &&
          typeof currentValues[field as keyof Document] === 'string'
        ) {
          updates[field] = new Date(
            currentValues[field as keyof Document] as string
          )
        }
      })

      if (Object.keys(updates).length > 0) {
        methods.reset({
          ...currentValues,
          ...updates
        })
        setHasChanges(false)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schema, metadata])

  // Submit the document after media paths are updated
  useEffect(() => {
    if (mediaPathUpdated) {
      onSubmit(methods.getValues())
    }
  }, [mediaPathUpdated])

  // Submit the document after singleton content path is selected (not for openFile case)
  // For new singletons: show extension dialog if config.mdExtension is missing
  useEffect(() => {
    if (singletonContentPath && isNew && !openFilePath) {
      // If config.mdExtension is missing, show extension dialog first
      if (!config?.mdExtension) {
        pendingFormDataRef.current = methods.getValues()
        pendingSingletonPathRef.current = singletonContentPath
        setShowExtensionDialog(true)
        return
      }
      // @ts-ignore
      onSubmit(methods.getValues())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [singletonContentPath, config?.mdExtension])

  // Set extension from config when available (for new singletons)
  useEffect(() => {
    if (isNew && !openFilePath && config?.mdExtension) {
      setExtension(config.mdExtension)
    }
  }, [isNew, openFilePath, config?.mdExtension])

  const handleSave = (data: Document) => {
    // Check media paths first
    if (!repoMediaPath && !publicMediaPath && files.length > 0) {
      setShowMediaPathDialog(true)
      return
    }
    // Show modal for new singletons to select save location
    // Skip modal if we're opening an existing file (openFilePath is present)
    if (isNew && !singletonContentPath && !openFilePath) {
      setShowSingletonModal(true)
      return
    }

    // For existing singletons (including opened files) without config.mdExtension, silently update it
    if (!isNew && !config?.mdExtension) {
      // @ts-ignore
      return onSubmit(data, { configUpdate: { mdExtension: extension } })
    }

    // For opened files being saved for the first time
    if (isNew && openFilePath && !config?.mdExtension) {
      // @ts-ignore
      return onSubmit(data, { configUpdate: { mdExtension: extension } })
    }

    // Normal save
    // @ts-ignore
    return onSubmit(data)
  }

  const handleExtensionDialogSave = (selectedExtension: MDExtensions) => {
    setExtension(selectedExtension)

    // Save singleton with the selected extension
    if (pendingFormDataRef.current) {
      // @ts-ignore
      onSubmit(pendingFormDataRef.current, {
        configUpdate: { mdExtension: selectedExtension }
      })
      pendingFormDataRef.current = null
      pendingSingletonPathRef.current = null
    }
  }

  // Watch for changes in form values and update hasChanges state
  useEffect(() => {
    const subscription = methods.watch((value, { name, type }) => {
      if (type === 'change' || name === 'content') {
        setHasChanges(true)
      }
    })
    return () => subscription.unsubscribe()
  }, [methods, setHasChanges])

  return (
    <>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font*/}
        <link
          href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=PT+Serif:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />
      </Head>
      {editor && editor?.isEditable && (
        <DocumentContext.Provider
          value={{
            editor,
            document: methods.getValues(),
            editDocument,
            hasChanges,
            setHasChanges,
            collection: '_singletons',
            extension
          }}
        >
          <FormProvider {...methods}>
            <FormMessage />
            <AdminLayout
              title={methods.getValues('title') || singletonTitle}
              settings={
                <DocumentSettings
                  singleton={slug}
                  title={methods.getValues('title') || singletonTitle}
                  loading={loading}
                  saveDocument={methods.handleSubmit(
                    handleSave as any,
                    (data) => {
                      console.error({ data })
                      const firstKey = Object.keys(data)[0] as keyof typeof data
                      const errorMessage =
                        (data[firstKey] as { message?: string })?.message ||
                        'Unknown error'
                      toast.error(`Error in ${firstKey}: ${errorMessage}`)
                    }
                  )}
                  showDelete={showDelete}
                  customFields={customFields}
                  setCustomFields={setCustomFields}
                  metadata={metadata}
                />
              }
            >
              <form className="m-auto max-w-[700px] space-y-4">
                <DocumentTitleInput
                  id="title"
                  className="w-full resize-none outline-hidden text-5xl scrollbar-hide min-h-[55px] overflow-hidden"
                  placeholder={`Your ${singletonTitle} title`}
                />
                <div className="min-h-full">
                  <MDEditor editor={editor} id="content" />
                </div>
              </form>
            </AdminLayout>
            <MediaSettingsDialog
              title="Your document contains media files."
              description="Let's set up your media paths so we can upload your files."
              showMediaPathDialog={showMediaPathDialog}
              setShowMediaPathDialog={setShowMediaPathDialog}
              callbackFunction={() => {
                setMediaPathUpdated(true)
              }}
            />
            <NewSingletonModal
              open={showSingletonModal}
              onOpenChange={setShowSingletonModal}
              loading={loading}
              singletonTitle={methods.getValues('title') || 'Singleton'}
              onSave={(path) => {
                setSingletonContentPath(path)
                setShowSingletonModal(false)
                // The effect watching singletonContentPath will handle the rest
                // including showing the extension dialog if needed
              }}
            />
            <MarkdownExtensionDialog
              open={showExtensionDialog}
              onOpenChange={setShowExtensionDialog}
              fileName={`${methods.getValues('slug') || 'singleton'}.${extension}`}
              onSave={handleExtensionDialogSave}
            />
            <UpgradeDialog
              title="Write faster with AI"
              open={showUpgradeDialog}
              onOpenChange={setShowUpgradeDialog}
              accountSlug={projectInfo?.accountSlug}
              dashboardRoute={dashboardRoute}
            />
          </FormProvider>
        </DocumentContext.Provider>
      )}
    </>
  )
}
