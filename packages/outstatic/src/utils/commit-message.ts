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
  label
}: CreateOutstaticCommitMessageParams): string => {
  const statusPart = status ? ` ${status}` : ''
  const targetPart = target ? ` ${target}` : ''
  const sanitizedLabel = label ? sanitizeCommitLabel(label) : ''
  const labelPart = sanitizedLabel ? ` "${sanitizedLabel}"` : ''

  return `${action}${statusPart}${targetPart}${labelPart} [outstatic:${scope}]`
}
