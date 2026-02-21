import { AdminLayout } from '@/components/admin-layout'
import { DocumentSettings } from '@/components/document-settings'
import { DocumentTitleInput } from '@/components/document-title-input'
import { MDEditor } from '@/components/editor/editor'
import { DocumentContext } from '@/context'
import { CustomFieldsType, Document, MDExtensions } from '@/types'
import { deepReplace } from '@/utils/deepReplace'
import { useDocumentUpdateEffect } from '@/utils/hooks/useDocumentUpdateEffect'
import { useFileStore } from '@/utils/hooks/useFileStore'
import { useGetCollectionSchema } from '@/utils/hooks/useGetCollectionSchema'
import { useGetConfig } from '@/utils/hooks/useGetConfig'
import { useUpdateConfig } from '@/utils/hooks/useUpdateConfig'
import { useOutstatic } from '@/utils/hooks/useOutstatic'
import useSubmitDocument from '@/utils/hooks/useSubmitDocument'
import { useTipTap } from '@/components/editor/hooks/use-tip-tap'
import { editDocumentSchema } from '@/utils/schemas/edit-document-schema'
import { zodResolver } from '@hookform/resolvers/zod'
import Head from 'next/head'
import { usePathname } from 'next/navigation'
import { singular } from 'pluralize'
import { useEffect, useState, useRef } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { convertSchemaToZod } from '@/utils/zod'
import { FormMessage } from '@/components/ui/shadcn/form'
import { toast } from 'sonner'
import { noCase } from 'change-case'
import MediaSettingsDialog from '@/components/ui/outstatic/media-settings-dialog'
import { MarkdownExtensionDialog } from '@/components/ui/outstatic/markdown-extension-dialog'
import { useEditor } from '@/components/editor/editor-context'

export default function EditDocument({ collection }: { collection: string }) {
  const pathname = usePathname()
  const [slug, setSlug] = useState(
    pathname.split('/').pop() || `/${collection}/new`
  )
  const [loading, setLoading] = useState(false)
  const {
    basePath,
    session,
    hasChanges,
    setHasChanges,
    dashboardRoute,
    repoMediaPath,
    publicMediaPath
  } = useOutstatic()
  const [showDelete, setShowDelete] = useState(false)
  const [documentSchema, setDocumentSchema] = useState(editDocumentSchema)
  //@ts-ignore
  const methods = useForm<Document>({ resolver: zodResolver(documentSchema) })

  const { editor, setEditor } = useEditor()
  const { editor: tiptapEditor } = useTipTap({ ...methods })

  useEffect(() => {
    setEditor(tiptapEditor)
  }, [tiptapEditor, setEditor])

  const [customFields, setCustomFields] = useState<CustomFieldsType>({})
  const files = useFileStore((state) => state.files)
  const [extension, setExtension] = useState<MDExtensions>('mdx')
  const [metadata, setMetadata] = useState<Record<string, any>>({})
  const [showMediaPathDialog, setShowMediaPathDialog] = useState(false)
  const [showExtensionDialog, setShowExtensionDialog] = useState(false)
  const pendingFormDataRef = useRef<Document | null>(null)
  const editDocument = (property: string, value: any) => {
    const formValues = methods.getValues()
    const newValue = deepReplace(formValues, property, value)
    methods.reset(newValue)
  }
  const [mediaPathUpdated, setMediaPathUpdated] = useState(false)

  const { data: schema } = useGetCollectionSchema({ collection })
  const { data: config } = useGetConfig()
  const updateConfig = useUpdateConfig({ setLoading })

  const onSubmit = useSubmitDocument({
    session,
    slug,
    setSlug,
    setShowDelete,
    setLoading,
    files,
    methods,
    collection,
    customFields,
    setCustomFields,
    setHasChanges,
    editor,
    extension,
    documentMetadata: metadata
  })

  useEffect(() => {
    window.history.replaceState(
      {},
      '',
      `${basePath}${dashboardRoute}/${collection}/${slug}`
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  useDocumentUpdateEffect({
    collection,
    methods,
    slug,
    editor,
    setHasChanges,
    setShowDelete,
    setExtension,
    setMetadata
  })

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

  // Watch for changes in form values and update hasChanges state
  useEffect(() => {
    const subscription = methods.watch((value, { name, type }) => {
      if (type === 'change' || name === 'content') {
        setHasChanges(true)
      }
    })
    return () => subscription.unsubscribe()
  }, [methods, setHasChanges])

  // Set extension from config when available (for new documents)
  useEffect(() => {
    if (slug === 'new' && config?.mdExtension) {
      setExtension(config.mdExtension)
    }
  }, [slug, config?.mdExtension])

  const isNewDocument = slug === 'new'

  const handleSave = (data: Document) => {
    // Check media paths first
    if (!repoMediaPath && !publicMediaPath && files.length > 0) {
      setShowMediaPathDialog(true)
      return
    }

    // For new documents without config.mdExtension, show the extension dialog
    if (isNewDocument && !config?.mdExtension) {
      pendingFormDataRef.current = data
      setShowExtensionDialog(true)
      return
    }

    // For existing documents without config.mdExtension, silently update it
    if (!isNewDocument && !config?.mdExtension) {
      // @ts-ignore
      return onSubmit(data, { configUpdate: { mdExtension: extension } })
    }

    // Normal save
    // @ts-ignore
    return onSubmit(data)
  }

  const handleExtensionDialogSave = (selectedExtension: MDExtensions) => {
    setExtension(selectedExtension)

    // Save document and update config in parallel
    if (pendingFormDataRef.current) {
      // @ts-ignore
      onSubmit(pendingFormDataRef.current, {
        configUpdate: { mdExtension: selectedExtension }
      })
      pendingFormDataRef.current = null
    }
  }

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
            collection,
            extension
          }}
        >
          <FormProvider {...methods}>
            <FormMessage />
            <AdminLayout
              title={methods.getValues('title')}
              settings={
                <DocumentSettings
                  title={methods.getValues('title')}
                  loading={loading}
                  saveDocument={methods.handleSubmit(
                    handleSave as any,
                    (data) => {
                      console.error('Failed to save document', { data })
                      const firstKey = Object.keys(data)[0] as keyof typeof data
                      const errorMessage =
                        (data[firstKey] as { message?: string })?.message ||
                        'Unknown error'
                      const errorToast = toast.error(
                        `Error in ${firstKey}: ${errorMessage}`,
                        {
                          action: {
                            label: 'Copy Logs',
                            onClick: () => {
                              navigator.clipboard.writeText(
                                JSON.stringify(data, null, '  ')
                              )
                              toast.message('Logs copied to clipboard', {
                                id: errorToast
                              })
                            }
                          }
                        }
                      )
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
                  placeholder={`Your ${singular(
                    noCase(collection, {
                      split: (str) =>
                        str.split(/([^A-Za-z0-9\.-]+)/g).filter(Boolean)
                    })
                  ).replace(/-/g, ' ')} title`}
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
            <MarkdownExtensionDialog
              open={showExtensionDialog}
              onOpenChange={setShowExtensionDialog}
              fileName={`${methods.getValues('slug') || 'document'}.${extension}`}
              onSave={handleExtensionDialogSave}
            />
          </FormProvider>
        </DocumentContext.Provider>
      )}
    </>
  )
}
