import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/shadcn/dialog'
import { MediaSettings } from '@/client/pages/settings/_components/media-settings'

interface MediaSettingsDialogProps {
  showMediaPathDialog: boolean
  setShowMediaPathDialog: (show: boolean) => void
  callbackFunction?: () => void | Promise<void>
}

export const MediaSettingsDialog: React.FC<MediaSettingsDialogProps> = ({
  showMediaPathDialog,
  setShowMediaPathDialog,
  callbackFunction
}) => {
  return (
    <Dialog open={showMediaPathDialog} onOpenChange={setShowMediaPathDialog}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Media Settings</DialogTitle>
          <DialogDescription>
            Configure your media sources, folders, and supported file types.
          </DialogDescription>
        </DialogHeader>
        <MediaSettings
          onSettingsUpdate={() => {
            if (callbackFunction) callbackFunction()

            setShowMediaPathDialog(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
