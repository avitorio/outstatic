import { CustomFieldsType, Document, FileType, MDExtensions } from '@/types'
import { createCommitApi } from '@/utils/create-commit-api'
import {
  createOutstaticCommitMessage,
  deriveContentCommitAction,
  type OutstaticContentStatus
} from '@/utils/commit-message'
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
import { getFirstImageMediaSource } from '../media-config'

type SingletonIndexEntry = {
  title: string
  slug: string
  directory: string
  path: string
  publishedAt?: string
  status?: string
}

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

type ResolveSingletonPathsArgs = {
  oldSlug: string
  nextSlug: string
  extension: MDExtensions
  singletonsPath: string
  path?: string
  existingFilePath?: string
}

type SingletonPaths = {
  oldContentPath: string
  newContentPath: string
  contentDirectory: string
  oldSchemaPath: string
  newSchemaPath: string
}

type BuildUpdatedSingletonsIndexArgs = {
  singletons: SingletonIndexEntry[]
  isNew: boolean
  oldSlug: string
  nextEntry: SingletonIndexEntry
}

const resolveSingletonPaths = ({
  oldSlug,
  nextSlug,
  extension,
  singletonsPath,
  path,
  existingFilePath
}: ResolveSingletonPathsArgs): SingletonPaths => {
  const hasCustomPath = path !== undefined
  const oldContentPath = existingFilePath
    ? existingFilePath
    : hasCustomPath
      ? `${path ? `${path}/` : ''}${oldSlug}.${extension}`
      : `${singletonsPath}/${oldSlug}.${extension}`

  const contentDirectory = oldContentPath.includes('/')
    ? oldContentPath.substring(0, oldContentPath.lastIndexOf('/'))
    : ''

  const newContentPath =
    contentDirectory.length > 0
      ? `${contentDirectory}/${nextSlug}.${extension}`
      : `${nextSlug}.${extension}`

  return {
    oldContentPath,
    newContentPath,
    contentDirectory,
    oldSchemaPath: `${singletonsPath}/${oldSlug}.schema.json`,
    newSchemaPath: `${singletonsPath}/${nextSlug}.schema.json`
  }
}

export const buildUpdatedSingletonsIndex = ({
  singletons,
  isNew,
  oldSlug,
  nextEntry
}: BuildUpdatedSingletonsIndexArgs) => {
  if (isNew) {
    return [...singletons, nextEntry]
  }

  return singletons.map((singleton) =>
    singleton.slug === oldSlug ? nextEntry : singleton
  )
}

export const stageSingletonRename = ({
  capi,
  oldContentPath,
  oldSchemaPath,
  didSlugChange
}: {
  capi: ReturnType<typeof createCommitApi>
  oldContentPath: string
  oldSchemaPath: string
  didSlugChange: boolean
}) => {
  if (!didSlugChange) {
    return
  }

  capi.removeFile(oldContentPath)
  capi.removeFile(oldSchemaPath)
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
    media,
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

  const imageMediaSource = getFirstImageMediaSource(media ?? [])

  const onSubmit = useCallback(
    async (data: Document, options?: OnSubmitOptions) => {
      const { configUpdate } = options ?? {}
      setLoading(true)

      if (!editor) {
        throw new Error('Editor is not initialized')
      }

      try {
        const title = data.title || 'untitled'
        const nextSlug =
          data.slug?.trim() ||
          slugify(title, { allowedChars: 'a-zA-Z0-9.' }) ||
          slug
        const oldSlug = slug
        const didSlugChange = !isNew && nextSlug !== oldSlug

        const { data: currentSingletons } = await refetchSingletons()
        const singletons = currentSingletons ?? []

        if (
          singletons.find(
            (singleton) =>
              singleton.slug === nextSlug && singleton.slug !== oldSlug
          )
        ) {
          toast.error(`A singleton with slug "${nextSlug}" already exists.`)
          setLoading(false)
          return
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
          media,
          repoMediaPath,
          publicMediaPath
        })
        const oid = await fetchOid()
        const owner = repoOwner || session?.user?.login || ''

        const rawStatus = documentMetadata?.status
        const previousStatus: OutstaticContentStatus | undefined =
          rawStatus === 'draft' || rawStatus === 'published'
            ? rawStatus
            : undefined
        const nextStatus = data.status
        const action = deriveContentCommitAction(
          isNew,
          previousStatus,
          nextStatus
        )

        const message = createOutstaticCommitMessage({
          scope: 'content',
          action,
          status:
            action === 'publish' || action === 'unpublish'
              ? undefined
              : nextStatus,
          label: data.title?.trim() || nextSlug,
          renamedFrom: didSlugChange ? oldSlug : undefined
        })

        const capi = createCommitApi({
          message,
          owner,
          oid: oid ?? '',
          name: repoSlug,
          branch: repoBranch
        })

        const {
          oldContentPath,
          newContentPath,
          contentDirectory,
          oldSchemaPath,
          newSchemaPath
        } = resolveSingletonPaths({
          oldSlug,
          nextSlug,
          extension,
          singletonsPath,
          path,
          existingFilePath
        })

        if (isNew) {
          const schemaJson = {
            title: data.title || nextSlug,
            type: 'object',
            properties: {}
          }
          capi.replaceFile(
            newSchemaPath,
            JSON.stringify(schemaJson, null, 2) + '\n'
          )
        }

        const { content: nextContent, media: nextMedia } = addReferencedMedia({
          files,
          content,
          capi,
          source: imageMediaSource
        })
        content = nextContent

        const { data: matterData } = matter(content)

        capi.replaceFile(newContentPath, content)

        const { customFields: nextCustomFields, hasNewTag } =
          syncCustomFieldTags({
            customFields,
            data,
            matterData,
            setCustomFields
          })

        const nextSchema =
          hasNewTag && !isNew
            ? {
                ...schema,
                properties: { ...nextCustomFields }
              }
            : schema

        if (!isNew && nextSchema && (hasNewTag || didSlugChange)) {
          capi.replaceFile(
            newSchemaPath,
            JSON.stringify(nextSchema, null, 2) + '\n'
          )
        }

        stageSingletonRename({
          capi,
          oldContentPath,
          oldSchemaPath,
          didSlugChange
        })

        const nextSingletonEntry: SingletonIndexEntry = {
          title: data.title || nextSlug,
          slug: nextSlug,
          // Keep the stored directory anchored to the content location. When a
          // singleton resolves to a root-level file, fall back to the standard
          // singletons directory instead of persisting an empty directory string.
          directory: contentDirectory || singletonsPath,
          path: newContentPath,
          publishedAt: data.publishedAt?.toISOString(),
          status: data.status
        }

        const updatedSingletons = buildUpdatedSingletonsIndex({
          singletons,
          isNew,
          oldSlug,
          nextEntry: nextSingletonEntry
        })

        capi.replaceFile(
          `${ostContent}/singletons.json`,
          JSON.stringify(updatedSingletons, null, 2) + '\n'
        )

        const metadataState = createMetadataState(metadata)
        const state = MurmurHash3(content)

        const newMeta = Array.isArray(metadataState.metadata)
          ? metadataState.metadata.filter(
              (entry) =>
                entry.collection !== '_singletons' ||
                (entry.slug !== oldSlug && entry.slug !== nextSlug)
            )
          : []

        newMeta.push({
          ...matterData,
          slug: nextSlug,
          collection: '_singletons',
          __outstatic: {
            hash: `${state.result()}`,
            commit: metadataState.commit,
            path: monorepoPath
              ? newContentPath.replace(monorepoPath, '')
              : newContentPath
          }
        })

        capi.replaceFile(
          `${ostContent}/metadata.json`,
          stringifyMetadata({ ...metadataState, metadata: newMeta })
        )

        await replaceMediaFile({
          media: nextMedia,
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

        await toast.promise(createCommit.mutateAsync(input), {
          loading: isNew ? 'Creating singleton...' : 'Saving changes...',
          success: () => {
            if (isNew || didSlugChange) {
              setSlug(nextSlug)
            }
            refetchSingletons()
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
      imageMediaSource,
      media,
      publicMediaPath,
      repoMediaPath,
      documentMetadata
    ]
  )

  return onSubmit
}

export default useSubmitSingleton
