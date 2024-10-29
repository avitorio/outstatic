import {
  AdminLayout,
  DocumentSettings,
  DocumentTitleInput,
  MDEditor
} from '@/components'
import { DocumentContext } from '@/context'
import { CustomFieldsType, Document, MDExtensions } from '@/types'
import { deepReplace } from '@/utils/deepReplace'
import { useDocumentUpdateEffect } from '@/utils/hooks/useDocumentUpdateEffect'
import { useFileStore } from '@/utils/hooks/useFileStore'
import { useGetCollectionSchema } from '@/utils/hooks/useGetCollectionSchema'
import useOutstatic from '@/utils/hooks/useOutstatic'
import useSubmitDocument from '@/utils/hooks/useSubmitDocument'
import useTipTap from '@/utils/hooks/useTipTap'
import { editDocumentSchema } from '@/utils/schemas/edit-document-schema'
import { zodResolver } from '@hookform/resolvers/zod'
import Head from 'next/head'
import { usePathname } from 'next/navigation'
import { singular } from 'pluralize'
import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { convertSchemaToZod } from '@/utils/zod'
import { FormMessage } from '@/components/ui/shadcn/form'
import { toast } from 'sonner'
import { noCase } from 'change-case'

export default function EditDocument({ collection }: { collection: string }) {
  const pathname = usePathname()
  const [slug, setSlug] = useState(
    pathname.split('/').pop() || `/${collection}/new`
  )
  const [loading, setLoading] = useState(false)
  const { basePath, session, hasChanges, setHasChanges, dashboardRoute } =
    useOutstatic()
  const [showDelete, setShowDelete] = useState(false)
  const [documentSchema, setDocumentSchema] = useState(editDocumentSchema)
  //@ts-ignore
  const methods = useForm<Document>({ resolver: zodResolver(documentSchema) })
  const { editor } = useTipTap({ ...methods })
  const [customFields, setCustomFields] = useState<CustomFieldsType>({})
  const files = useFileStore((state) => state.files)
  const [extension, setExtension] = useState<MDExtensions>('mdx')
  const [metadata, setMetadata] = useState<Record<string, any>>({})

  const editDocument = (property: string, value: any) => {
    const formValues = methods.getValues()
    const newValue = deepReplace(formValues, property, value)
    methods.reset(newValue)
  }

  const { data: schema } = useGetCollectionSchema({ collection })

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
    session,
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
      <DocumentContext.Provider
        value={{
          editor,
          document: methods.getValues(),
          editDocument,
          hasChanges,
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
                loading={loading}
                saveFunc={methods.handleSubmit(
                  (data) => {
                    return onSubmit(data)
                  },
                  (data) => {
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
                className="w-full resize-none outline-none bg-white text-5xl scrollbar-hide min-h-[55px] overflow-hidden"
                placeholder={`Your ${singular(noCase(collection))} title`}
              />
              <div className="min-h-full prose prose-xl">
                <MDEditor editor={editor} id="content" />
              </div>
            </form>
          </AdminLayout>
        </FormProvider>
      </DocumentContext.Provider>
    </>
  )
}
