import * as yup from 'yup'
import { Document } from '../types'

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
      /^[a-z0-9-]+$/,
      'Slugs can only contain lowercase letters, numbers and dashes.'
    )
    .required(),
  description: yup.string(),
  coverImage: yup.string()
})
