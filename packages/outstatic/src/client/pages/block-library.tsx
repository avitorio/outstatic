'use client'

import { useMemo, useState } from 'react'
import { Blocks, Pencil, Plus, Search, Trash } from 'lucide-react'
import { DynamicIcon, type IconName } from 'lucide-react/dynamic'
import { AdminLayout } from '@/components/admin-layout'
import { AdminLoading } from '@/components/admin-loading'
import { Button } from '@/components/ui/shadcn/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/shadcn/card'
import { Input } from '@/components/ui/shadcn/input'
import { useGetBlocks } from '@/utils/hooks/use-get-blocks'
import { Block } from '@/utils/metadata/types'
import { BlockDialog } from './_components/block-dialog'
import { DeleteBlockDialog } from './_components/delete-block-dialog'
import { usePermissions } from '@/utils/hooks'

export default function BlockLibrary() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null)
  const { data, isLoading } = useGetBlocks()
  const blocks = useMemo(() => data?.blocks.blocks ?? [], [data])
  const { canManageCollections } = usePermissions()

  const filteredBlocks = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()
    const sortedBlocks = [...blocks].sort((a, b) =>
      a.name.localeCompare(b.name)
    )

    if (!search) {
      return sortedBlocks
    }

    return sortedBlocks.filter((block) => {
      return (
        block.name.toLowerCase().includes(search) ||
        block.description?.toLowerCase().includes(search) ||
        block.keywords?.some((keyword) =>
          keyword.toLowerCase().includes(search)
        )
      )
    })
  }, [blocks, searchTerm])

  if (isLoading) {
    return <AdminLoading />
  }

  return (
    <AdminLayout title="Block Library">
      <div className="mb-4 flex h-12 items-center">
        <h1 className="mr-4 text-2xl">Block Library</h1>
        <div className="flex gap-2 items-center">
          {canManageCollections && blocks.length > 0 ? (
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Block
            </Button>
          ) : null}
        </div>
      </div>

      {blocks.length > 0 ? (
        <div className="mb-6 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search blocks"
              className="pl-9"
            />
          </div>
        </div>
      ) : null}

      {blocks.length === 0 ? (
        <div className="max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Add your first MDX block.</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-full">
              <p>
                Define a reusable component and the props editors should fill in
                when inserting it.
              </p>
              {canManageCollections ? (
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Block
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ) : filteredBlocks.length === 0 ? (
        <div className="max-w-2xl rounded-md border border-dashed p-8 text-sm text-muted-foreground">
          No blocks match your search.
        </div>
      ) : (
        <div className="grid max-w-6xl gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredBlocks.map((block) => (
            <Card key={block.name} className="flex flex-col">
              <CardContent className="relative flex justify-between items-center">
                {canManageCollections ? (
                  <button
                    type="button"
                    className="absolute inset-0 z-10 h-full w-full cursor-pointer rounded-md border-0 bg-transparent p-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    aria-label={`Edit ${block.name}`}
                    onClick={() => {
                      setSelectedBlock(block)
                      setShowEditDialog(true)
                    }}
                  />
                ) : null}
                <div className="flex items-center justify-between gap-3 w-full">
                  <div className="flex items-center justify-start gap-3">
                    <div className="p-2 rounded-md border border-border h-12 w-12 flex items-center justify-center">
                      {block.icon ? (
                        <DynamicIcon
                          name={block.icon as IconName}
                          className="h-8 w-8 shrink-0 text-muted-foreground"
                          fallback={() => (
                            <Blocks className="h-5 w-5 shrink-0 text-muted-foreground" />
                          )}
                        />
                      ) : (
                        <Blocks className="h-5 w-5 shrink-0 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="truncate">{block.name}</CardTitle>
                      {block.description ? (
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                          {block.description}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  {canManageCollections ? (
                    <div className="flex gap-2 items-center z-30">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedBlock(block)
                          setShowDeleteDialog(true)
                        }}
                        className="z-20"
                      >
                        <span className="sr-only">Delete {block.name}</span>
                        <Trash className="h-9 w-9 z-10" />
                      </Button>
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {canManageCollections ? (
        <>
          <BlockDialog
            mode="add"
            open={showAddDialog}
            onOpenChange={setShowAddDialog}
            blocks={blocks}
            onSaved={() => setSelectedBlock(null)}
          />

          <BlockDialog
            mode="edit"
            open={showEditDialog}
            onOpenChange={(open) => {
              if (!open) {
                setSelectedBlock(null)
              }
              setShowEditDialog(open)
            }}
            blocks={blocks}
            block={selectedBlock}
            onSaved={() => setSelectedBlock(null)}
          />

          <DeleteBlockDialog
            open={showDeleteDialog}
            onOpenChange={(open) => {
              if (!open) {
                setSelectedBlock(null)
              }
              setShowDeleteDialog(open)
            }}
            block={selectedBlock}
            onDeleted={() => setSelectedBlock(null)}
          />
        </>
      ) : null}
    </AdminLayout>
  )
}
