import { CustomFieldsType } from '@/types'

export type SingletonType = {
  title: string
  slug: string
  description?: string
  path: string
  directory: string
  publishedAt: string
  status: 'published' | 'draft'
}

export type SingletonsType = SingletonType[] | null

export type SingletonSchemaType = {
  title: string
  type: 'object'
  properties: CustomFieldsType
} | null
