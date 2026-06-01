import type { CustomFieldsType } from '@/types'
import { createOutstaticCommitMessage } from '@/utils/commit-message'

export type FieldSchemaTarget =
  | {
      kind: 'collection'
      slug: string
      title: string
    }
  | {
      kind: 'singleton'
      slug: string
      title: string
      isNew?: boolean
    }

export type FieldSchemaSettings = {
  fieldsOnlyMode?: boolean
  /** @deprecated Use fieldsOnlyMode instead. */
  disableBlockEditor?: boolean
}

export type FieldSchemaType = {
  title: string
  type: string
  settings?: FieldSchemaSettings
  properties: CustomFieldsType
} | null

export type FieldSchemaCommitAction =
  | 'add'
  | 'edit'
  | 'delete'
  | 'reorder'
  | 'settings'

export const isFieldsOnlyModeEnabled = (settings?: FieldSchemaSettings) =>
  settings?.fieldsOnlyMode === true || settings?.disableBlockEditor === true

export const normalizeFieldSchemaSettings = (
  settings?: FieldSchemaSettings
): FieldSchemaSettings | undefined => {
  if (!settings) {
    return undefined
  }

  const fieldsOnlyMode = settings.fieldsOnlyMode ?? settings.disableBlockEditor

  return typeof fieldsOnlyMode === 'boolean' ? { fieldsOnlyMode } : {}
}

export const getFieldSchemaFilePath = (
  target: FieldSchemaTarget,
  ostContent: string
) =>
  target.kind === 'collection'
    ? `${ostContent}/${target.slug}/schema.json`
    : `${ostContent}/_singletons/${target.slug}.schema.json`

export const getFieldSchemaRequestPath = (
  target: FieldSchemaTarget,
  ostContent: string,
  repoBranch: string
) => `${repoBranch}:${getFieldSchemaFilePath(target, ostContent)}`

export const getFieldSchemaQueryKey = (
  target: FieldSchemaTarget,
  ostContent: string,
  repoBranch: string
) =>
  [
    'field-schema',
    {
      kind: target.kind,
      slug: target.slug,
      filePath: getFieldSchemaRequestPath(target, ostContent, repoBranch)
    }
  ] as const

export const getFieldSchemaCommitMessage = (
  target: FieldSchemaTarget,
  action: FieldSchemaCommitAction,
  fieldName: string
) => {
  const scopeLabel =
    target.kind === 'collection' ? target.slug : `singleton/${target.slug}`

  const commitAction =
    action === 'add'
      ? 'create'
      : action === 'edit' || action === 'reorder' || action === 'settings'
        ? 'update'
        : 'delete'
  const label = `${scopeLabel} ${
    action === 'reorder' ? 'field order' : fieldName
  }`

  return createOutstaticCommitMessage({
    scope: 'config',
    action: commitAction,
    target: action === 'settings' ? 'settings' : 'field',
    label
  })
}

const getFieldSchemaDocumentTitle = (target: FieldSchemaTarget) =>
  target.kind === 'collection' ? target.slug : target.title

export const createFieldSchemaDocument = (
  target: FieldSchemaTarget,
  customFields: CustomFieldsType,
  settings?: FieldSchemaSettings
) => {
  const schemaSettings = normalizeFieldSchemaSettings(settings)
  const schema = {
    title: getFieldSchemaDocumentTitle(target),
    type: 'object',
    ...(schemaSettings ? { settings: schemaSettings } : {}),
    properties: { ...customFields }
  }

  return JSON.stringify(schema, null, 2) + '\n'
}
