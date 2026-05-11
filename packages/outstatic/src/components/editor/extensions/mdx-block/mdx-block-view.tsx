import {
  NodeViewContent,
  NodeViewWrapper,
  type NodeViewProps
} from '@tiptap/react'
import { AlertCircle } from 'lucide-react'
import { useMemo } from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/shadcn/tooltip'
import { cn } from '@/utils/ui'
import { validateMdxBlock } from './mdx-validation'

export const MdxBlockView = ({ node }: NodeViewProps) => {
  const textContent = node.textContent
  const validation = useMemo(() => validateMdxBlock(textContent), [textContent])
  const isInvalid = !validation.valid

  return (
    <NodeViewWrapper className="relative">
      {isInvalid ? (
        <div contentEditable={false} className="absolute top-2 left-3 z-10">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                aria-label={`MDX validation warning: ${validation.message}`}
                className="inline-flex size-6 items-center justify-center rounded-full bg-destructive/15 text-destructive p-0"
                type="button"
              >
                <AlertCircle aria-hidden="true" size={16} />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-72" side="top">
              {validation.message}
            </TooltipContent>
          </Tooltip>
        </div>
      ) : null}
      <div className="absolute top-0 right-6 rounded-b-md border border-t-0 border-gray-600 px-3 py-1">
        <span
          contentEditable={false}
          className="select-none bg-linear-to-tr from-primary-300 to-primary-400 bg-clip-text font-medium text-white outline-hidden text-sm"
        >
          MDX
        </span>
      </div>
      <pre
        className={cn(
          'text-white bg-foreground dark:bg-background rounded-md p-4 pt-12 border',
          isInvalid ? 'border-red-500' : 'border-gray-600'
        )}
      >
        <NodeViewContent
          as="code"
          aria-invalid={isInvalid}
          aria-label="MDX block content"
        />
      </pre>
    </NodeViewWrapper>
  )
}
