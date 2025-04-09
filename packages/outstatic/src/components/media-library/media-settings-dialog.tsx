import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@outstatic/ui/dialog'
import { MediaSettings } from '@/client/pages/settings/_components/media-settings'

interface MediaSettingsDialogProps {
  title?: string
  description?: string
  showMediaPathDialog: boolean
  setShowMediaPathDialog: (show: boolean) => void
  callbackFunction?: () => void | Promise<void>
}

const MediaSettingsDialog: React.FC<MediaSettingsDialogProps> = ({
  title = 'First time here?',
  description = "It seems you haven't set up your media paths yet. Let's do that!",
  showMediaPathDialog,
  setShowMediaPathDialog,
  callbackFunction
}) => {
  return (
    <Dialog open={showMediaPathDialog} onOpenChange={setShowMediaPathDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
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

export default MediaSettingsDialog
