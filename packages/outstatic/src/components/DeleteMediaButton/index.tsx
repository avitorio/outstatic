import Modal from '@/components/Modal'
import { createCommitApi } from '@/utils/createCommitApi'
import { hashFromUrl } from '@/utils/hashFromUrl'
import { useCreateCommit } from '@/utils/hooks/useCreateCommit'
import useOid from '@/utils/hooks/useOid'
import useOutstatic from '@/utils/hooks/useOutstatic'
import { stringifyMedia } from '@/utils/metadata/stringify'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/shadcn/button'
import { useGetMediaFiles } from '@/utils/hooks/useGetMediaFiles'
import { MEDIA_JSON_PATH } from '@/utils/constants'

type DeleteDocumentButtonProps = {
  disabled?: boolean
  onComplete?: () => void
  path: string
  filename: string
  className?: string
}

const DeleteMediaButton = ({
  disabled = false,
  onComplete = () => {},
  path,
  filename,
  className
}: DeleteDocumentButtonProps) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { repoOwner, repoSlug, repoBranch, ostContent, session } =
    useOutstatic()
  const fetchOid = useOid()

  const mutation = useCreateCommit()

  const { refetch } = useGetMediaFiles({ enabled: false })

  const deleteMedia = async () => {
    setDeleting(true)
    try {
      const [{ data }, oid] = await Promise.all([refetch(), fetchOid()])
      if (!data || !oid) throw new Error('Failed to fetch media or oid')
      const { media, commitUrl } = data
      const owner = repoOwner || session?.user?.login || ''

      const capi = createCommitApi({
        message: `chore: remove ${filename}`,
        owner,
        oid: oid ?? '',
        name: repoSlug,
        branch: repoBranch
      })

      // remove post markdown file
      capi.removeFile(`${path}`)

      // remove post from media.json
      media.generated = new Date().toISOString()
      media.commit = hashFromUrl(commitUrl)
      const newMeta = media.media.filter((file) => file.filename !== filename)
      capi.replaceFile(
        MEDIA_JSON_PATH,
        stringifyMedia({ ...media, media: newMeta })
      )

      const input = capi.createInput()

      mutation.mutate(input)
      setShowDeleteModal(false)
      if (onComplete) onComplete()
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <>
      <Button
        onClick={() => setShowDeleteModal(true)}
        type="button"
        disabled={disabled}
        className={className}
        title="Delete media file"
        size="icon"
        variant="ghost"
      >
        <span className="sr-only">Delete media file</span>
        <Trash2 className="stroke-foreground" />
      </Button>
      {showDeleteModal && (
        <Modal title="Delete Media" close={() => setShowDeleteModal(false)}>
          <div className="space-y-6 p-6 text-left">
            <p className="text-base leading-relaxed text-gray-500">
              Are you sure you want to delete this media file?
            </p>
            <p className="text-base leading-relaxed text-gray-500">
              This action cannot be undone.
            </p>
          </div>
          <div className="flex items-center space-x-2 rounded-b border-t p-6">
            <Button
              variant="destructive"
              onClick={() => {
                deleteMedia()
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
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
          </div>
        </Modal>
      )}
    </>
  )
}

export default DeleteMediaButton
