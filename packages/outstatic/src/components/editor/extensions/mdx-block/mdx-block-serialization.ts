import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { Block } from '@/utils/metadata/types'
import { buildBlockJsx } from '../slash-command/block-jsx'

export const getSerializedMdxBlock = (node: ProseMirrorNode) => {
  const { outstaticBlockDefinition, outstaticBlockValues } = node.attrs

  if (!outstaticBlockDefinition || !outstaticBlockValues) {
    return null
  }

  try {
    return buildBlockJsx(
      JSON.parse(outstaticBlockDefinition) as Block,
      JSON.parse(outstaticBlockValues)
    )
  } catch {
    return null
  }
}
