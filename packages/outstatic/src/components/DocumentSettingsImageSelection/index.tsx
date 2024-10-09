import { API_MEDIA_PATH } from '@/utils/constants'
import useOutstatic from '@/utils/hooks/useOutstatic'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/shadcn/button'
import MediaLibraryModal from '../ui/outstatic/media-library-modal'
import { useFormContext } from 'react-hook-form'
import { FormDescription, FormField, FormMessage } from '../ui/shadcn/form'
import { Input } from '../ui/shadcn/input'

type DocumentSettingsImageSelectionProps = {
  id: string
  label?: string
}

const DocumentSettingsImageSelection = ({
  id,
  label
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
    setTimeout(() => {
      setImage(selectedImage)
      setShowImage(true)
      setShowImageOptions(false)
      setValue(id, selectedImage) // Set the form value
      setPreviewLoading(false)
    }, 1000)
  }

  useEffect(() => {
    const resolvedImage = getValues(id)

    if (
      !resolvedImage ||
      resolvedImage?.startsWith(
        `${basePath ? basePath + '/' : ''}${API_MEDIA_PATH}`
      )
    ) {
      return
    }

    if (resolvedImage?.startsWith('http')) {
      handleImageSelect(resolvedImage)
      return
    }

    const image = resolvedImage?.replace(
      `${basePath}/${publicMediaPath}`,
      `${
        basePath ? basePath + '/' : ''
      }${API_MEDIA_PATH}${repoOwner}/${repoSlug}/${repoBranch}/${repoMediaPath}`
    )

    handleImageSelect(image)
  }, [watch(id)])

  return (
    <>
      {showImage && (
        <>
          <div
            className={`w-full relative bg-slate-100 ${
              previewLoading ? 'h-48' : ''
            }`}
          >
            {previewLoading && (
              <div
                className={`animate-pulse w-full h-48 bg-slate-200 absolute`}
              ></div>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              className="w-full max-h-48 object-contain"
              onLoad={() => {
                setShowLink(false)
                setPreviewLoading(false)
                setLoadingError(false)
              }}
              onError={() => {
                setPreviewLoading(false)
                setLoadingError(true)
                setShowLink(false)
              }}
              alt=""
            />
          </div>
          <div className="w-full flex justify-between mt-2">
            <Button
              variant="destructive"
              onClick={() => {
                setValue(id, '')
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
                      setShowLink(false)
                      setShowImageOptions(true)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      setShowLink(false)
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
        onSelect={handleImageSelect}
      />
    </>
  )
}

export default DocumentSettingsImageSelection
