'use client'

import { useMemo, useState } from 'react'
import { Blocks, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { AdminLayout } from '@/components/admin-layout'
import { AdminLoading } from '@/components/admin-loading'
import { Badge } from '@/components/ui/shadcn/badge'
import { Button } from '@/components/ui/shadcn/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/shadcn/card'
import { Input } from '@/components/ui/shadcn/input'
import { useGetBlocks } from '@/utils/hooks/use-get-blocks'
import { Block } from '@/utils/metadata/types'
import { BlockDialog } from './_components/block-dialog'
import { DeleteBlockDialog } from './_components/delete-block-dialog'

const getRequiredPropCount = (block: Block) =>
  block.props.filter((prop) => prop.required).length

export default function BlockLibrary() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null)
  const { data, isLoading } = useGetBlocks()
  const blocks = useMemo(() => data?.blocks.blocks ?? [], [data])

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
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl">Block Library</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage reusable MDX blocks for the editor slash command.
          </p>
        </div>
        {blocks.length > 0 ? (
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Block
          </Button>
        ) : null}
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
            <CardContent className="prose prose-sm dark:prose-invert">
              <p>
                Define a reusable component and the props editors should fill in
                when inserting it.
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Block
              </Button>
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
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="truncate">{block.name}</CardTitle>
                    {block.description ? (
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {block.description}
                      </p>
                    ) : null}
                  </div>
                  <Blocks className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{block.props.length} props</Badge>
                  {getRequiredPropCount(block) > 0 ? (
                    <Badge>{getRequiredPropCount(block)} required</Badge>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="min-h-0 flex-1">
                {block.props.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {block.props.slice(0, 5).map((prop) => (
                      <Badge key={prop.name} variant="secondary">
                        {prop.name}: {prop.type}
                      </Badge>
                    ))}
                    {block.props.length > 5 ? (
                      <Badge variant="secondary">
                        +{block.props.length - 5}
                      </Badge>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No props</p>
                )}
              </CardContent>
              <CardFooter className="justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedBlock(block)
                    setShowEditDialog(true)
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedBlock(block)
                    setShowDeleteDialog(true)
                  }}
                >
                  <span className="sr-only">Delete {block.name}</span>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

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
    </AdminLayout>
  )
}
