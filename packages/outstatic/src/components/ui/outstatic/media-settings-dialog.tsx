import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle
} from '@/components/ui/shadcn/dialog'
import { MediaSettings } from '@/client/pages/settings/_components/media-settings'
import * as VisuallyHidden from '@radix-ui/react-visually-hidden'

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
      <DialogContent
        showCloseButton={false}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <VisuallyHidden.Root>
          <DialogTitle>Media Settings</DialogTitle>
        </VisuallyHidden.Root>
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
