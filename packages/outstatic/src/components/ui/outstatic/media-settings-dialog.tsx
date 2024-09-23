import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/shadcn/dialog'
import { MediaSettings } from '@/client/pages/settings/_components/media-settings'

interface MediaSettingsDialogProps {
  showMediaPathDialog: boolean
  setShowMediaPathDialog: (show: boolean) => void
  callbackFunction?: () => void
}

const MediaSettingsDialog: React.FC<MediaSettingsDialogProps> = ({
  showMediaPathDialog,
  setShowMediaPathDialog,
  callbackFunction
}) => {
  return (
    <Dialog open={showMediaPathDialog} onOpenChange={setShowMediaPathDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>First time here?</DialogTitle>
          <DialogDescription>
            It seems you haven&apos;t set up your media paths yet. Let&apos;s do
            that!
          </DialogDescription>
        </DialogHeader>
        <MediaSettings
          onSettingsUpdate={() => {
            setShowMediaPathDialog(false)
            if (callbackFunction) callbackFunction()
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

export default MediaSettingsDialog
