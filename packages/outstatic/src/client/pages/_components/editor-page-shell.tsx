import { AdminLayout } from '@/components/admin-layout'
import { DocumentSettings } from '@/components/document-settings'
import { DocumentTitleInput } from '@/components/document-title-input'
import { MDEditor } from '@/components/editor/editor'
import { FormMessage } from '@/components/ui/shadcn/form'
import MediaSettingsDialog from '@/components/ui/outstatic/media-settings-dialog'
import { MarkdownExtensionDialog } from '@/components/ui/outstatic/markdown-extension-dialog'
import { DocumentContext } from '@/context'
import { CustomFieldsType, Document, MDExtensions } from '@/types'
import { Editor } from '@tiptap/react'
import Head from 'next/head'
import { ReactNode } from 'react'
import { FormProvider, UseFormReturn } from 'react-hook-form'

type EditorPageShellProps = {
  methods: UseFormReturn<Document, any, any>
  editor: Editor | null
  editDocument: (property: string, value: any) => void
  hasChanges: boolean
  setHasChanges: (hasChanges: boolean) => void
  collection: string
  extension: MDExtensions
  title?: string
  settingsTitle?: string
  saveDocument: () => void
  loading: boolean
  showDelete: boolean
  customFields: CustomFieldsType
  setCustomFields: (fields: CustomFieldsType) => void
  metadata: Record<string, any>
  titlePlaceholder: string
  showMediaPathDialog: boolean
  setShowMediaPathDialog: (showMediaPathDialog: boolean) => void
  onMediaPathConfigured: () => void
  showExtensionDialog: boolean
  setShowExtensionDialog: (showExtensionDialog: boolean) => void
  extensionFileName: string
  onExtensionSave: (selectedExtension: MDExtensions) => void
  singleton?: string
  extraDialogs?: ReactNode
}

export function EditorPageShell({
  methods,
  editor,
  editDocument,
  hasChanges,
  setHasChanges,
  collection,
  extension,
  title,
  settingsTitle,
  saveDocument,
  loading,
  showDelete,
  customFields,
  setCustomFields,
  metadata,
  titlePlaceholder,
  showMediaPathDialog,
  setShowMediaPathDialog,
  onMediaPathConfigured,
  showExtensionDialog,
  setShowExtensionDialog,
  extensionFileName,
  onExtensionSave,
  singleton,
  extraDialogs
}: EditorPageShellProps) {
  return (
    <>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font*/}
        <link
          href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=PT+Serif:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />
      </Head>
      {editor && editor.isEditable && (
        <DocumentContext.Provider
          value={{
            editor,
            document: methods.getValues(),
            editDocument,
            hasChanges,
            setHasChanges,
            collection,
            extension
          }}
        >
          <FormProvider {...methods}>
            <FormMessage />
            <AdminLayout
              title={title}
              settings={
                <DocumentSettings
                  singleton={singleton}
                  title={settingsTitle}
                  loading={loading}
                  saveDocument={saveDocument}
                  showDelete={showDelete}
                  customFields={customFields}
                  setCustomFields={setCustomFields}
                  metadata={metadata}
                />
              }
            >
              <form className="m-auto max-w-[700px] space-y-4">
                <DocumentTitleInput
                  id="title"
                  className="w-full resize-none outline-hidden text-5xl scrollbar-hide min-h-[55px] overflow-hidden"
                  placeholder={titlePlaceholder}
                />
                <div className="min-h-full">
                  <MDEditor editor={editor} id="content" />
                </div>
              </form>
            </AdminLayout>
            <MediaSettingsDialog
              title="Your document contains media files."
              description="Let's set up your media paths so we can upload your files."
              showMediaPathDialog={showMediaPathDialog}
              setShowMediaPathDialog={setShowMediaPathDialog}
              callbackFunction={onMediaPathConfigured}
            />
            {extraDialogs}
            <MarkdownExtensionDialog
              open={showExtensionDialog}
              onOpenChange={setShowExtensionDialog}
              fileName={extensionFileName}
              onSave={onExtensionSave}
            />
          </FormProvider>
        </DocumentContext.Provider>
      )}
    </>
  )
}
