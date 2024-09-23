import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/shadcn/dialog'
import { CreateBranchForm } from './create-branch-form'

interface CreateBranchDialogProps {
  showCreateBranchDialog: boolean
  setShowCreateBranchDialog: (show: boolean) => void
  callbackFunction?: ({ branchName }: { branchName: string }) => void
}

export const CreateBranchDialog: React.FC<CreateBranchDialogProps> = ({
  showCreateBranchDialog,
  setShowCreateBranchDialog,
  callbackFunction
}) => {
  return (
    <Dialog
      open={showCreateBranchDialog}
      onOpenChange={setShowCreateBranchDialog}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a New Branch</DialogTitle>
          <DialogDescription>Create a new GitHub branch.</DialogDescription>
        </DialogHeader>
        <CreateBranchForm
          onBranchCreated={(data: { branchName: string }) => {
            setShowCreateBranchDialog(false)
            if (callbackFunction) callbackFunction(data)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
