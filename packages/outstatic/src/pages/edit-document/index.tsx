import { yupResolver } from '@hookform/resolvers/yup'
import matter from 'gray-matter'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { singular } from 'pluralize'
import { useContext, useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import showdown from 'showdown'
import {
  AdminLayout,
  MDEditor,
  DocumentSettings,
  DocumentTitleInput
} from '../../components'
import { OutstaticContext, DocumentContext } from '../../context'
import {
  useCreateCommitMutation,
  useDocumentQuery
} from '../../graphql/generated'
import { Document, FileType } from '../../types'
import { useOstSession } from '../../utils/auth/hooks'
import { IMAGES_PATH } from '../../utils/constants'
import { deepReplace } from '../../utils/deepReplace'
import { escapeRegExp } from '../../utils/escapeRegExp'
import { getLocalDate } from '../../utils/getLocalDate'
import { mergeMdMeta } from '../../utils/mergeMdMeta'
import { replaceImageSrcRoot } from '../../utils/replaceImageSrc'
import useNavigationLock from '../../utils/useNavigationLock'
import useOid from '../../utils/useOid'
import useTipTap from '../../utils/useTipTap'
import { editDocumentSchema } from '../../utils/yup'
import { createCommit as createCommitApi } from '../../utils/createCommit'
import { assertUnreachable } from '../../utils/assertUnreachable'
import { MetadataSchema } from '../../utils/metadata/types'
import { hashFromUrl } from '../../utils/hashFromUrl'
import MurmurHash3 from 'imurmurhash'
import { stringifyMetadata } from '../../utils/metadata/stringify'

type EditDocumentProps = {
  collection: string
}

export default function EditDocument({ collection }: EditDocumentProps) {
  const router = useRouter()
  const [slug, setSlug] = useState(router.query?.ost?.[1] as string)
  const { repoOwner, repoSlug, repoBranch, contentPath, monorepoPath } =
    useContext(OutstaticContext)
  const { session } = useOstSession()
  const [loading, setLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [files, setFiles] = useState<FileType[]>([])
  const [createCommit] = useCreateCommitMutation()
  const fetchOid = useOid()
  const [showDelete, setShowDelete] = useState(false)
  const methods = useForm<Document>({
    resolver: yupResolver(editDocumentSchema)
  })
  const { editor } = useTipTap({ ...methods })

  const editDocument = (property: string, value: any) => {
    const formValues = methods.getValues()
    const newValue = deepReplace(formValues, property, value)
    methods.reset(newValue)
  }

  const { data: documentQueryData } = useDocumentQuery({
    variables: {
      owner: repoOwner || session?.user?.login || '',
      name: repoSlug,
      filePath: `${repoBranch}:${
        monorepoPath ? monorepoPath + '/' : ''
      }${contentPath}/${collection}/${slug}.md`
    },
    fetchPolicy: 'network-only',
    skip: slug === 'new' || !slug
  })

  const { data: metadata } = useDocumentQuery({
    variables: {
      owner: repoOwner || session?.user?.login || '',
      name: repoSlug,
      filePath: `${repoBranch}:${
        monorepoPath ? monorepoPath + '/' : ''
      }${contentPath}/metadata.json`
    },
    fetchPolicy: 'network-only'
  })

  const onSubmit = async (data: Document) => {
    setLoading(true)
    try {
      const document = methods.getValues()
      let content = mergeMdMeta({ ...data })
      const { data: matterData } = matter(content)
      const oid = await fetchOid()
      const owner = repoOwner || session?.user?.login || ''
      const newSlug = document.slug

      // If the slug has changed, commit should delete old file
      const oldSlug = slug !== newSlug && slug !== 'new' ? slug : undefined

      const capi = createCommitApi({
        message: oldSlug
          ? `chore: Updates ${newSlug} formerly ${oldSlug}`
          : `chore: Updates/Creates ${newSlug}`,
        owner,
        oid: oid ?? '',
        name: repoSlug,
        branch: repoBranch
      })

      if (oldSlug) {
        capi.removeFile(
          `${
            monorepoPath ? monorepoPath + '/' : ''
          }${contentPath}/${collection}/${oldSlug}.md`
        )
      }

      if (files.length > 0) {
        files.forEach(({ filename, blob, type, content: fileContents }) => {
          // check if blob is still in the document before adding file to the commit
          if (blob && content.search(blob) !== -1) {
            const randString = window
              .btoa(Math.random().toString())
              .substring(10, 6)
            const newFilename = filename
              .toLowerCase()
              .replace(/[^a-zA-Z0-9-_\.]/g, '-')
              .replace(/(\.[^\.]*)?$/, `-${randString}$1`)

            const filePath = (() => {
              switch (type) {
                case 'images':
                  return IMAGES_PATH
                default:
                  assertUnreachable(type)
              }
            })()

            capi.replaceFile(
              `${
                monorepoPath ? monorepoPath + '/' : ''
              }public/${filePath}${newFilename}`,
              fileContents,
              false
            )

            // replace blob in content with path
            content = content.replace(blob, `/${filePath}${newFilename}`)
          }
        })
      }

      capi.replaceFile(
        `${
          monorepoPath ? monorepoPath + '/' : ''
        }${contentPath}/${collection}/${newSlug}.md`,
        content
      )

      // update metadata for this post
      // requires final content for hashing
      if (metadata?.repository?.object?.__typename === 'Blob') {
        const m = JSON.parse(
          metadata.repository.object.text ?? '{}'
        ) as MetadataSchema
        m.generated = new Date().toISOString()
        m.commit = hashFromUrl(metadata.repository.object.commitUrl)
        ;(m.metadata ?? []).filter(
          (c) =>
            c.collection !== collection &&
            (c.slug !== oldSlug || c.slug !== newSlug)
        )
        const state = MurmurHash3(content)
        m.metadata.push({
          ...matterData,
          title: matterData.title,
          publishedAt: matterData.publishedAt,
          status: matterData.published,
          slug: newSlug,
          collection,
          __outstatic: {
            hash: `${state.result()}`,
            commit: m.commit,
            path: `${contentPath}/${collection}/${newSlug}.md`
          }
        })

        capi.replaceFile(
          `${
            monorepoPath ? monorepoPath + '/' : ''
          }${contentPath}/metadata.json`,
          stringifyMetadata(m)
        )
      }

      const input = capi.createInput()

      await createCommit({
        variables: {
          input
        }
      })
      setLoading(false)
      setHasChanges(false)
      setSlug(newSlug)
      setShowDelete(true)
    } catch (error) {
      // TODO: Better error treatment
      setLoading(false)
      console.log({ error })
    }
  }

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
      const {
        data: { title, publishedAt, status, description, coverImage, author },
        content
      } = matter(mdContent)

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

      const newDate = publishedAt ? new Date(publishedAt) : getLocalDate()
      const document = {
        title,
        publishedAt: newDate,
        content: parsedContent,
        status,
        author: {
          name: author?.name,
          picture: author?.picture || ''
        },
        slug,
        description,
        coverImage
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
