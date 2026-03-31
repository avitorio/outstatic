import { useState } from 'react'
import { CustomFieldsType } from '@/types'
import { SpinnerIcon } from '@/components/ui/outstatic/spinner-icon'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/shadcn/alert-dialog'
import { Button } from '@/components/ui/shadcn/button'
import { FieldSchemaTarget } from '@/utils/hooks/field-schema'
import { useFieldSchemaCommit } from '@/utils/hooks/use-field-schema-commit'
import { useOutstatic } from '@/utils/hooks/use-outstatic'

type DeleteFieldDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  target: FieldSchemaTarget
  selectedField: string
  customFields: CustomFieldsType
  setCustomFields: (fields: CustomFieldsType) => void
}

export const DeleteFieldDialog = ({
  open,
  onOpenChange,
  target,
  selectedField,
  customFields,
  setCustomFields
}: DeleteFieldDialogProps) => {
  const { setHasChanges } = useOutstatic()
  const [deleting, setDeleting] = useState(false)
  const commitFieldSchema = useFieldSchemaCommit(target)
  const selectedFieldDefinition = customFields[selectedField]

  const handleDialogChange = (value: boolean) => {
    if (!value) {
      setHasChanges(false)
      setDeleting(false)
    }

    onOpenChange(value)
  }

  const handleDelete = async () => {
    setDeleting(true)

    const nextCustomFields = { ...customFields }
    delete nextCustomFields[selectedField]

    const didCommit = await commitFieldSchema({
      customFields: nextCustomFields,
      action: 'delete',
      fieldName: selectedField
    })
    if (!didCommit) {
      setDeleting(false)
      return
    }

    setCustomFields(nextCustomFields)
    handleDialogChange(false)
  }

  if (!selectedFieldDefinition) {
    return null
  }

  return (
    <AlertDialog open={open} onOpenChange={handleDialogChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete {selectedFieldDefinition.title} Field
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the {selectedFieldDefinition.title}{' '}
            field?
            <br />
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline" onClick={() => handleDialogChange(false)}>
              Cancel
            </Button>
          </AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={deleting}
            onClick={handleDelete}
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
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
