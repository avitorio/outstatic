import { API_MEDIA_PATH } from '@/utils/constants'
import { useOutstatic } from '@/utils/hooks/use-outstatic'
import { useContext, useEffect, useMemo, useState } from 'react'
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
import {
  buildMediaApiPath,
  getFilenameFromPublicMediaPath,
  getSourceForPublicPath
} from '@/utils/media-config'

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
    media,
    publicMediaPath,
    repoOwner,
    repoSlug,
    repoBranch,
    repoMediaPath
  } = useOutstatic()

  const { setHasChanges } = useContext(DocumentContext)

  // State management
  const [imageState, setImageState] = useState<'options' | 'url'>('options')
  const [imageUrl, setImageUrl] = useState('')
  const [previewLoading, setPreviewLoading] = useState(true)
  const [loadingError, setLoadingError] = useState(false)
  const [showImageLibrary, setShowImageLibrary] = useState(false)

  const { setValue, control, getValues, watch } = useFormContext()
  const watchedImage = watch(id)
  const selectedImage = watchedImage ?? getValues(id)

  const image = useMemo(() => {
    if (!selectedImage) {
      return ''
    }

    if (
      selectedImage.startsWith('http') ||
      selectedImage.startsWith(`${basePath}${API_MEDIA_PATH}`)
    ) {
      return selectedImage
    }

    const source = getSourceForPublicPath(selectedImage, media ?? [])

    if (!source) {
      return selectedImage.replace(
        `/${publicMediaPath}`,
        `${basePath}${API_MEDIA_PATH}${repoOwner}/${repoSlug}/${repoBranch}/${repoMediaPath}`
      )
    }

    const filename = getFilenameFromPublicMediaPath(selectedImage, source)

    return buildMediaApiPath({
      basePath,
      repoOwner,
      repoSlug,
      repoBranch,
      source,
      filename
    })
  }, [
    selectedImage,
    basePath,
    media,
    publicMediaPath,
    repoOwner,
    repoSlug,
    repoBranch,
    repoMediaPath
  ])

  // Reset image selection
  const handleRemoveImage = () => {
    setValue(id, '')
    setImageState('options')
    setImageUrl('')
    setPreviewLoading(true)
    setLoadingError(false)
    setHasChanges(true)
  }

  // Seed the form from the provided default only when the field is unset.
  useEffect(() => {
    const currentValue = watchedImage ?? getValues(id)
    if ((currentValue === undefined || currentValue === null) && defaultValue) {
      setValue(id, defaultValue)
    }
  }, [watchedImage, id, defaultValue, getValues, setValue])

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
            setPreviewLoading(false)
            setLoadingError(false)
          }}
          onError={() => {
            console.log('error loading image')
            setPreviewLoading(false)
            setLoadingError(true)
          }}
          alt=""
        />
      </div>
      <div className="w-full flex justify-between mt-2">
        <Button variant="destructive" onClick={handleRemoveImage} type="button">
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

          <div className="w-full flex justify-between mt-2 gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setValue(id, '')
                setImageState('options')
                setImageUrl('')
              }}
              type="button"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setPreviewLoading(true)
                setLoadingError(false)
                setImageState('options')
                setValue(id, imageUrl)
                setHasChanges(true)
              }}
              type="button"
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
    <div className="w-full flex justify-between mt-2 gap-2">
      <Button className="text-xs" size="sm" onClick={() => setShowImageLibrary(true)} type="button">
        From library
      </Button>
      <Button
        size="sm"
        onClick={() => {
          setImageState('url')
          setLoadingError(false)
          setImageUrl('')
        }}
        type="button"
        className="text-xs"
      >
        From URL
      </Button>
    </div>
  )

  return (
    <>
      {image
        ? renderImagePreview()
        : imageState === 'url'
          ? renderUrlInput()
          : renderImageOptions()}

      <MediaLibraryModal
        open={showImageLibrary}
        onOpenChange={setShowImageLibrary}
        onSelect={(image) => {
          setPreviewLoading(true)
          setLoadingError(false)
          setImageState('options')
          setValue(id, image)
          setHasChanges(true)
        }}
      />
    </>
  )
}
