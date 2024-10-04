import {
  CustomFieldArrayValue,
  CustomFieldsType,
  Document,
  FileType,
  MDExtensions,
  Session,
  isArrayCustomField
} from '@/types'
import { createCommitApi } from '@/utils/createCommitApi'
import { hashFromUrl } from '@/utils/hashFromUrl'
import useOutstatic from '@/utils/hooks/useOutstatic'
import { mergeMdMeta } from '@/utils/mergeMdMeta'
import { stringifyMedia, stringifyMetadata } from '@/utils/metadata/stringify'
import { Editor } from '@tiptap/react'
import matter from 'gray-matter'
import MurmurHash3 from 'imurmurhash'
import { useCallback } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { useCreateCommit } from './useCreateCommit'
import { useGetCollectionSchema } from './useGetCollectionSchema'
import { useGetMetadata } from './useGetMetadata'
import useOid from './useOid'
import { useGetMediaFiles } from './useGetMediaFiles'
import {
  MediaItem,
  MediaSchema,
  MetadataSchema,
  MetadataType,
  OutstaticSchema
} from '../metadata/types'
import { MEDIA_JSON_PATH } from '../constants'

type SubmitDocumentProps = {
  session: Session | null
  slug: string
  setSlug: (slug: string) => void
  setShowDelete: (showDelete: boolean) => void
  setLoading: (loading: boolean) => void
  files: FileType[]
  methods: UseFormReturn<Document, any>
  collection: string
  customFields: CustomFieldsType
  setCustomFields: (customFields: CustomFieldsType) => void
  setHasChanges: (hasChanges: boolean) => void
  editor: Editor
  extension: MDExtensions
  documentMetadata: Record<string, any>
}

function useSubmitDocument({
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
  documentMetadata
}: SubmitDocumentProps) {
  const createCommit = useCreateCommit()
  const {
    repoOwner,
    repoSlug,
    repoBranch,
    monorepoPath,
    ostContent,
    contentPath,
    basePath,
    publicMediaPath,
    repoMediaPath
  } = useOutstatic()
  const fetchOid = useOid()
  let media: MediaItem[] = []

  const { refetch: refetchSchema } = useGetCollectionSchema({ enabled: false })
  const { refetch: refetchMetadata } = useGetMetadata({
    enabled: false
  })
  const { refetch: refetchMedia } = useGetMediaFiles({
    enabled: false
  })

  const onSubmit = useCallback(
    async (data: Document) => {
      setLoading(true)

      try {
        const [
          { data: schema, isError: schemaError },
          { data: metadata, isError: metadataError }
        ] = await Promise.all([refetchSchema(), refetchMetadata()])

        if (schemaError || metadataError) {
          throw new Error('Failed to fetch schema or metadata from GitHub')
        }

        let collectionPath = `${ostContent}/${collection}/`

        if (schema?.path !== undefined) {
          if (schema.path !== '') {
            collectionPath = `${schema.path}/`
          } else {
            collectionPath = ''
          }
        }
        const document = methods.getValues()
        const mdContent = editor.storage.markdown.getMarkdown()

        let content = mergeMdMeta(
          { ...documentMetadata, ...data, content: mdContent },
          basePath,
          `${repoOwner}/${repoSlug}/${repoBranch}/${repoMediaPath}`,
          publicMediaPath
        )
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
          capi.removeFile(`${collectionPath}${oldSlug}.${extension}`)
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

              capi.replaceFile(
                `${
                  monorepoPath ? monorepoPath + '/' : ''
                }${repoMediaPath}${newFilename}`,
                fileContents,
                false
              )

              media.push({
                __outstatic: {
                  hash: `${MurmurHash3(fileContents).result()}`,
                  commit: '',
                  path: `${
                    monorepoPath ? monorepoPath + '/' : ''
                  }${repoMediaPath}${newFilename}`
                },
                filename: newFilename,
                type: type,
                publishedAt: new Date().toISOString(),
                alt: ''
              })

              // replace blob in content with path
              content = content.replace(
                blob,
                `${basePath}/${publicMediaPath}${newFilename}`
              )
            }
          })
        }

        const { data: matterData } = matter(content)

        capi.replaceFile(`${collectionPath}${newSlug}.${extension}`, content)

        // Check if a new tag value was added
        let hasNewTag = false
        Object.entries(customFields).forEach(([key, field]) => {
          const customField = customFields[key]
          //@ts-ignore
          let dataKey = data[key]
          // Only check for new values in array fields
          if (isArrayCustomField(field) && isArrayCustomField(customField)) {
            // If the metadata value is not an array, set it to an empty array
            if (!Array.isArray(dataKey)) {
              matterData[key] = []
              return
            }

            dataKey.forEach((selectedTag: CustomFieldArrayValue) => {
              // Check if the selected tag already exists
              const exists = field.values.some(
                (savedTag: CustomFieldArrayValue) =>
                  savedTag.value === selectedTag.value
              )

              // If the selected tag does not exist, add it
              if (!exists) {
                customField.values.push({
                  value: selectedTag.value,
                  label: selectedTag.label
                })
                customFields[key] = customField
                setCustomFields({ ...customFields })
                hasNewTag = true
              }
            })
          }
        })

        if (hasNewTag) {
          const customFieldsJSON = JSON.stringify(
            {
              ...schema,
              properties: { ...customFields }
            },
            null,
            2
          )

          capi.replaceFile(
            `${ostContent}/${collection}/schema.json`,
            customFieldsJSON + '\n'
          )
        }

        // update metadata for this post
        // requires final content for hashing
        const m: MetadataSchema = {
          metadata: (metadata?.metadata?.metadata || []) as MetadataType,
          commit: '',
          generated: new Date().toISOString()
        }
        m.commit = metadata ? hashFromUrl(metadata.commitUrl) : ''

        const state = MurmurHash3(content)

        const newMeta = Array.isArray(m.metadata)
          ? m.metadata.filter(
              (c) =>
                c.collection !== collection ||
                (c.slug !== oldSlug && c.slug !== newSlug)
            )
          : []

        newMeta.push({
          ...matterData,
          slug: newSlug,
          collection,
          __outstatic: {
            hash: `${state.result()}`,
            commit: m.commit,
            path: `${collectionPath}${newSlug}.${extension}`
          }
        })

        capi.replaceFile(
          `${ostContent}/metadata.json`,
          stringifyMetadata({ ...m, metadata: newMeta })
        )

        // update media.json with new media
        if (media.length > 0) {
          const { data: mediaData } = await refetchMedia()

          // loop through newMedia and add a commit to each
          media.forEach((media) => {
            media.__outstatic.commit = m.commit
          })

          const newMedia = [...(mediaData?.media?.media ?? []), ...media]

          const mediaSchema = {
            commit: m.commit,
            generated: m.generated,
            media: mediaData?.media?.media ?? []
          } as MediaSchema

          capi.replaceFile(
            MEDIA_JSON_PATH,
            stringifyMedia({ ...mediaSchema, media: newMedia })
          )
        }

        const input = capi.createInput()

        createCommit.mutate(input)
        setLoading(false)
        setHasChanges(false)
        setSlug(newSlug)
        setShowDelete(true)
      } catch (error) {
        // TODO: Better error treatment
        setLoading(false)
        console.log({ error })
      }
    },
    [
      repoOwner,
      session,
      slug,
      setSlug,
      setShowDelete,
      setLoading,
      files,
      createCommit,
      fetchOid,
      methods,
      monorepoPath,
      contentPath,
      ostContent,
      collection,
      customFields,
      setCustomFields,
      repoSlug,
      repoBranch,
      setHasChanges,
      editor,
      basePath,
      extension
    ]
  )

  return onSubmit
}

export default useSubmitDocument
