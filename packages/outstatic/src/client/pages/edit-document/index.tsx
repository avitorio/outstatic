import { yupResolver } from '@hookform/resolvers/yup'
import Head from 'next/head'
import { useRouter, usePathname } from 'next/navigation'
import { singular } from 'pluralize'
import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import {
  AdminLayout,
  MDEditor,
  DocumentSettings,
  DocumentTitleInput
} from '../../../components'
import { DocumentContext } from '../../../context'
import { CustomFields, Document, FileType } from '../../../types'
import { useOstSession } from '../../../utils/auth/hooks'
import { deepReplace } from '../../../utils/deepReplace'
import useNavigationLock from '../../../utils/hooks/useNavigationLock'
import useTipTap from '../../../utils/hooks/useTipTap'
import { convertSchemaToYup, editDocumentSchema } from '../../../utils/yup'
import useFileQuery from '../../../utils/hooks/useFileQuery'
import useSubmitDocument from '../../../utils/hooks/useSubmitDocument'
import { useDocumentUpdateEffect } from '../../../utils/hooks/useDocumentUpdateEffect'

export default function EditDocument({ collection }: { collection: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const [slug, setSlug] = useState(
    pathname.split('/').pop() || `/${collection}/new`
  )
  const { session } = useOstSession()
  const [loading, setLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [files, setFiles] = useState<FileType[]>([])
  const [showDelete, setShowDelete] = useState(false)
  const [documentSchema, setDocumentSchema] = useState(editDocumentSchema)
  const methods = useForm<Document>({ resolver: yupResolver(documentSchema) })
  const { editor } = useTipTap({ ...methods })
  const [customFields, setCustomFields] = useState<CustomFields>({})

  const editDocument = (property: string, value: any) => {
    const formValues = methods.getValues()
    const newValue = deepReplace(formValues, property, value)
    methods.reset(newValue)
  }

  const { data: schemaQueryData } = useFileQuery({
    file: `${collection}/schema.json`
  })

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
    setHasChanges
  })

  useEffect(() => {
    router.replace(`/outstatic/${collection}/${slug}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  useDocumentUpdateEffect({
    collection,
    methods,
    slug,
    editor,
    session,
    setHasChanges,
    setShowDelete
  })

  useEffect(() => {
    const documentQueryObject = schemaQueryData?.repository?.object
    if (documentQueryObject?.__typename === 'Blob') {
      const schema = JSON.parse(documentQueryObject?.text || '{}')
      const yupSchema = convertSchemaToYup(schema)
      setDocumentSchema(yupSchema)
      setCustomFields(schema.properties)
    }
  }, [schemaQueryData])

  // Ask for confirmation before leaving page if changes were made.
  useNavigationLock(hasChanges)

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
          files,
          setFiles,
          hasChanges,
          collection
        }}
      >
        <FormProvider {...methods}>
          <AdminLayout
            title={methods.getValues('title')}
            settings={
              <DocumentSettings
                loading={loading}
                saveFunc={methods.handleSubmit(onSubmit)}
                showDelete={showDelete}
                customFields={customFields}
              />
            }
          >
            <form className="m-auto max-w-[700px] space-y-4">
              <DocumentTitleInput
                id="title"
                className="w-full resize-none outline-none bg-white text-5xl scrollbar-hide min-h-[55px] overflow-hidden"
                placeholder={`Your ${singular(collection)} title`}
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
