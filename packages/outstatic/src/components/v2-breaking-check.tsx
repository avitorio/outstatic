import { useEffect, useState } from 'react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction
} from '@/components/ui/shadcn/alert-dialog'
import { OUTSTATIC_VERSION } from '@/utils/constants'

export const V2BreakingCheck = () => {
  const [showOverlay, setShowOverlay] = useState(false)

  useEffect(() => {
    const bodyElement = document.querySelector('body')
    if (!bodyElement?.id?.includes('outstatic')) {
      bodyElement?.setAttribute('id', 'outstatic')
      setShowOverlay(true)
    }
  }, [])

  if (!showOverlay) return null

  const isBeta = OUTSTATIC_VERSION.includes('canary')

  return (
    <AlertDialog open={showOverlay}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Important Outstatic Update</AlertDialogTitle>
          <AlertDialogDescription>
            Starting from version 2.0, Outstatic requires additional
            configuration to work properly.
            <br />
            <br /> Please check the documentation for the required changes.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            onClick={() =>
              window.open(
                `https://${
                  isBeta ? 'beta.' : ''
                }outstatic.com/docs/upgrading-to-v2.0`,
                '_blank'
              )
            }
          >
            View Documentation
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
