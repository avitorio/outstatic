'use client'

import { useState } from 'react'
import { FileTextIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/shadcn/dialog'
import { Button } from '@/components/ui/shadcn/button'
import { Label } from '@/components/ui/shadcn/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/shadcn/radio-group'
import { MDExtensions } from '@/utils/metadata/types'

interface MarkdownExtensionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fileName?: string
  onSave?: (format: MDExtensions) => void
}

export function MarkdownExtensionDialog({
  open,
  onOpenChange,
  fileName = 'document.mdx',
  onSave
}: MarkdownExtensionDialogProps) {
  const [format, setFormat] = useState<MDExtensions>('mdx')

  const displayFileName = fileName.replace(/\.(mdx|md)$/, `.${format}`)

  const handleSave = () => {
    onSave?.(format)
    onOpenChange(false)
  }

  const handleFormatChange = (value: MDExtensions) => {
    setFormat(value)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Default format for new documents</DialogTitle>
          <DialogDescription>
            Choose the format used when you create a new document. You can
            change this anytime in Settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">Save as:</span>
            <div className="flex items-center gap-1.5">
              <FileTextIcon className="text-muted-foreground size-4" />
              <span className="text-sm font-medium">{displayFileName}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Label>File format</Label>
          <RadioGroup
            value={format}
            onValueChange={(value) => handleFormatChange(value as MDExtensions)}
            className="gap-3"
          >
            <label
              htmlFor="mdx"
              className="border-input has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5 flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors"
            >
              <RadioGroupItem value="mdx" id="mdx" className="mt-0.5" />
              <div className="space-y-1">
                <div className="text-sm font-medium">MDX (.mdx)</div>
                <div className="text-muted-foreground text-sm">
                  Markdown + components
                </div>
              </div>
            </label>

            <label
              htmlFor="md"
              className="border-input has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5 flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors"
            >
              <RadioGroupItem value="md" id="md" className="mt-0.5" />
              <div className="space-y-1">
                <div className="text-sm font-medium">Markdown (.md)</div>
                <div className="text-muted-foreground text-sm">
                  Standard Markdown
                </div>
              </div>
            </label>
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default MarkdownExtensionDialog
