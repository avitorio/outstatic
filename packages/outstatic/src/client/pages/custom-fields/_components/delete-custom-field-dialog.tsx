import React, { useEffect, useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/shadcn/alert-dialog'
import { Button } from '@/components/ui/shadcn/button'
import { SpinnerIcon } from '@/components/ui/outstatic/spinner-icon'
import { useCustomFieldCommit } from './use-custom-field-commit'
import { useGetCollectionSchema } from '@/utils/hooks/useGetCollectionSchema'
import { useOutstatic } from '@/utils/hooks'
import { CustomFieldsType } from '@/types'

interface DeleteCustomFieldDialogProps {
  collection: string
  showDeleteModal: boolean
  setShowDeleteModal: (show: boolean) => void
  fieldName: string
  setFieldName: (name: string) => void
  selectedField: string
  setSelectedField: (field: string) => void
  customFields: CustomFieldsType
  setCustomFields: (fields: CustomFieldsType) => void
}

export const DeleteCustomFieldDialog: React.FC<
  DeleteCustomFieldDialogProps
> = ({
  collection,
  showDeleteModal,
  setShowDeleteModal,
  fieldName,
  setFieldName,
  selectedField,
  setSelectedField,
  customFields,
  setCustomFields
}) => {
  const { setHasChanges } = useOutstatic()
  const [deleting, setDeleting] = useState(false)
  const { data: schema, isLoading } = useGetCollectionSchema({ collection })

  const capiHelper = useCustomFieldCommit()

  useEffect(() => {
    if (schema) {
      setCustomFields(schema.properties)
    }
  }, [schema])

  const deleteField = async (name: string) => {
    setDeleting(true)

    try {
      let newCustomFields = { ...customFields }
      delete newCustomFields[name]
      await capiHelper({
        customFields: newCustomFields,
        deleteField: true,
        collection,
        schema,
        fieldName,
        selectedField,
        setCustomFields
      })
      setCustomFields(newCustomFields)
    } catch (error) {
      console.log({ error })
    }

    onOpenChange(false)
  }

  const onOpenChange = (value: boolean) => {
    if (!value) {
      setHasChanges(false)
      setSelectedField('')
      setFieldName('')
      setDeleting(false)
    }
    setShowDeleteModal(value)
  }

  return (
    <AlertDialog open={showDeleteModal} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete {customFields[selectedField]?.title} Field
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the{' '}
            {customFields[selectedField]?.title} field?
            <br />
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={() => deleteField(selectedField)}
            >
              {deleting ? (
                <>
                  <SpinnerIcon className="text-background mr-2" />
                  Deleting
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
