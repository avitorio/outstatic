import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/shadcn/dialog'
import { CreateBranchForm } from './create-branch-form'
import { useOutstatic } from '@/utils/hooks'

interface CreateBranchDialogProps {
  branchName?: string
  showCreateBranchDialog: boolean
  setShowCreateBranchDialog: (show: boolean) => void
  callbackFunction?: ({ branchName }: { branchName: string }) => void
}

export const CreateBranchDialog: React.FC<CreateBranchDialogProps> = ({
  branchName = '',
  showCreateBranchDialog,
  setShowCreateBranchDialog,
  callbackFunction
}) => {
  const { repoBranch } = useOutstatic()
  return (
    <Dialog
      open={showCreateBranchDialog}
      onOpenChange={setShowCreateBranchDialog}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a New Branch</DialogTitle>
          <DialogDescription>
            Create a new branch from branch{' '}
            <span className="font-semibold">{repoBranch}</span>.
          </DialogDescription>
        </DialogHeader>
        <CreateBranchForm
          branchName={branchName}
          onBranchCreated={(data: { branchName: string }) => {
            setShowCreateBranchDialog(false)
            if (callbackFunction) callbackFunction(data)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
