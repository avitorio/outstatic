import {
  CustomFieldArrayValue,
  CustomFieldsType,
  Document,
  FileType,
  MDExtensions,
  isArrayCustomField
} from '@/types'
import { createCommitApi } from '@/utils/create-commit-api'
import { hashFromUrl } from '@/utils/hash-from-url'
import { useOutstatic } from '@/utils/hooks/use-outstatic'
import { mergeMdMeta } from '@/utils/merge-md-meta'
import { stringifyMedia, stringifyMetadata } from '@/utils/metadata/stringify'
import { LoginSession } from '@/utils/auth/auth'
import { Editor } from '@tiptap/react'
import matter from 'gray-matter'
import MurmurHash3 from 'imurmurhash'
import stringify from 'json-stable-stringify'
import { useCallback } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { useCreateCommit } from './use-create-commit'
import { useGetSingletonSchema } from './use-get-singleton-schema'
import { useGetMetadata } from './use-get-metadata'
import useOid from './use-oid'
import { useGetMediaFiles } from './use-get-media-files'
import { useGetConfig } from './use-get-config'
import { useSingletons } from './use-singletons'
import {
  ConfigType,
  MediaItem,
  MediaSchema,
  MetadataSchema,
  MetadataType
} from '../metadata/types'
import { toast } from 'sonner'
import { slugify } from 'transliteration'

type SubmitSingletonProps = {
  session: LoginSession | null
  slug: string
  setSlug: (slug: string) => void
  isNew: boolean
  setIsNew: (isNew: boolean) => void
  setShowDelete: (showDelete: boolean) => void
  setLoading: (loading: boolean) => void
  files: FileType[]
  methods: UseFormReturn<Document, any, any>
  customFields: CustomFieldsType
  setCustomFields: (customFields: CustomFieldsType) => void
  setHasChanges: (hasChanges: boolean) => void
  editor: Editor | null
  extension: MDExtensions
  documentMetadata: Record<string, any>
  path?: string
  existingFilePath?: string
}

type OnSubmitOptions = {
  configUpdate?: Partial<ConfigType>
}

function useSubmitSingleton({
  session,
  slug,
  setSlug,
  isNew,
  setIsNew,
  setShowDelete,
  setLoading,
  files,
  customFields,
  setCustomFields,
  setHasChanges,
  editor,
  extension,
  documentMetadata,
  path,
  existingFilePath
}: SubmitSingletonProps) {
  const createCommit = useCreateCommit()
  const {
    repoOwner,
    repoSlug,
    repoBranch,
    monorepoPath,
    ostContent,
    basePath,
    publicMediaPath,
    repoMediaPath,
    mediaJsonPath,
    configJsonPath
  } = useOutstatic()
  const fetchOid = useOid()

  const { refetch: refetchSchema } = useGetSingletonSchema({
    slug,
    enabled: false
  })
  const { refetch: refetchMetadata } = useGetMetadata({ enabled: false })
  const { refetch: refetchMedia } = useGetMediaFiles({ enabled: false })
  const { refetch: refetchConfig } = useGetConfig({ enabled: false })
  const { refetch: refetchSingletons } = useSingletons({ enabled: false })

  const singletonsPath = `${ostContent}/_singletons`

  const onSubmit = useCallback(
    async (data: Document, options?: OnSubmitOptions) => {
      const { configUpdate } = options ?? {}
      setLoading(true)
      const media: MediaItem[] = []

      if (!editor) {
        throw new Error('Editor is not initialized')
      }

      try {
        // For new singletons, generate slug from title
        let actualSlug = slug
        if (isNew) {
          const title = data.title || 'untitled'
          actualSlug = slugify(title, { allowedChars: 'a-zA-Z0-9.' })

          // Check if singleton already exists
          const { data: singletons } = await refetchSingletons()
          if (singletons?.find((s) => s.slug === actualSlug)) {
            toast.error(`A singleton with slug "${actualSlug}" already exists.`)
            setLoading(false)
            return
          }
        }

        const [
          { data: schema, isError: schemaError },
          { data: metadata, isError: metadataError }
        ] = await Promise.all([
          isNew
            ? Promise.resolve({ data: null, isError: false })
            : refetchSchema(),
          refetchMetadata()
        ])

        if ((!isNew && schemaError) || metadataError) {
          throw new Error('Failed to fetch schema or metadata from GitHub')
        }

        const mdContent = editor.storage.markdown.getMarkdown()
        let content = mergeMdMeta({
          data: { ...documentMetadata, ...data, content: mdContent },
          basePath,
          repoInfo: `${repoOwner}/${repoSlug}/${repoBranch}/${repoMediaPath}`,
          publicMediaPath
        })
        const oid = await fetchOid()
        const owner = repoOwner || session?.user?.login || ''

        const capi = createCommitApi({
          message: isNew
            ? `feat(singleton): create ${actualSlug}`
            : `chore: Updates singleton ${actualSlug}`,
          owner,
          oid: oid ?? '',
          name: repoSlug,
          branch: repoBranch
        })

        const hasCustomPath = path !== undefined

        // Use existing file path if provided (for opening existing files),
        // otherwise use custom content path or default singletons path
        const contentFilePath = existingFilePath
          ? existingFilePath
          : hasCustomPath
            ? `${path ? `${path}/` : ''}${actualSlug}.${extension}`
            : `${singletonsPath}/${actualSlug}.${extension}`

        // Extract directory from existing file path
        const contentDirectory = existingFilePath
          ? existingFilePath.substring(0, existingFilePath.lastIndexOf('/'))
          : hasCustomPath
            ? path || ''
            : singletonsPath

        // For new singletons, create the schema.json file and update singletons.json
        if (isNew) {
          const schemaJson = {
            title: data.title || actualSlug,
            type: 'object',
            properties: {}
          }
          capi.replaceFile(
            `${singletonsPath}/${actualSlug}.schema.json`,
            JSON.stringify(schemaJson, null, 2) + '\n'
          )

          // Update singletons.json with the new singleton
          const { data: currentSingletons } = await refetchSingletons()
          const singletonsArray = currentSingletons ?? []
          singletonsArray.push({
            title: data.title || actualSlug,
            slug: actualSlug,
            directory: contentDirectory,
            path: contentFilePath,
            publishedAt: data.publishedAt?.toISOString(),
            status: data.status
          })
          capi.replaceFile(
            `${ostContent}/singletons.json`,
            JSON.stringify(singletonsArray, null, 2) + '\n'
          )
        }

        if (files.length > 0) {
          files.forEach(({ filename, blob, type, content: fileContents }) => {
            if (blob && content.search(blob) !== -1) {
              const randString = window
                .btoa(Math.random().toString())
                .substring(10, 6)
              const newFilename = filename
                .toLowerCase()
                .replace(/[^a-zA-Z0-9-_\.]/g, '-')
                .replace(/(\.[^\.]*)?$/, `-${randString}$1`)

              capi.replaceFile(
                `${repoMediaPath}${newFilename}`,
                fileContents,
                false
              )

              media.push({
                __outstatic: {
                  hash: `${MurmurHash3(fileContents).result()}`,
                  commit: '',
                  path: `${repoMediaPath}${newFilename}`
                },
                filename: newFilename,
                type: type,
                publishedAt: new Date().toISOString(),
                alt: ''
              })

              content = content.replace(
                blob,
                `/${publicMediaPath}${newFilename}`
              )
            }
          })
        }

        const { data: matterData } = matter(content)

        capi.replaceFile(contentFilePath, content)

        // Check if a new tag value was added
        let hasNewTag = false
        Object.entries(customFields).forEach(([key, field]) => {
          const customField = customFields[key]
          //@ts-ignore
          let dataKey = data[key]
          if (isArrayCustomField(field) && isArrayCustomField(customField)) {
            if (!Array.isArray(dataKey)) {
              matterData[key] = []
              return
            }

            dataKey.forEach((selectedTag: CustomFieldArrayValue) => {
              const exists = field.values.some(
                (savedTag: CustomFieldArrayValue) =>
                  savedTag.value === selectedTag.value
              )

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

        if (hasNewTag && !isNew) {
          const customFieldsJSON = JSON.stringify(
            {
              ...schema,
              properties: { ...customFields }
            },
            null,
            2
          )

          capi.replaceFile(
            `${singletonsPath}/${actualSlug}.schema.json`,
            customFieldsJSON + '\n'
          )
        }

        // update metadata for this singleton
        const m: MetadataSchema = {
          metadata: (metadata?.metadata?.metadata || []) as MetadataType,
          commit: '',
          generated: new Date().toISOString()
        }
        m.commit = metadata ? hashFromUrl(metadata.commitUrl) : ''

        const state = MurmurHash3(content)

        const newMeta = Array.isArray(m.metadata)
          ? m.metadata.filter(
              (c) => c.collection !== '_singletons' || c.slug !== actualSlug
            )
          : []

        newMeta.push({
          ...matterData,
          slug: actualSlug,
          collection: '_singletons',
          __outstatic: {
            hash: `${state.result()}`,
            commit: m.commit,
            path: monorepoPath
              ? contentFilePath.replace(monorepoPath, '')
              : contentFilePath
          }
        })

        capi.replaceFile(
          `${ostContent}/metadata.json`,
          stringifyMetadata({ ...m, metadata: newMeta })
        )

        // update media.json with new media
        if (media.length > 0) {
          const { data: mediaData } = await refetchMedia()

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
            mediaJsonPath,
            stringifyMedia({ ...mediaSchema, media: newMedia })
          )
        }

        // update config.json if configUpdate is provided
        if (configUpdate && Object.keys(configUpdate).length > 0) {
          const { data: config } = await refetchConfig()
          const updatedConfig = {
            ...(config ?? {}),
            ...configUpdate
          }
          capi.replaceFile(
            configJsonPath,
            // @ts-ignore
            stringify(updatedConfig, { space: 2 })
          )
        }

        const input = capi.createInput()

        toast.promise(createCommit.mutateAsync(input), {
          loading: isNew ? 'Creating singleton...' : 'Saving changes...',
          success: () => {
            if (isNew) {
              setSlug(actualSlug)
              refetchSingletons()
            }
            return isNew
              ? 'Singleton created successfully!'
              : 'Changes saved successfully!'
          },
          error: isNew ? 'Failed to create singleton' : 'Failed to save changes'
        })

        setLoading(false)
        setHasChanges(false)
        setShowDelete(true)
        setIsNew(false)
      } catch (error) {
        setLoading(false)
        console.log({ error })
      }
    },
    [
      repoOwner,
      session,
      slug,
      setSlug,
      isNew,
      setIsNew,
      setShowDelete,
      setLoading,
      files,
      createCommit,
      fetchOid,
      monorepoPath,
      ostContent,
      customFields,
      setCustomFields,
      repoSlug,
      repoBranch,
      setHasChanges,
      editor,
      basePath,
      extension,
      mediaJsonPath,
      configJsonPath,
      singletonsPath,
      refetchSingletons,
      refetchSchema,
      refetchMetadata,
      refetchMedia,
      refetchConfig,
      path,
      existingFilePath,
      publicMediaPath,
      repoMediaPath,
      documentMetadata
    ]
  )

  return onSubmit
}

export default useSubmitSingleton
