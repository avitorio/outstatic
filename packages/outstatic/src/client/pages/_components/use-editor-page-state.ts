import { useEditor } from '@/components/editor/editor-context'
import { useTipTap } from '@/components/editor/hooks/use-tip-tap'
import { CustomFieldsType, Document, MDExtensions } from '@/types'
import { deepReplace } from '@/utils/deep-replace'
import { editDocumentSchema } from '@/utils/schemas/edit-document-schema'
import { convertSchemaToZod } from '@/utils/zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

type SchemaWithProperties = {
  properties: CustomFieldsType
}

type UseEditorPageStateArgs = {
  schema?: SchemaWithProperties | null
  initialExtension: MDExtensions
  setHasChanges: (hasChanges: boolean) => void
}

export function useEditorPageState({
  schema,
  initialExtension,
  setHasChanges
}: UseEditorPageStateArgs) {
  const [documentSchema, setDocumentSchema] = useState(editDocumentSchema)
  //@ts-ignore
  const methods = useForm<Document>({ resolver: zodResolver(documentSchema) })

  const { editor, setEditor } = useEditor()
  const { editor: tiptapEditor } = useTipTap({ ...methods })

  useEffect(() => {
    setEditor(tiptapEditor)
  }, [tiptapEditor, setEditor])

  const [customFields, setCustomFields] = useState<CustomFieldsType>({})
  const [extension, setExtension] = useState<MDExtensions>(initialExtension)
  const [metadata, setMetadata] = useState<Record<string, any>>({})

  const editDocument = (property: string, value: any) => {
    const formValues = methods.getValues()
    const newValue = deepReplace(formValues, property, value)
    methods.reset(newValue)
  }

  useEffect(() => {
    if (schema) {
      const zodSchema = convertSchemaToZod(schema)

      setDocumentSchema(zodSchema)
      setCustomFields(schema.properties)
    }
  }, [schema])

  useEffect(() => {
    if (schema && metadata) {
      const dateFields: string[] = []

      Object.entries(schema.properties).forEach(
        ([key, value]: [string, any]) => {
          if (value?.dataType === 'date') {
            dateFields.push(key)
          }
        }
      )

      const currentValues = methods.getValues()
      const updates: Record<string, Date> = {}

      dateFields.forEach((field) => {
        if (
          currentValues[field as keyof Document] &&
          typeof currentValues[field as keyof Document] === 'string'
        ) {
          updates[field] = new Date(
            currentValues[field as keyof Document] as string
          )
        }
      })

      if (Object.keys(updates).length > 0) {
        methods.reset({
          ...currentValues,
          ...updates
        })
        setHasChanges(false)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schema, metadata])

  useEffect(() => {
    const subscription = methods.watch((_, { name, type }) => {
      if (type === 'change' || name === 'content') {
        setHasChanges(true)
      }
    })
    return () => subscription.unsubscribe()
  }, [methods, setHasChanges])

  return {
    methods,
    editor,
    customFields,
    setCustomFields,
    extension,
    setExtension,
    metadata,
    setMetadata,
    editDocument
  }
}
