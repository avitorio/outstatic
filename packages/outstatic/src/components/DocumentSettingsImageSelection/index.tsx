import { API_MEDIA_PATH } from '@/utils/constants'
import { useOutstatic } from '@/utils/hooks/useOutstatic'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/shadcn/button'
import MediaLibraryModal from '../ui/outstatic/media-library-modal'
import { useFormContext } from 'react-hook-form'
import { FormDescription, FormField, FormMessage } from '../ui/shadcn/form'
import { Input } from '../ui/shadcn/input'
import { SpinnerIcon } from '../ui/outstatic/spinner-icon'
import { ImageOff } from 'lucide-react'

type DocumentSettingsImageSelectionProps = {
  id: string
  label?: string
  defaultValue?: string
}

const DocumentSettingsImageSelection = ({
  id,
  label,
  defaultValue = ''
}: DocumentSettingsImageSelectionProps) => {
  const {
    basePath,
    publicMediaPath,
    repoOwner,
    repoSlug,
    repoBranch,
    repoMediaPath
  } = useOutstatic()
  const [showImage, setShowImage] = useState(false)
  const [showLink, setShowLink] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(true)
  const [loadingError, setLoadingError] = useState(false)
  const [image, setImage] = useState('')
  const [showImageOptions, setShowImageOptions] = useState(!image)
  const [showImageLibrary, setShowImageLibrary] = useState(false)
  const [imageUrl, setImageUrl] = useState('')

  const { setValue, control, getValues, watch } = useFormContext()

  const handleImageSelect = (selectedImage: string) => {
    setPreviewLoading(true)
    setShowImage(true)
    setShowImageOptions(false)
    setTimeout(() => {
      setImage(selectedImage)
      setPreviewLoading(false)
    }, 1000)
  }

  useEffect(() => {
    const resolvedImage = getValues(id)
    if (!resolvedImage) {
      return
    }

    if (
      resolvedImage?.startsWith('http') ||
      resolvedImage?.startsWith(`${basePath}${API_MEDIA_PATH}`)
    ) {
      handleImageSelect(resolvedImage)
      return
    }

    const image = resolvedImage?.replace(
      `/${publicMediaPath}`,
      `${basePath}${API_MEDIA_PATH}${repoOwner}/${repoSlug}/${repoBranch}/${repoMediaPath}`
    )

    handleImageSelect(image)
  }, [watch(id)])

  useEffect(() => {
    if (!image) {
      setValue(id, defaultValue)
    }
  }, [id, defaultValue])

  return (
    <>
      {showImage && image && (
        <>
          <div
            className={`flex w-full relative bg-slate-100 rounded-md overflow-hidden h-48`}
          >
            {previewLoading && !loadingError && (
              <div className="w-full h-48 bg-slate-200 absolute flex items-center justify-center">
                <div className="flex flex-col gap-2 text-sm items-center font-semibold text-slate-600">
                  <SpinnerIcon />
                </div>
              </div>
            )}
            {loadingError && (
              <div className="w-full h-48 bg-red-100 absolute flex items-center justify-center">
                <div className="flex flex-col gap-2 text-sm items-center font-semibold text-red-600">
                  <ImageOff />
                  <p>Error loading image</p>
                </div>
              </div>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              className="w-full max-h-48 object-contain"
              onLoad={() => {
                setShowLink(false)
                setLoadingError(false)
              }}
              onError={(e) => {
                if (e.currentTarget.naturalWidth === 0 && !previewLoading) {
                  console.log('error loading image')
                  setLoadingError(true)
                  setShowLink(false)
                }
              }}
              alt=""
            />
          </div>
          <div className="w-full flex justify-between mt-2">
            <Button
              variant="destructive"
              onClick={() => {
                setValue(id, '')
                setImage('')
                setShowImage(false)
                setShowLink(false)
                setShowImageOptions(true)
              }}
            >
              Remove
            </Button>
          </div>
        </>
      )}
      {showLink && (
        <>
          <FormField
            control={control}
            name={id}
            defaultValue={''}
            render={({ field }) => (
              <>
                <Input
                  value={imageUrl || field.value}
                  onChange={(e) => setImageUrl(e.target.value)}
                />

                <FormDescription>Image URL</FormDescription>
                <FormMessage />

                <div className="w-full flex justify-between mt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setValue(id, '')
                      setShowLink(false)
                      setShowImageOptions(true)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      setShowLink(false)
                      setShowImage(true)
                      setValue(id, imageUrl)
                    }}
                  >
                    Select
                  </Button>
                </div>
              </>
            )}
          />
        </>
      )}
      {showImageOptions && (
        <>
          <span className="mt-2 mb-1 block text-sm font-medium text-gray-900">
            {label ?? 'Add an image'}
          </span>
          <div className="w-full flex justify-between mt-2">
            <Button
              onClick={() => {
                setShowImageLibrary(true)
              }}
              type="button"
            >
              From library
            </Button>
            <Button
              onClick={() => {
                setShowLink(true)
                setShowImageOptions(false)
                setShowImage(false)
                setLoadingError(false)
              }}
              type="button"
            >
              From URL
            </Button>
          </div>
        </>
      )}
      <MediaLibraryModal
        open={showImageLibrary}
        onOpenChange={setShowImageLibrary}
        onSelect={(image) => {
          setValue(id, image)
        }}
      />
    </>
  )
}

export default DocumentSettingsImageSelection
