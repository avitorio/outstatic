import { CommitAPI } from '@/utils/create-commit-api'
import { hashFromUrl } from '@/utils/hash-from-url'
import { mergeMdMeta } from '@/utils/merge-md-meta'
import {
  collectBlockImports,
  dedupeImportStatements,
  splitLeadingImportStatements
} from '@/components/editor/extensions/mdx-block/mdx-block-serialization'
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
  MediaSourceConfig,
  MediaItem,
  MediaSchema,
  MetadataSchema,
  MetadataType
} from '../metadata/types'
import {
  buildPublicMediaPath,
  buildRepoMediaPath,
  getMediaTypeForFilename,
  syncLegacyMediaFields
} from '../media-config'

type BuildMergedContentArgs = {
  data: Document
  documentMetadata: Record<string, any>
  editor: Editor
  basePath: string
  repoOwner: string
  repoSlug: string
  repoBranch: string
  media?: MediaSourceConfig[]
  repoMediaPath?: string
  publicMediaPath?: string
}

export function buildMergedContent({
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
}: BuildMergedContentArgs) {
  const mdContent = editor.storage.markdown.getMarkdown()
  const { content, imports: leadingImports } =
    splitLeadingImportStatements(mdContent)
  const imports = dedupeImportStatements([
    ...leadingImports,
    ...collectBlockImports(editor)
  ]).join('\n')

  return mergeMdMeta({
    data: { ...documentMetadata, ...data, content },
    basePath,
    repoOwner,
    repoSlug,
    repoBranch,
    media,
    repoMediaPath,
    publicMediaPath,
    imports
  })
}

type AddReferencedMediaArgs = {
  files: FileType[]
  content: string
  capi: CommitAPI
  source?: MediaSourceConfig
}

export function addReferencedMedia({
  files,
  content,
  capi,
  source
}: AddReferencedMediaArgs) {
  const media: MediaItem[] = []
  let nextContent = content

  if (!source) {
    return {
      content,
      media
    }
  }

  files.forEach(({ filename, blob, type, content: fileContents }) => {
    if (blob && nextContent.search(blob) !== -1) {
      const randString = window.btoa(Math.random().toString()).substring(6, 10)
      const newFilename = filename
        .toLowerCase()
        .replace(/[^a-zA-Z0-9-_\.]/g, '-')
        .replace(/(\.[^\.]*)?$/, `-${randString}$1`)
      const repoPath = buildRepoMediaPath(source, newFilename)

      capi.replaceFile(repoPath, fileContents, false)

      media.push({
        __outstatic: {
          hash: `${MurmurHash3(fileContents).result()}`,
          commit: '',
          path: repoPath
        },
        filename: newFilename,
        type: getMediaTypeForFilename(newFilename, source),
        source: source.name,
        publishedAt: new Date().toISOString(),
        alt: ''
      })

      nextContent = nextContent.replace(
        blob,
        buildPublicMediaPath(source, newFilename)
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

    if (
      field.fieldType !== 'Tags' ||
      !isArrayCustomField(field) ||
      !isArrayCustomField(customField)
    ) {
      return
    }

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
  const nextConfig = {
    ...(config ?? {}),
    ...configUpdate
  }
  const updatedConfig = nextConfig.media
    ? syncLegacyMediaFields(nextConfig)
    : nextConfig

  capi.replaceFile(
    configJsonPath,
    // @ts-ignore
    stringify(updatedConfig, { space: 2 })
  )
}
