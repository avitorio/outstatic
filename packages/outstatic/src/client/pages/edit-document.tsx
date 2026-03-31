import { Document, MDExtensions } from '@/types'
import { useDocumentUpdateEffect } from '@/utils/hooks/use-document-update-effect'
import { useFileStore } from '@/utils/hooks/use-file-store'
import { useGetCollectionSchema } from '@/utils/hooks/use-get-collection-schema'
import { useGetConfig } from '@/utils/hooks/use-get-config'
import { useOutstatic } from '@/utils/hooks/use-outstatic'
import useSubmitDocument from '@/utils/hooks/use-submit-document'
import { usePathname } from 'next/navigation'
import { singular } from 'pluralize'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { noCase } from 'change-case'
import { EditorPageShell } from './_components/editor-page-shell'
import { useEditorPageState } from './_components/use-editor-page-state'

export default function EditDocument({ collection }: { collection: string }) {
  const pathname = usePathname()
  const [slug, setSlug] = useState(
    pathname.split('/').pop() || `/${collection}/new`
  )
  const [loading, setLoading] = useState(false)
  const {
    basePath,
    session,
    hasChanges,
    setHasChanges,
    dashboardRoute,
    repoMediaPath,
    publicMediaPath
  } = useOutstatic()
  const [showDelete, setShowDelete] = useState(false)
  const [showMediaPathDialog, setShowMediaPathDialog] = useState(false)
  const [showExtensionDialog, setShowExtensionDialog] = useState(false)
  const [mediaPathUpdated, setMediaPathUpdated] = useState(false)
  const pendingFormDataRef = useRef<Document | null>(null)

  const { data: schema } = useGetCollectionSchema({ collection })
  const { data: config } = useGetConfig()
  const files = useFileStore((state) => state.files)
  const {
    methods,
    editor,
    customFields,
    setCustomFields,
    extension,
    setExtension,
    metadata,
    setMetadata,
    editDocument
  } = useEditorPageState({
    schema,
    initialExtension: 'mdx',
    setHasChanges
  })

  const onSubmit = useSubmitDocument({
    session,
    slug,
    setSlug,
    setShowDelete,
    setLoading,
    files,
    collection,
    customFields,
    setCustomFields,
    setHasChanges,
    editor,
    extension,
    documentMetadata: metadata
  })

  useEffect(() => {
    window.history.replaceState(
      {},
      '',
      `${basePath}${dashboardRoute}/${collection}/${slug}`
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  useDocumentUpdateEffect({
    collection,
    methods,
    slug,
    editor,
    setHasChanges,
    setShowDelete,
    setExtension,
    setMetadata
  })

  useEffect(() => {
    if (mediaPathUpdated) {
      onSubmit(methods.getValues())
    }
  }, [mediaPathUpdated, methods, onSubmit])

  useEffect(() => {
    if (slug === 'new' && config?.mdExtension) {
      setExtension(config.mdExtension)
    }
  }, [slug, config?.mdExtension, setExtension])

  const isNewDocument = slug === 'new'

  const handleSave = (data: Document) => {
    if (!repoMediaPath && !publicMediaPath && files.length > 0) {
      setShowMediaPathDialog(true)
      return
    }

    if (isNewDocument && !config?.mdExtension) {
      pendingFormDataRef.current = data
      setShowExtensionDialog(true)
      return
    }

    if (!isNewDocument && !config?.mdExtension) {
      // @ts-ignore
      return onSubmit(data, { configUpdate: { mdExtension: extension } })
    }

    // @ts-ignore
    return onSubmit(data)
  }

  const handleExtensionDialogSave = (selectedExtension: MDExtensions) => {
    setExtension(selectedExtension)

    if (pendingFormDataRef.current) {
      // @ts-ignore
      onSubmit(pendingFormDataRef.current, {
        configUpdate: { mdExtension: selectedExtension }
      })
      pendingFormDataRef.current = null
    }
  }

  return (
    <EditorPageShell
      methods={methods}
      editor={editor}
      editDocument={editDocument}
      hasChanges={hasChanges}
      setHasChanges={setHasChanges}
      collection={collection}
      extension={extension}
      title={methods.getValues('title')}
      settingsTitle={methods.getValues('title')}
      saveDocument={methods.handleSubmit(handleSave as any, (data) => {
        console.error('Failed to save document', { data })
        const firstKey = Object.keys(data)[0] as keyof typeof data
        const errorMessage =
          (data[firstKey] as { message?: string })?.message || 'Unknown error'
        const errorToast = toast.error(
          `Error in ${firstKey}: ${errorMessage}`,
          {
            action: {
              label: 'Copy Logs',
              onClick: () => {
                navigator.clipboard.writeText(JSON.stringify(data, null, '  '))
                toast.message('Logs copied to clipboard', {
                  id: errorToast
                })
              }
            }
          }
        )
      })}
      loading={loading}
      showDelete={showDelete}
      customFields={customFields}
      setCustomFields={setCustomFields}
      metadata={metadata}
      titlePlaceholder={`Your ${singular(
        noCase(collection, {
          split: (str) => str.split(/([^A-Za-z0-9\.-]+)/g).filter(Boolean)
        })
      ).replace(/-/g, ' ')} title`}
      showMediaPathDialog={showMediaPathDialog}
      setShowMediaPathDialog={setShowMediaPathDialog}
      onMediaPathConfigured={() => {
        setMediaPathUpdated(true)
      }}
      showExtensionDialog={showExtensionDialog}
      setShowExtensionDialog={setShowExtensionDialog}
      extensionFileName={`${methods.getValues('slug') || 'document'}.${extension}`}
      onExtensionSave={handleExtensionDialogSave}
    />
  )
}
