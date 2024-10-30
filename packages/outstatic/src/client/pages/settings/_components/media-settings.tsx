import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useGetConfig } from '@/utils/hooks/useGetConfig'
import { useUpdateConfig } from '@/utils/hooks/useUpdateConfig'
import { ConfigSchema } from '@/utils/schemas/config-schema'
import { Button } from '@/components/ui/shadcn/button'
import { Input } from '@/components/ui/shadcn/input'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage
} from '@/components/ui/shadcn/form'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/shadcn/dialog'
import { useEffect, useState } from 'react'
import { useLocalData, useOutstatic } from '@/utils/hooks'
import { Skeleton } from '@/components/ui/shadcn/skeleton'
import { FolderIcon } from 'lucide-react'
import GithubExplorer from '@/components/ui/outstatic/github-explorer'
import PathBreadcrumbs from '@/components/ui/outstatic/path-breadcrumb'

type MediaSettingsProps =
  | {
      onSettingsUpdate?: () => void
    }
  | Record<string, never>

export function MediaSettings(props: MediaSettingsProps) {
  const onSettingsUpdate = props.onSettingsUpdate || (() => {})
  const [loading, setLoading] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const { data: config, isPending } = useGetConfig()
  const { setData } = useLocalData()
  const { repoOwner, repoSlug } = useOutstatic()
  const [showRepoFolderDialog, setShowRepoFolderDialog] = useState(false)
  const [repoMediaPath, setRepoMediaPath] = useState(
    config?.repoMediaPath || ''
  )
  const [selectedRepoFolder, setSelectedRepoFolder] = useState('')
  const form = useForm({
    resolver: zodResolver(ConfigSchema),
    defaultValues: {
      repoMediaPath: config?.repoMediaPath || '',
      publicMediaPath: config?.publicMediaPath || ''
    }
  })

  const onSubmit = useUpdateConfig({ setLoading })
  const handleSubmit = async () => {
    if (!config) {
      onSubmit({
        configFields: form.getValues(),
        callbackFunction: onSettingsUpdate
      })
    } else {
      setShowConfirmModal(true)
    }
  }

  const confirmSubmit = () => {
    setShowConfirmModal(false)
    onSubmit({
      configFields: form.getValues(),
      callbackFunction: onSettingsUpdate
    })
  }

  useEffect(() => {
    form.reset({
      repoMediaPath: config?.repoMediaPath || '',
      publicMediaPath: config?.publicMediaPath || ''
    })
    setData(config ?? {})
  }, [config])

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="repoMediaPath"
            defaultValue={repoMediaPath}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Repository Media Path</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    {isPending ? (
                      <Skeleton className="w-100 h-10" />
                    ) : (
                      <Input disabled placeholder="public/images/" {...field} />
                    )}
                  </FormControl>
                  <Button
                    disabled={isPending}
                    size="icon"
                    variant="outline"
                    title="Browse repository folders"
                    onClick={() => setShowRepoFolderDialog(true)}
                    type="button"
                  >
                    <FolderIcon className="w-4 h-4" />
                  </Button>
                </div>
                <FormDescription>
                  The path where media files are stored in your repository.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="publicMediaPath"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Public Media Path</FormLabel>
                <FormControl>
                  {isPending ? (
                    <Skeleton className="w-100 h-10" />
                  ) : (
                    <div className="flex">
                      <Input
                        disabled
                        value="https://yourwebsite.com/"
                        className="bg-secondary rounded-r-none min-w-[186px] w-auto"
                      />
                      <Input
                        placeholder="images/"
                        className="rounded-l-none w-full"
                        {...field}
                      />
                    </div>
                  )}
                </FormControl>
                <FormDescription>
                  The public path where media files are accessed.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            disabled={
              loading ||
              (form.getValues('publicMediaPath') === config?.publicMediaPath &&
                form.getValues('repoMediaPath') === config?.repoMediaPath)
            }
            type="submit"
          >
            Update Media Paths
          </Button>
        </form>
      </Form>

      <Dialog
        open={showRepoFolderDialog}
        onOpenChange={setShowRepoFolderDialog}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Select Media Folder</DialogTitle>
            <DialogDescription>
              Choose the folder where your media files will be stored
            </DialogDescription>
          </DialogHeader>
          <PathBreadcrumbs
            path={selectedRepoFolder ? '/' + selectedRepoFolder + '/' : ''}
          />
          <GithubExplorer
            path={selectedRepoFolder}
            setPath={setSelectedRepoFolder}
            hideRoot
          />
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setRepoMediaPath(selectedRepoFolder + '/')
                form.setValue('repoMediaPath', selectedRepoFolder + '/')
                setShowRepoFolderDialog(false)
              }}
              disabled={selectedRepoFolder === ''}
            >
              Select
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              <p className="mb-2 mt-4">
                Future media uploads will be stored at:
              </p>
              <p className="mb-2 mt-4">
                <span className="font-medium">
                  github.com/{repoOwner}/{repoSlug}/
                  {form.getValues('repoMediaPath')}
                </span>
              </p>
              <p className="mb-2 mt-4">
                Future documents will show your media as:
              </p>
              <p className="mb-2 mt-4 font-medium">
                /{form.getValues('publicMediaPath')}image-example.png
              </p>
              <p className="mt-4">
                <span className="text-destructive font-medium">
                  Existing documents and media will NOT be updated.
                </span>
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={confirmSubmit}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
