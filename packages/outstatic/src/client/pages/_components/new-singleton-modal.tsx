import { Button } from '@/components/ui/shadcn/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/shadcn/card'
import { Label } from '@/components/ui/shadcn/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/shadcn/radio-group'
import { useOutstatic } from '@/utils/hooks/use-outstatic'
import { useState } from 'react'
import GithubExplorer from '@/components/ui/outstatic/github-explorer'
import PathBreadcrumbs from '@/components/ui/outstatic/path-breadcrumb'
import { Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/shadcn/dialog'
import { SpinnerIcon } from '@/components/ui/outstatic/spinner-icon'
import { Checkbox } from '@/components/ui/shadcn/checkbox'
import { Input } from '@/components/ui/shadcn/input'
import { slugify } from 'transliteration'
import type { MDExtensions } from '@/types'

type NewSingletonModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (path: string) => void
  loading: boolean
  singletonTitle: string
  extension: MDExtensions
}

export default function NewSingletonModal({
  open,
  onOpenChange,
  onSave,
  loading,
  singletonTitle,
  extension
}: NewSingletonModalProps) {
  const { contentPath, monorepoPath } = useOutstatic()

  const ostContent = `${monorepoPath ? monorepoPath + '/' : ''}${contentPath}`
  const defaultSingletonsPath = `${ostContent}/_singletons`

  const [step, setStep] = useState(1)
  const [outstaticFolder, setOutstaticFolder] = useState(true)
  const [path, setPath] = useState('')
  const [createFolder, setCreateFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  const newFolderSlug = slugify(newFolderName.trim(), {
    allowedChars: 'a-zA-Z0-9.'
  })

  const selectedPath = outstaticFolder
    ? defaultSingletonsPath
    : createFolder
      ? path
        ? `${path}/${newFolderSlug}`
        : newFolderSlug
      : path

  const singletonSlug = slugify((singletonTitle || 'singleton').trim(), {
    allowedChars: 'a-zA-Z0-9.'
  })
  const singletonFilePath = selectedPath
    ? `${selectedPath}/${singletonSlug}.${extension}`
    : `${singletonSlug}.${extension}`

  const handleSave = () => {
    if (!outstaticFolder && createFolder && !newFolderSlug) {
      return
    }
    onSave(selectedPath)
  }

  const resetModal = () => {
    setStep(1)
    setOutstaticFolder(true)
    setPath('')
    setCreateFolder(false)
    setNewFolderName('')
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          resetModal()
        }
        onOpenChange(isOpen)
      }}
    >
      <DialogContent className="md:max-w-xl">
        <DialogHeader>
          <DialogTitle>Save Singleton</DialogTitle>
          <DialogDescription>
            {step === 1 && 'Choose where to store your singleton.'}
            {step === 2 && 'Select a folder for your singleton.'}
            {step === 3 &&
              'Save in this folder or create a new folder for your singleton.'}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <Label>
              Where would you like to save &quot;{singletonTitle}&quot;?
            </Label>
            <RadioGroup
              className="grid gap-4 md:grid-cols-2 -ml-2"
              defaultValue={
                outstaticFolder ? 'outstatic-folder' : 'select-folder'
              }
              onValueChange={(value: string) => {
                setOutstaticFolder(value === 'outstatic-folder')
                setCreateFolder(false)
                setNewFolderName('')
                if (value === 'select-folder') {
                  setPath('')
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  if (outstaticFolder) {
                    handleSave()
                  } else {
                    setStep(2)
                  }
                }
              }}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="outstatic-folder"
                  id="outstatic-folder"
                  className="sr-only"
                  autoFocus
                />
                <Label htmlFor="outstatic-folder">
                  <Card
                    className={`h-full cursor-pointer transition-all shadow-none group relative ${
                      outstaticFolder ? 'border-primary' : ''
                    }`}
                  >
                    <CardHeader>
                      <div
                        className={`absolute right-2 top-2 w-6 h-6 rounded-full border-2 border-primary flex items-center justify-center transition-all ${
                          outstaticFolder
                            ? 'bg-primary text-primary-foreground opacity-100'
                            : 'opacity-0'
                        }`}
                      >
                        <Check className="w-4 h-4" />
                      </div>
                      <CardTitle className="text-xl">
                        Outstatic Folder
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>Default Outstatic setup</CardDescription>
                      <ul className="mt-2 space-y-1 text-sm">
                        <li>
                          Stores singleton in the outstatic/content/_singletons
                          folder.
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="select-folder"
                  id="select-folder"
                  className="sr-only"
                />
                <Label htmlFor="select-folder">
                  <Card
                    className={`h-full cursor-pointer transition-all shadow-none group relative ${
                      !outstaticFolder ? 'border-primary' : ''
                    }`}
                  >
                    <CardHeader>
                      <div
                        className={`absolute right-2 top-2 w-6 h-6 rounded-full border-2 border-primary flex items-center justify-center transition-all ${
                          !outstaticFolder
                            ? 'bg-primary text-primary-foreground opacity-100'
                            : 'opacity-0'
                        }`}
                      >
                        <Check className="w-4 h-4" />
                      </div>
                      <CardTitle className="text-xl">Select a folder</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>
                        Custom location for your singleton
                      </CardDescription>
                      <ul className="mt-2 space-y-1 text-sm">
                        <li>Choose any folder in your repository.</li>
                      </ul>
                    </CardContent>
                  </Card>
                </Label>
              </div>
            </RadioGroup>
            <div className="flex justify-end pt-4">
              {outstaticFolder ? (
                <Button onClick={handleSave} disabled={loading}>
                  {loading ? (
                    <>
                      <SpinnerIcon className="text-background mr-2" />
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </Button>
              ) : (
                <Button onClick={() => setStep(2)}>Next Step</Button>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <PathBreadcrumbs path={'/' + path} />
            <GithubExplorer path={path} setPath={setPath} />
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={() => setStep(3)}>Next</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <Label>Content Path</Label>
            <div className="flex items-center space-x-2 mb-2">
              <Checkbox
                id="create-folder"
                checked={createFolder}
                onCheckedChange={(checked) => {
                  if (!checked) {
                    setNewFolderName('')
                  }
                  setCreateFolder(Boolean(checked))
                }}
              />
              <Label htmlFor="create-folder">Create a new folder</Label>
            </div>

            {createFolder && (
              <div className="space-y-2">
                <Label htmlFor="new-folder-name">Folder Name</Label>
                <Input
                  id="new-folder-name"
                  value={newFolderName}
                  autoFocus
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Ex: pages"
                />
              </div>
            )}

            <Label>File Preview</Label>
            <PathBreadcrumbs path={'/' + singletonFilePath} />
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading || (createFolder && !newFolderSlug)}
              >
                {loading ? (
                  <>
                    <SpinnerIcon className="text-background mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
