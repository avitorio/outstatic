import * as yup from 'yup'
import { CustomFields, SchemaShape } from '../types'

const documentShape = {
  title: yup.string().required('Title is required.'),
  publishedAt: yup.date().required('Date is required.'),
  content: yup.string().required('Content is required.'),
  status: yup
    .string()
    .equals(['published', 'draft'])
    .required('Status is missing.'),
  author: yup.object().shape({
    name: yup.string(),
    picture: yup.string()
  }),
  slug: yup
    .string()
    .matches(/^(?!new$)/, 'The word "new" is not a valid slug.')
    .matches(
      /^[a-z0-9-]+$/,
      'Slugs can only contain lowercase letters, numbers and dashes.'
    )
    .matches(
      /^[a-z](-?[a-z])*$/,
      'Slugs can only start and end with a letter and cannot contain two dashes in a row.'
    )
    .required(),
  description: yup.string(),
  coverImage: yup.string()
}

export const editDocumentSchema: yup.SchemaOf<SchemaShape> = yup
  .object()
  .shape(documentShape)

export const convertSchemaToYup = (customFields: CustomFields) => {
  const shape: SchemaShape = {}

  Object.entries(customFields).map(([name, { type, required }]) => {
    const fieldType = type === 'text' ? 'string' : type
    shape[name] = required ? yup[fieldType]().required() : yup[fieldType]()
  })

  const yupSchema = yup.object().shape({ ...documentShape, ...shape })
  return yupSchema
}
