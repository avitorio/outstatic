export type OutstaticCommitScope = 'content' | 'media' | 'config'

export type OutstaticCommitAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'publish'
  | 'unpublish'
  | 'upload'

export type OutstaticContentStatus = 'draft' | 'published'

export type CreateOutstaticCommitMessageParams = {
  scope: OutstaticCommitScope
  action: OutstaticCommitAction
  status?: OutstaticContentStatus
  target?: string
  label?: string
  renamedFrom?: string
}

const sanitizeCommitLabel = (label: string) =>
  label
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/"/g, '\\"')
    .trim()

export const createOutstaticCommitMessage = ({
  scope,
  action,
  status,
  target,
  label,
  renamedFrom
}: CreateOutstaticCommitMessageParams): string => {
  const statusPart = status ? ` ${status}` : ''
  const targetPart = target ? ` ${target}` : ''
  const sanitizedLabel = label ? sanitizeCommitLabel(label) : ''
  const labelPart = sanitizedLabel ? ` "${sanitizedLabel}"` : ''
  const renamedPart = renamedFrom?.trim()
    ? ` (renamed from ${renamedFrom.trim()})`
    : ''

  return `${action}${statusPart}${targetPart}${labelPart}${renamedPart} [outstatic:${scope}]`
}

export const deriveContentCommitAction = (
  isCreate: boolean,
  previousStatus: OutstaticContentStatus | undefined,
  nextStatus: OutstaticContentStatus
): OutstaticCommitAction => {
  if (isCreate) return 'create'
  if (previousStatus === 'draft' && nextStatus === 'published') return 'publish'
  if (previousStatus === 'published' && nextStatus === 'draft')
    return 'unpublish'
  return 'update'
}
