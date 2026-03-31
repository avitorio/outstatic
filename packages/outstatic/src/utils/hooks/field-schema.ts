import type { CustomFieldsType } from '@/types'

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

export type FieldSchemaType = {
  title: string
  type: string
  properties: CustomFieldsType
} | null

export type FieldSchemaCommitAction = 'add' | 'edit' | 'delete'

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
  const scope =
    target.kind === 'collection' ? target.slug : `singleton/${target.slug}`

  return `feat(${scope}): ${action} ${fieldName} field`
}

const getFieldSchemaDocumentTitle = (target: FieldSchemaTarget) =>
  target.kind === 'collection' ? target.slug : target.title

export const createFieldSchemaDocument = (
  target: FieldSchemaTarget,
  customFields: CustomFieldsType
) =>
  JSON.stringify(
    {
      title: getFieldSchemaDocumentTitle(target),
      type: 'object',
      properties: { ...customFields }
    },
    null,
    2
  ) + '\n'
