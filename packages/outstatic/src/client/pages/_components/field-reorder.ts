import { arrayMove } from '@dnd-kit/sortable'
import type { CustomFieldsType } from '@/types'

export const reorderCustomFields = ({
  customFields,
  activeFieldName,
  overFieldName
}: {
  customFields: CustomFieldsType
  activeFieldName: string
  overFieldName?: string
}): CustomFieldsType => {
  if (!overFieldName || activeFieldName === overFieldName) {
    return customFields
  }

  const fieldEntries = Object.entries(customFields)
  const activeIndex = fieldEntries.findIndex(
    ([name]) => name === activeFieldName
  )
  const overIndex = fieldEntries.findIndex(([name]) => name === overFieldName)

  if (activeIndex === -1 || overIndex === -1) {
    return customFields
  }

  return Object.fromEntries(
    arrayMove(fieldEntries, activeIndex, overIndex)
  ) as CustomFieldsType
}
