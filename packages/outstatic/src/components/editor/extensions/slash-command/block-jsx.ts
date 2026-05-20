import { Block, BlockProp } from '@/utils/metadata/types'

export type BlockFormValues = Record<string, string | boolean>

const escapeAttributeValue = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')

export const isEmptyBlockValue = (value: string | boolean | undefined) =>
  value === undefined || value === ''

export const getBlockPropValue = (
  prop: BlockProp,
  values: BlockFormValues
): string | boolean | undefined => {
  const value = values[prop.name]

  if (typeof value === 'boolean') {
    return value
  }

  return value?.trim()
}

export const getInitialBlockValues = (block: Block): BlockFormValues =>
  block.props.reduce<BlockFormValues>((values, prop) => {
    values[prop.name] =
      prop.type === 'Boolean'
        ? prop.defaultValue === 'true'
        : prop.defaultValue || ''

    return values
  }, {})

export const buildBlockJsx = (block: Block, values: BlockFormValues) => {
  const attributes: string[] = []
  const childrenProp = block.props.find((prop) => prop.type === 'Children')
  const childrenValue = childrenProp
    ? getBlockPropValue(childrenProp, values)
    : undefined

  block.props.forEach((prop) => {
    if (prop.type === 'Children') {
      return
    }

    const value = getBlockPropValue(prop, values)

    if (isEmptyBlockValue(value)) {
      return
    }

    if (prop.type === 'Boolean') {
      if (value === true) {
        attributes.push(prop.name)
      }
      return
    }

    if (typeof value !== 'string') {
      return
    }

    if (prop.type === 'Number') {
      const numberValue = Number(value)
      if (Number.isFinite(numberValue)) {
        attributes.push(`${prop.name}={${value}}`)
      }
      return
    }

    if (prop.type === 'Text') {
      attributes.push(`${prop.name}={${JSON.stringify(value)}}`)
      return
    }

    attributes.push(`${prop.name}="${escapeAttributeValue(value)}"`)
  })

  const dynamicAttrs =
    attributes.length > 0 ? ` ${attributes.join(' ')}` : ''
  const extraAttrs = block.additionalAttributes?.trim()
    ? ` ${block.additionalAttributes.trim()}`
    : ''
  const attrs = `${dynamicAttrs}${extraAttrs}`

  if (typeof childrenValue === 'string' && childrenValue.length > 0) {
    return `<${block.name}${attrs}>\n${childrenValue}\n</${block.name}>`
  }

  return `<${block.name}${attrs} />`
}
