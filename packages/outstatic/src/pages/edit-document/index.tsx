import { yupResolver } from '@hookform/resolvers/yup'
import matter from 'gray-matter'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { singular } from 'pluralize'
import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import showdown from 'showdown'
import {
  AdminLayout,
  MDEditor,
  DocumentSettings,
  DocumentTitleInput
} from '../../components'
import { DocumentContext } from '../../context'
import { useCreateCommitMutation } from '../../graphql/generated'
import { CustomFields, Document, FileType } from '../../types'
import { useOstSession } from '../../utils/auth/hooks'
import { IMAGES_PATH } from '../../utils/constants'
import { deepReplace } from '../../utils/deepReplace'
import { escapeRegExp } from '../../utils/escapeRegExp'
import { getLocalDate } from '../../utils/getLocalDate'
import { replaceImageSrcRoot } from '../../utils/replaceImageSrc'
import useNavigationLock from '../../utils/useNavigationLock'
import useTipTap from '../../utils/useTipTap'
import { convertSchemaToYup, editDocumentSchema } from '../../utils/yup'
import useFileQuery from '../../utils/useFileQuery'
import useSubmitDocument from '../../utils/hooks/useSubmitDocument'

export default function EditDocument({ collection }: { collection: string }) {
  const router = useRouter()
  const [slug, setSlug] = useState(router.query?.ost?.[1] as string)
  const { session } = useOstSession()
  const [loading, setLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [files, setFiles] = useState<FileType[]>([])
  const [createCommit] = useCreateCommitMutation()
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

  const { data: documentQueryData } = useFileQuery({
    file: `${collection}/${slug}.md`,
    skip: slug === 'new' || !slug
  })

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
    createCommit,
    methods,
    collection,
    customFields,
    setCustomFields,
    setHasChanges
  })

  useEffect(() => {
    router.push(`/outstatic/${collection}/${slug}`, undefined, {
      shallow: true
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  useEffect(() => {
    const documentQueryObject = documentQueryData?.repository?.object

    if (documentQueryObject?.__typename === 'Blob') {
      let mdContent = documentQueryObject.text as string
      const { data, content } = matter(mdContent)

      const parseContent = () => {
        const converter = new showdown.Converter({ noHeaderId: true })
        const newContent = converter.makeHtml(content)

        // fetch images from GitHub in case deploy is not done yet
        return replaceImageSrcRoot(
          newContent,
          new RegExp(`^/${escapeRegExp(IMAGES_PATH)}`, 'gi'),
          '/api/outstatic/images/'
        )
      }

      const parsedContent = parseContent()

      const newDate = data.publishedAt
        ? new Date(data.publishedAt)
        : getLocalDate()
      const document = {
        ...data,
        publishedAt: newDate,
        content: parsedContent,
        slug
      }
      methods.reset(document)
      editor.commands.setContent(parsedContent)
      editor.commands.focus('start')
      setShowDelete(slug !== 'new')
    } else {
      // Set publishedAt value on slug update to avoid undefined on first render
      if (slug) {
        const formData = methods.getValues()

        methods.reset({
          ...formData,
          author: {
            name: session?.user.name,
            picture: session?.user.image ?? ''
          },
          coverImage: '',
          publishedAt: slug === 'new' ? getLocalDate() : formData.publishedAt
        })
      }
    }

    const subscription = methods.watch(() => setHasChanges(true))

    return () => subscription.unsubscribe()
  }, [documentQueryData, methods, slug, editor, session])

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
          crossOrigin="true"
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
