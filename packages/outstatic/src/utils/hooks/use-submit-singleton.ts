import { CustomFieldsType, Document, FileType, MDExtensions } from '@/types'
import { createCommitApi } from '@/utils/create-commit-api'
import { useOutstatic } from '@/utils/hooks/use-outstatic'
import { stringifyMetadata } from '@/utils/metadata/stringify'
import { LoginSession } from '@/utils/auth/auth'
import { Editor } from '@tiptap/react'
import matter from 'gray-matter'
import MurmurHash3 from 'imurmurhash'
import { useCallback } from 'react'
import { useCreateCommit } from './use-create-commit'
import { useGetConfig } from './use-get-config'
import { useGetMediaFiles } from './use-get-media-files'
import { useGetMetadata } from './use-get-metadata'
import { useGetSingletonSchema } from './use-get-singleton-schema'
import { useSingletons } from './use-singletons'
import useOid from './use-oid'
import { ConfigType } from '../metadata/types'
import { toast } from 'sonner'
import { slugify } from 'transliteration'
import {
  addReferencedMedia,
  buildMergedContent,
  createMetadataState,
  replaceConfigFile,
  replaceMediaFile,
  syncCustomFieldTags
} from './use-submit-entry-shared'

type SubmitSingletonProps = {
  session: LoginSession | null
  slug: string
  setSlug: (slug: string) => void
  isNew: boolean
  setIsNew: (isNew: boolean) => void
  setShowDelete: (showDelete: boolean) => void
  setLoading: (loading: boolean) => void
  files: FileType[]
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

      if (!editor) {
        throw new Error('Editor is not initialized')
      }

      try {
        let actualSlug = slug
        if (isNew) {
          const title = data.title || 'untitled'
          actualSlug = slugify(title, { allowedChars: 'a-zA-Z0-9.' })

          const { data: singletons } = await refetchSingletons()
          if (singletons?.find((singleton) => singleton.slug === actualSlug)) {
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

        let content = buildMergedContent({
          data,
          documentMetadata,
          editor,
          basePath,
          repoOwner,
          repoSlug,
          repoBranch,
          repoMediaPath,
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
        const contentFilePath = existingFilePath
          ? existingFilePath
          : hasCustomPath
            ? `${path ? `${path}/` : ''}${actualSlug}.${extension}`
            : `${singletonsPath}/${actualSlug}.${extension}`

        const contentDirectory = existingFilePath
          ? existingFilePath.substring(0, existingFilePath.lastIndexOf('/'))
          : hasCustomPath
            ? path || ''
            : singletonsPath

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

        const { content: nextContent, media } = addReferencedMedia({
          files,
          content,
          capi,
          repoMediaPath,
          publicMediaPath
        })
        content = nextContent

        const { data: matterData } = matter(content)

        capi.replaceFile(contentFilePath, content)

        const { customFields: nextCustomFields, hasNewTag } =
          syncCustomFieldTags({
            customFields,
            data,
            matterData,
            setCustomFields
          })

        if (hasNewTag && !isNew) {
          const customFieldsJSON = JSON.stringify(
            {
              ...schema,
              properties: { ...nextCustomFields }
            },
            null,
            2
          )

          capi.replaceFile(
            `${singletonsPath}/${actualSlug}.schema.json`,
            customFieldsJSON + '\n'
          )
        }

        const metadataState = createMetadataState(metadata)
        const state = MurmurHash3(content)

        const newMeta = Array.isArray(metadataState.metadata)
          ? metadataState.metadata.filter(
              (entry) =>
                entry.collection !== '_singletons' || entry.slug !== actualSlug
            )
          : []

        newMeta.push({
          ...matterData,
          slug: actualSlug,
          collection: '_singletons',
          __outstatic: {
            hash: `${state.result()}`,
            commit: metadataState.commit,
            path: monorepoPath
              ? contentFilePath.replace(monorepoPath, '')
              : contentFilePath
          }
        })

        capi.replaceFile(
          `${ostContent}/metadata.json`,
          stringifyMetadata({ ...metadataState, metadata: newMeta })
        )

        await replaceMediaFile({
          media,
          metadataState,
          refetchMedia,
          mediaJsonPath,
          capi
        })

        await replaceConfigFile({
          configUpdate,
          refetchConfig,
          configJsonPath,
          capi
        })

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
