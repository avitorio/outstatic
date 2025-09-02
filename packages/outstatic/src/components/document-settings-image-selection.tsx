import { API_MEDIA_PATH } from '@/utils/constants'
import { useOutstatic } from '@/utils/hooks/useOutstatic'
import { useContext, useEffect, useState } from 'react'
import { Button } from '@/components/ui/shadcn/button'
import MediaLibraryModal from '@/components/ui/outstatic/media-library-modal'
import { useFormContext } from 'react-hook-form'
import {
  FormDescription,
  FormField,
  FormMessage
} from '@/components/ui/shadcn/form'
import { Input } from '@/components/ui/shadcn/input'
import { SpinnerIcon } from '@/components/ui/outstatic/spinner-icon'
import { ImageOff } from 'lucide-react'
import { DocumentContext } from '@/context'

type DocumentSettingsImageSelectionProps = {
  id: string
  defaultValue?: string
}

export const DocumentSettingsImageSelection = ({
  id,
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

  const { setHasChanges } = useContext(DocumentContext)

  // State management
  const [imageState, setImageState] = useState<'options' | 'preview' | 'url'>(
    'options'
  )
  const [image, setImage] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [previewLoading, setPreviewLoading] = useState(true)
  const [loadingError, setLoadingError] = useState(false)
  const [showImageLibrary, setShowImageLibrary] = useState(false)

  const { setValue, control, getValues, watch } = useFormContext()

  // Handle image selection from library or URL
  const handleImageSelect = (selectedImage: string, isUserAction = false) => {
    setPreviewLoading(true)
    setImageState('preview')
    setLoadingError(false)

    // Small delay to allow UI to update before setting the image
    setTimeout(() => {
      setImage(selectedImage)
      setPreviewLoading(false)

      // Only mark as changed if this was a user-initiated action
      if (isUserAction) {
        setHasChanges(true)
      }
    }, 500)
  }

  // Reset image selection
  const handleRemoveImage = () => {
    setValue(id, '')
    setImage('')
    setImageState('options')
    setLoadingError(false)
    setHasChanges(true)
  }

  // Process image path when form value changes
  useEffect(() => {
    const resolvedImage = getValues(id)
    if (!resolvedImage) {
      return
    }

    // Handle absolute URLs or API media paths
    if (
      resolvedImage?.startsWith('http') ||
      resolvedImage?.startsWith(`${basePath}${API_MEDIA_PATH}`)
    ) {
      handleImageSelect(resolvedImage, false)
      return
    }

    // Convert relative paths to absolute
    const image = resolvedImage?.replace(
      `/${publicMediaPath}`,
      `${basePath}${API_MEDIA_PATH}${repoOwner}/${repoSlug}/${repoBranch}/${repoMediaPath}`
    )

    handleImageSelect(image, false)
  }, [watch(id)])

  // Set default value if no image is selected
  useEffect(() => {
    if (!image) {
      setValue(id, defaultValue)
    }
  }, [id, defaultValue])

  // Render image preview
  const renderImagePreview = () => (
    <>
      <div className="flex w-full relative bg-slate-100 rounded-md overflow-hidden h-48">
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
            setLoadingError(false)
          }}
          onError={() => {
            if (!previewLoading) {
              console.log('error loading image')
              setLoadingError(true)
            }
          }}
          alt=""
        />
      </div>
      <div className="w-full flex justify-between mt-2">
        <Button variant="destructive" onClick={handleRemoveImage}>
          Remove
        </Button>
      </div>
    </>
  )

  // Render URL input form
  const renderUrlInput = () => (
    <FormField
      control={control}
      name={id}
      defaultValue={''}
      render={({ field }) => (
        <>
          <Input
            value={imageUrl || field.value}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Enter image URL"
          />

          <FormDescription>Image URL</FormDescription>
          <FormMessage />

          <div className="w-full flex justify-between mt-2">
            <Button
              variant="outline"
              onClick={() => {
                setValue(id, '')
                setImageState('options')
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setImageState('preview')
                setValue(id, imageUrl)
                setHasChanges(true)
              }}
            >
              Select
            </Button>
          </div>
        </>
      )}
    />
  )

  // Render image selection options
  const renderImageOptions = () => (
    <div className="w-full flex justify-between mt-2">
      <Button onClick={() => setShowImageLibrary(true)} type="button">
        From library
      </Button>
      <Button
        onClick={() => {
          setImageState('url')
          setLoadingError(false)
        }}
        type="button"
      >
        From URL
      </Button>
    </div>
  )

  return (
    <>
      {imageState === 'preview' && image && renderImagePreview()}
      {imageState === 'url' && renderUrlInput()}
      {imageState === 'options' && renderImageOptions()}

      <MediaLibraryModal
        open={showImageLibrary}
        onOpenChange={setShowImageLibrary}
        onSelect={(image) => {
          setValue(id, image)
          setHasChanges(true)
        }}
      />
    </>
  )
}
