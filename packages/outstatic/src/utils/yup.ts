import { CustomFields, SchemaShape } from '@/types'
import * as yup from 'yup'
import { AssertsShape, TypeOfShape } from 'yup/lib/object'
import { AnyObject } from 'yup/lib/types'
import { slugRegex } from './slugRegex'

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
      slugRegex,
      'Slug must contain only lowercase letters, numbers, and hyphens, and cannot start or end with a hyphen.'
    )
    .max(200, 'Slugs can be a maximum of 200 characters.')
    .required(),
  description: yup.string(),
  coverImage: yup.string()
}

export const editDocumentSchema: yup.SchemaOf<SchemaShape> = yup
  .object()
  .shape(documentShape)

export const convertSchemaToYup = (customFields: {
  properties: CustomFields
}): yup.ObjectSchema<any, AnyObject, TypeOfShape<any>, AssertsShape<any>> => {
  const shape: SchemaShape = {}

  for (const [name, fields] of Object.entries(customFields.properties)) {
    shape[name] = yup[fields.dataType]()
    if (fields.required) {
      shape[name] = shape[name].required(`${fields.title} is a required field.`)
    }
    if (fields.dataType === 'number') {
      shape[name] = shape[name].typeError(
        `${fields.title} is a required field.`
      )
    }
    if (fields.dataType === 'array' && fields.required) {
      shape[name] = shape[name].min(1, `${fields.title} is a required field.`)
    }
  }

  const mergedSchema = yup.object().shape({
    ...documentShape,
    ...shape
  })

  return mergedSchema
}
