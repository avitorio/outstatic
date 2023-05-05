import * as yup from 'yup'
import { Document } from '../types'
import { slugRegex } from './slugRegex'

export const editDocumentSchema: yup.SchemaOf<Document> = yup.object().shape({
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
})
