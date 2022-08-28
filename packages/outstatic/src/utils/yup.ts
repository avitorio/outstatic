import * as yup from 'yup'
import { PostType } from '../types'

export const editPostSchema: yup.SchemaOf<PostType> = yup.object().shape({
  title: yup.string().required('Title is required'),
  publishedAt: yup.date().required('Date is required'),
  content: yup.string().required('Content is required'),
  status: yup
    .string()
    .equals(['published', 'draft'])
    .required('Status is missing'),
  slug: yup
    .string()
    .matches(/^(?!new$)/, 'The word "new" is not a valid slug')
    .required(),
  description: yup.string()
})
