import { CommitAPI } from '@/utils/create-commit-api'
import { hashFromUrl } from '@/utils/hash-from-url'
import { mergeMdMeta } from '@/utils/merge-md-meta'
import { stringifyMedia } from '@/utils/metadata/stringify'
import {
  CustomFieldArrayValue,
  CustomFieldsType,
  Document,
  FileType,
  isArrayCustomField
} from '@/types'
import { Editor } from '@tiptap/react'
import stringify from 'json-stable-stringify'
import MurmurHash3 from 'imurmurhash'
import {
  ConfigType,
  MediaItem,
  MediaSchema,
  MetadataSchema,
  MetadataType
} from '../metadata/types'

type BuildMergedContentArgs = {
  data: Document
  documentMetadata: Record<string, any>
  editor: Editor
  basePath: string
  repoOwner: string
  repoSlug: string
  repoBranch: string
  repoMediaPath: string
  publicMediaPath: string
}

export function buildMergedContent({
  data,
  documentMetadata,
  editor,
  basePath,
  repoOwner,
  repoSlug,
  repoBranch,
  repoMediaPath,
  publicMediaPath
}: BuildMergedContentArgs) {
  const mdContent = editor.storage.markdown.getMarkdown()

  return mergeMdMeta({
    data: { ...documentMetadata, ...data, content: mdContent },
    basePath,
    repoInfo: `${repoOwner}/${repoSlug}/${repoBranch}/${repoMediaPath}`,
    publicMediaPath
  })
}

type AddReferencedMediaArgs = {
  files: FileType[]
  content: string
  capi: CommitAPI
  repoMediaPath: string
  publicMediaPath: string
}

export function addReferencedMedia({
  files,
  content,
  capi,
  repoMediaPath,
  publicMediaPath
}: AddReferencedMediaArgs) {
  const media: MediaItem[] = []
  let nextContent = content

  files.forEach(({ filename, blob, type, content: fileContents }) => {
    if (blob && nextContent.search(blob) !== -1) {
      const randString = window.btoa(Math.random().toString()).substring(10, 6)
      const newFilename = filename
        .toLowerCase()
        .replace(/[^a-zA-Z0-9-_\.]/g, '-')
        .replace(/(\.[^\.]*)?$/, `-${randString}$1`)

      capi.replaceFile(`${repoMediaPath}${newFilename}`, fileContents, false)

      media.push({
        __outstatic: {
          hash: `${MurmurHash3(fileContents).result()}`,
          commit: '',
          path: `${repoMediaPath}${newFilename}`
        },
        filename: newFilename,
        type,
        publishedAt: new Date().toISOString(),
        alt: ''
      })

      nextContent = nextContent.replace(
        blob,
        `/${publicMediaPath}${newFilename}`
      )
    }
  })

  return {
    content: nextContent,
    media
  }
}

type SyncCustomFieldTagsArgs = {
  customFields: CustomFieldsType
  data: Document
  matterData: Record<string, any>
  setCustomFields: (customFields: CustomFieldsType) => void
}

export function syncCustomFieldTags({
  customFields,
  data,
  matterData,
  setCustomFields
}: SyncCustomFieldTagsArgs) {
  let hasNewTag = false
  const nextCustomFields = { ...customFields }

  Object.entries(nextCustomFields).forEach(([key, field]) => {
    const customField = nextCustomFields[key]
    const dataKey = (data as Record<string, any>)[key]

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
          nextCustomFields[key] = customField
          hasNewTag = true
        }
      })
    }
  })

  if (hasNewTag) {
    setCustomFields(nextCustomFields)
  }

  return {
    customFields: nextCustomFields,
    hasNewTag
  }
}

type MetadataResponse =
  | {
      metadata?: {
        metadata?: MetadataType
      }
      commitUrl?: string
    }
  | null
  | undefined

export function createMetadataState(metadata: MetadataResponse) {
  const state: MetadataSchema = {
    metadata: (metadata?.metadata?.metadata || []) as MetadataType,
    commit: '',
    generated: new Date().toISOString()
  }

  state.commit = metadata?.commitUrl ? hashFromUrl(metadata.commitUrl) : ''

  return state
}

type ReplaceMediaFileArgs = {
  media: MediaItem[]
  metadataState: MetadataSchema
  refetchMedia: () => Promise<{
    data?: {
      media?: {
        media?: MediaItem[]
      }
    } | null
  }>
  mediaJsonPath: string
  capi: CommitAPI
}

export async function replaceMediaFile({
  media,
  metadataState,
  refetchMedia,
  mediaJsonPath,
  capi
}: ReplaceMediaFileArgs) {
  if (media.length === 0) {
    return
  }

  const { data: mediaData } = await refetchMedia()

  media.forEach((item) => {
    item.__outstatic.commit = metadataState.commit
  })

  const existingMedia = mediaData?.media?.media ?? []
  const mediaSchema = {
    commit: metadataState.commit,
    generated: metadataState.generated,
    media: existingMedia
  } as MediaSchema

  capi.replaceFile(
    mediaJsonPath,
    stringifyMedia({ ...mediaSchema, media: [...existingMedia, ...media] })
  )
}

type ReplaceConfigFileArgs = {
  configUpdate?: Partial<ConfigType>
  refetchConfig: () => Promise<{
    data?: ConfigType | null
  }>
  configJsonPath: string
  capi: CommitAPI
}

export async function replaceConfigFile({
  configUpdate,
  refetchConfig,
  configJsonPath,
  capi
}: ReplaceConfigFileArgs) {
  if (!configUpdate || Object.keys(configUpdate).length === 0) {
    return
  }

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
