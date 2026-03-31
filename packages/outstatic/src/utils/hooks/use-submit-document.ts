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
import { useGetCollectionSchema } from './use-get-collection-schema'
import { useGetConfig } from './use-get-config'
import { useGetMediaFiles } from './use-get-media-files'
import { useGetMetadata } from './use-get-metadata'
import { useCollections } from './use-collections'
import useOid from './use-oid'
import { ConfigType } from '../metadata/types'
import { toast } from 'sonner'
import {
  addReferencedMedia,
  buildMergedContent,
  createMetadataState,
  replaceConfigFile,
  replaceMediaFile,
  syncCustomFieldTags
} from './use-submit-entry-shared'

type SubmitDocumentProps = {
  session: LoginSession | null
  slug: string
  setSlug: (slug: string) => void
  setShowDelete: (showDelete: boolean) => void
  setLoading: (loading: boolean) => void
  files: FileType[]
  collection: string
  customFields: CustomFieldsType
  setCustomFields: (customFields: CustomFieldsType) => void
  setHasChanges: (hasChanges: boolean) => void
  editor: Editor | null
  extension: MDExtensions
  documentMetadata: Record<string, any>
}

type OnSubmitOptions = {
  configUpdate?: Partial<ConfigType>
}

function useSubmitDocument({
  session,
  slug,
  setSlug,
  setShowDelete,
  setLoading,
  files,
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
    basePath,
    publicMediaPath,
    repoMediaPath,
    mediaJsonPath,
    configJsonPath
  } = useOutstatic()
  const fetchOid = useOid()

  const { refetch: refetchSchema } = useGetCollectionSchema({ enabled: false })
  const { refetch: refetchMetadata } = useGetMetadata({ enabled: false })
  const { refetch: refetchMedia } = useGetMediaFiles({ enabled: false })
  const { refetch: refetchCollections } = useCollections({ enabled: false })
  const { refetch: refetchConfig } = useGetConfig({ enabled: false })

  const onSubmit = useCallback(
    async (data: Document, options?: OnSubmitOptions) => {
      const { configUpdate } = options ?? {}
      setLoading(true)

      if (!editor) {
        throw new Error('Editor is not initialized')
      }

      try {
        const [
          { data: schema, isError: schemaError },
          { data: metadata, isError: metadataError },
          { data: collections, isError: collectionsError }
        ] = await Promise.all([
          refetchSchema(),
          refetchMetadata(),
          refetchCollections()
        ])

        if (schemaError || metadataError || collectionsError) {
          throw new Error('Failed to fetch schema or metadata from GitHub')
        }

        const collectionInfo = collections?.find(
          (collectionEntry) => collectionEntry.slug === collection
        )
        const collectionPath = collectionInfo?.path
          ? `${collectionInfo.path}/`
          : ''

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
        const newSlug = data.slug

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

        const { content: nextContent, media } = addReferencedMedia({
          files,
          content,
          capi,
          repoMediaPath,
          publicMediaPath
        })
        content = nextContent

        const { data: matterData } = matter(content)

        capi.replaceFile(`${collectionPath}${newSlug}.${extension}`, content)

        const { customFields: nextCustomFields, hasNewTag } =
          syncCustomFieldTags({
            customFields,
            data,
            matterData,
            setCustomFields
          })

        if (hasNewTag) {
          const customFieldsJSON = JSON.stringify(
            {
              ...schema,
              properties: { ...nextCustomFields }
            },
            null,
            2
          )

          capi.replaceFile(
            `${ostContent}/${collection}/schema.json`,
            customFieldsJSON + '\n'
          )
        }

        const metadataState = createMetadataState(metadata)
        const state = MurmurHash3(content)

        const newMeta = Array.isArray(metadataState.metadata)
          ? metadataState.metadata.filter(
              (entry) =>
                entry.collection !== collection ||
                (entry.slug !== oldSlug && entry.slug !== newSlug)
            )
          : []

        newMeta.push({
          ...matterData,
          slug: newSlug,
          collection,
          __outstatic: {
            hash: `${state.result()}`,
            commit: metadataState.commit,
            path: monorepoPath
              ? `${collectionPath}${newSlug}.${extension}`.replace(
                  monorepoPath,
                  ''
                )
              : `${collectionPath}${newSlug}.${extension}`
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
          loading: 'Saving changes...',
          success: 'Changes saved successfully!',
          error: 'Failed to save changes'
        })

        setLoading(false)
        setHasChanges(false)
        setSlug(newSlug)
        setShowDelete(true)
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
      setShowDelete,
      setLoading,
      files,
      createCommit,
      fetchOid,
      monorepoPath,
      ostContent,
      collection,
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
      documentMetadata,
      refetchSchema,
      refetchMetadata,
      refetchMedia,
      refetchCollections,
      refetchConfig,
      publicMediaPath,
      repoMediaPath
    ]
  )

  return onSubmit
}

export default useSubmitDocument
