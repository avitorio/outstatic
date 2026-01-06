import { CustomFieldsType } from '@/types'

export type SingletonType = {
  title: string
  slug: string
  description?: string
}

export type SingletonsType = SingletonType[] | null

export type SingletonSchemaType = {
  title: string
  type: 'object'
  properties: CustomFieldsType
} | null
