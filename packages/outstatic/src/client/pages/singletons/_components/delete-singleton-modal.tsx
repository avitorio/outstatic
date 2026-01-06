import { Button } from '@/components/ui/shadcn/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/shadcn/dialog'
import { useState } from 'react'
import { createCommitApi } from '@/utils/createCommitApi'
import { hashFromUrl } from '@/utils/hashFromUrl'
import { useCreateCommit } from '@/utils/hooks/useCreateCommit'
import { useGetMetadata } from '@/utils/hooks/useGetMetadata'
import useOid from '@/utils/hooks/useOid'
import { useOutstatic } from '@/utils/hooks/useOutstatic'
import { stringifyMetadata } from '@/utils/metadata/stringify'
import { toast } from 'sonner'
import { useSingletons } from '@/utils/hooks/useSingletons'
import { SingletonType } from '@/types'

type DeleteSingletonModalProps = {
  setShowDeleteModal: (value: boolean) => void
  setSelectedSingleton: (value: SingletonType | null) => void
  singleton: SingletonType
}

function DeleteSingletonModal({
  setShowDeleteModal,
  setSelectedSingleton,
  singleton
}: DeleteSingletonModalProps) {
  const { repoOwner, session, repoSlug, repoBranch, ostContent } =
    useOutstatic()
  const [deleting, setDeleting] = useState(false)
  const fetchOid = useOid()

  const { refetch: refetchMetadata } = useGetMetadata({ enabled: false })
  const { refetch: refetchSingletons } = useSingletons({
    enabled: false
  })

  const mutation = useCreateCommit()

  const deleteSingleton = async (singleton: SingletonType) => {
    const { data: metadata, isError: metadataError } = await refetchMetadata()

    if (metadataError) {
      throw new Error('Failed to fetch metadata')
    }

    try {
      const oid = await fetchOid()
      const owner = repoOwner || session?.user?.login || ''
      const singletonsPath = `${ostContent}/_singletons`

      const capi = createCommitApi({
        message: `feat(singleton): remove ${singleton.slug}`,
        owner,
        oid: oid ?? '',
        name: repoSlug,
        branch: repoBranch
      })

      // Remove singleton content and schema files
      capi.removeFile(`${singletonsPath}/${singleton.slug}.md`)
      capi.removeFile(`${singletonsPath}/${singleton.slug}.mdx`)
      capi.removeFile(`${singletonsPath}/${singleton.slug}.schema.json`)

      // Remove singleton from metadata.json
      if (metadata) {
        const m = metadata.metadata
        m.generated = new Date().toISOString()
        m.commit = hashFromUrl(metadata.commitUrl)
        const newMeta = (m.metadata ?? []).filter(
          (post) =>
            post.collection !== '_singletons' || post.slug !== singleton.slug
        )
        capi.replaceFile(
          `${ostContent}/metadata.json`,
          stringifyMetadata({ ...m, metadata: newMeta })
        )
      }

      const input = capi.createInput()

      toast.promise(mutation.mutateAsync(input), {
        loading: 'Deleting singleton...',
        success: async () => {
          await refetchSingletons()
          setDeleting(false)
          setShowDeleteModal(false)
          return 'Singleton deleted successfully'
        },
        error: 'Failed to delete singleton'
      })
    } catch (error) {}
  }

  return (
    <Dialog
      open={true}
      onOpenChange={(open) => {
        if (!open) {
          setShowDeleteModal(false)
          setSelectedSingleton(null)
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Singleton</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this singleton?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            This will permanently delete the{' '}
            <span className="font-bold">{singleton.title}</span> singleton and
            its associated files.
          </p>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setShowDeleteModal(false)
              setSelectedSingleton(null)
            }}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              setDeleting(true)
              deleteSingleton(singleton)
            }}
          >
            {deleting ? (
              <>
                <svg
                  className="mr-3 -ml-1 h-5 w-5 animate-spin text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Deleting
              </>
            ) : (
              'Delete'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DeleteSingletonModal
