import { CustomFieldsType, DocumentSchemaShape } from '@/types'
import * as yup from 'yup'
import { AssertsShape, TypeOfShape } from 'yup/lib/object'
import { AnyObject } from 'yup/lib/types'
import { documentShape } from './schemas/edit-document-schema'

export const convertSchemaToYup = (customFields: {
  properties: CustomFieldsType
}): yup.ObjectSchema<any, AnyObject, TypeOfShape<any>, AssertsShape<any>> => {
  const shape: DocumentSchemaShape = {}

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
