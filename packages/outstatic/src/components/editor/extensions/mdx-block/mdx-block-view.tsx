import {
  NodeViewContent,
  NodeViewWrapper,
  type NodeViewProps
} from '@tiptap/react'
import {
  AlertCircle,
  Box,
  Check,
  Code2,
  Copy,
  Image as ImageIcon
} from 'lucide-react'
import { DynamicIcon, type IconName } from '@/components/ui/dynamic-icon'
import {
  createElement,
  Fragment,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/shadcn/tooltip'
import { cn } from '@/utils/ui'
import { validateMdxBlock } from './mdx-validation'
import { Block } from '@/utils/metadata/types'
import {
  BlockFormValues,
  getBlockPropValue,
  isEmptyBlockValue
} from '../slash-command/block-jsx'
import { Button } from '@/components/ui/shadcn/button'
import { Checkbox } from '@/components/ui/shadcn/checkbox'
import { Input } from '@/components/ui/shadcn/input'
import { Label } from '@/components/ui/shadcn/label'
import { Textarea } from '@/components/ui/shadcn/textarea'
import MediaLibraryModal from '@/components/ui/outstatic/media-library-modal'
import { getSerializedMdxBlock } from './mdx-block-serialization'

type HighlightNode = {
  type?: string
  tagName?: string
  value?: string
  properties?: {
    className?: string | string[]
  }
  children?: HighlightNode[]
}

type Lowlight = {
  highlight: (
    language: string,
    value: string
  ) => {
    children?: unknown[]
  }
}

const renderHighlightedNode = (node: HighlightNode, key: string): ReactNode => {
  if (node.type === 'text') {
    return node.value ?? ''
  }

  const children = node.children?.map((child, index) =>
    renderHighlightedNode(child, `${key}-${index}`)
  )

  if (node.type === 'element') {
    const className = Array.isArray(node.properties?.className)
      ? node.properties?.className.join(' ')
      : node.properties?.className

    return createElement(node.tagName ?? 'span', { className, key }, children)
  }

  return <Fragment key={key}>{children}</Fragment>
}

const getLowlight = (extension: NodeViewProps['extension']) =>
  (extension.options as { lowlight?: Lowlight }).lowlight

const highlightMdxCode = (value: string, lowlight?: Lowlight) => {
  if (!lowlight) {
    return value
  }

  try {
    return lowlight
      .highlight('mdx', value)
      .children?.map((node, index) =>
        renderHighlightedNode(node as HighlightNode, String(index))
      )
  } catch {
    return value
  }
}

const parseBlockDefinition = (value: unknown): Block | null => {
  if (typeof value !== 'string') {
    return null
  }

  try {
    return JSON.parse(value) as Block
  } catch {
    return null
  }
}

const parseBlockValues = (value: unknown): BlockFormValues => {
  if (typeof value !== 'string') {
    return {}
  }

  try {
    return JSON.parse(value) as BlockFormValues
  } catch {
    return {}
  }
}

const copyToClipboard = async (text: string) => {
  if (!navigator?.clipboard) {
    return false
  }

  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

const validateValues = (block: Block, values: BlockFormValues) => {
  return block.props.reduce<Record<string, string>>((errors, prop) => {
    const value = getBlockPropValue(prop, values)

    if (prop.required && prop.type !== 'Boolean' && isEmptyBlockValue(value)) {
      errors[prop.name] = 'Required'
    }

    if (prop.type === 'Number' && !isEmptyBlockValue(value)) {
      const numberValue = Number(value)
      if (!Number.isFinite(numberValue)) {
        errors[prop.name] = 'Enter a valid number'
      }
    }

    return errors
  }, {})
}

const OutstaticBlockView = ({
  extension,
  node,
  selected,
  updateAttributes
}: Pick<
  NodeViewProps,
  'extension' | 'node' | 'selected' | 'updateAttributes'
>) => {
  const block = useMemo(
    () => parseBlockDefinition(node.attrs.outstaticBlockDefinition),
    [node.attrs.outstaticBlockDefinition]
  )
  const values = useMemo(
    () => parseBlockValues(node.attrs.outstaticBlockValues),
    [node.attrs.outstaticBlockValues]
  )
  const errors = useMemo(
    () => (block ? validateValues(block, values) : {}),
    [block, values]
  )
  const code = useMemo(() => getSerializedMdxBlock(node) ?? '', [node])
  const [isCodeVisible, setIsCodeVisible] = useState(false)
  const [mediaPropName, setMediaPropName] = useState<string | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const focusKey = node.attrs.outstaticBlockFocusKey

  useEffect(() => {
    if (!focusKey) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      const firstInput = wrapperRef.current?.querySelector<HTMLElement>(
        '[data-outstatic-mdx-block-prop-input="true"]'
      )

      firstInput?.focus()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [focusKey])

  if (!block) {
    return null
  }

  const updateValue = (name: string, value: string | boolean) => {
    updateAttributes({
      outstaticBlockValues: JSON.stringify({
        ...values,
        [name]: value
      })
    })
  }

  return (
    <NodeViewWrapper
      contentEditable={false}
      className={cn(
        'outstatic-mdx-block-ui my-4 rounded-md border bg-card text-card-foreground shadow-xs transition-colors',
        selected && 'border-blue-500 ring-2 ring-blue-500/20'
      )}
    >
      <div ref={wrapperRef}>
        <div className="flex items-start justify-between gap-3 border-b px-4 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {block.icon ? (
                <DynamicIcon
                  name={block.icon as IconName}
                  className="h-4 w-4 text-muted-foreground"
                  fallback={() => (
                    <Box className="h-4 w-4 text-muted-foreground" />
                  )}
                />
              ) : (
                <Box className="h-4 w-4 text-muted-foreground" />
              )}
              <div className="truncate text-base font-medium">{block.name}</div>
            </div>
            {block.description ? (
              <div className="mt-1 text-sm text-muted-foreground">
                {block.description}
              </div>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant={isCodeVisible ? 'secondary' : 'ghost'}
                  size="icon"
                  aria-expanded={isCodeVisible}
                  aria-pressed={isCodeVisible}
                  onClick={() => setIsCodeVisible((visible) => !visible)}
                  className="size-8 text-muted-foreground"
                  aria-label={
                    isCodeVisible ? 'Hide block code' : 'View block code'
                  }
                >
                  <Code2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                {isCodeVisible ? 'Hide block code' : 'View block code'}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {isCodeVisible ? (
          <div className="border-b p-0">
            <RawMdxBlockView code={code} extension={extension} node={node} />
          </div>
        ) : null}

        {block.props.length > 0 ? (
          <div className="grid gap-4 p-4">
            {block.props.map((prop) => {
              const value = values[prop.name]
              const error = errors[prop.name]

              return (
                <div key={prop.name} className="space-y-1.5">
                  <Label htmlFor={`mdx-block-${block.name}-${prop.name}`}>
                    {prop.name}
                    {prop.required ? (
                      <span className="ml-1 text-destructive">*</span>
                    ) : null}
                  </Label>
                  {prop.description ? (
                    <div className="text-xs text-muted-foreground">
                      {prop.description}
                    </div>
                  ) : null}

                  {prop.type === 'Text' || prop.type === 'Children' ? (
                    <Textarea
                      id={`mdx-block-${block.name}-${prop.name}`}
                      data-outstatic-mdx-block-prop-input="true"
                      value={typeof value === 'string' ? value : ''}
                      onChange={(event) =>
                        updateValue(prop.name, event.target.value)
                      }
                      className="min-h-20 text-sm selection:text-foreground"
                    />
                  ) : prop.type === 'Boolean' ? (
                    <div className="flex h-9 items-center gap-2">
                      <Checkbox
                        id={`mdx-block-${block.name}-${prop.name}`}
                        data-outstatic-mdx-block-prop-input="true"
                        checked={value === true}
                        onCheckedChange={(checked) =>
                          updateValue(prop.name, checked === true)
                        }
                      />
                      <Label
                        htmlFor={`mdx-block-${block.name}-${prop.name}`}
                        className="text-sm font-normal"
                      >
                        Enabled
                      </Label>
                    </div>
                  ) : prop.type === 'Select' ? (
                    <select
                      id={`mdx-block-${block.name}-${prop.name}`}
                      data-outstatic-mdx-block-prop-input="true"
                      value={typeof value === 'string' ? value : ''}
                      onChange={(event) =>
                        updateValue(prop.name, event.target.value)
                      }
                      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm selection:text-foreground"
                    >
                      <option value="">Select option</option>
                      {prop.options?.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : prop.type === 'Image' ? (
                    <div className="flex gap-2">
                      <Input
                        id={`mdx-block-${block.name}-${prop.name}`}
                        data-outstatic-mdx-block-prop-input="true"
                        value={typeof value === 'string' ? value : ''}
                        onChange={(event) =>
                          updateValue(prop.name, event.target.value)
                        }
                        className="text-sm selection:text-foreground"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setMediaPropName(prop.name)}
                      >
                        <span className="sr-only">Select image</span>
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Input
                      id={`mdx-block-${block.name}-${prop.name}`}
                      data-outstatic-mdx-block-prop-input="true"
                      type={
                        prop.type === 'Number'
                          ? 'number'
                          : prop.type === 'Date'
                            ? 'date'
                            : 'text'
                      }
                      value={typeof value === 'string' ? value : ''}
                      onChange={(event) =>
                        updateValue(prop.name, event.target.value)
                      }
                      className="text-sm selection:text-foreground"
                    />
                  )}

                  {error ? (
                    <div className="text-xs text-destructive">{error}</div>
                  ) : null}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-4 text-sm text-muted-foreground">
            This block has no props.
          </div>
        )}
      </div>

      {mediaPropName ? (
        <MediaLibraryModal
          open={Boolean(mediaPropName)}
          onOpenChange={(open) => {
            if (!open) {
              setMediaPropName(null)
            }
          }}
          onSelect={(imageUrl) => {
            updateValue(mediaPropName, imageUrl)
            setMediaPropName(null)
          }}
        />
      ) : null}
    </NodeViewWrapper>
  )
}

const RawMdxBlockView = ({
  code,
  extension,
  node
}: Pick<NodeViewProps, 'extension' | 'node'> & { code?: string }) => {
  const textContent = code ?? node.textContent
  const isPreview = typeof code === 'string'
  const lowlight = useMemo(() => getLowlight(extension), [extension])
  const highlightedCode = useMemo(
    () => (isPreview ? highlightMdxCode(code, lowlight) : null),
    [code, isPreview, lowlight]
  )
  const validation = useMemo(() => validateMdxBlock(textContent), [textContent])
  const isInvalid = !validation.valid
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    if (!isCopied) {
      return
    }

    const timeoutId = window.setTimeout(() => setIsCopied(false), 1500)

    return () => window.clearTimeout(timeoutId)
  }, [isCopied])

  const content = (
    <>
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
      {isPreview ? (
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={async () => {
            const copied = await copyToClipboard(textContent)
            if (copied) {
              setIsCopied(true)
            }
          }}
          className="absolute top-2 right-4 z-10 border-gray-600 bg-background/95 inline-flex"
          aria-label={isCopied ? 'Copied' : 'Copy code'}
        >
          {isCopied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              <span className="sr-only">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span className="sr-only">Copy code</span>
            </>
          )}
        </Button>
      ) : null}
      {!isPreview ? (
        <div className="absolute top-0 right-6 rounded-b-md border border-t-0 border-gray-600 px-3 py-1">
          <span
            contentEditable={false}
            className="select-none bg-linear-to-tr from-primary-300 to-primary-400 bg-clip-text font-medium text-white outline-hidden text-sm"
          >
            MDX
          </span>
        </div>
      ) : null}
      <pre
        className={cn(
          'text-white bg-foreground dark:bg-background rounded-md py-8 border',
          isInvalid ? 'border-red-500' : 'border-gray-600',
          isPreview ? 'mt-0 mb-0 rounded-none text-base' : ''
        )}
      >
        {isPreview ? (
          <code
            aria-invalid={isInvalid}
            aria-label="MDX block content"
            className="hljs"
          >
            {highlightedCode}
          </code>
        ) : (
          <NodeViewContent
            as="code"
            aria-invalid={isInvalid}
            aria-label="MDX block content"
          />
        )}
      </pre>
    </>
  )

  if (isPreview) {
    return <div className="relative">{content}</div>
  }

  return <NodeViewWrapper className="relative">{content}</NodeViewWrapper>
}

export const MdxBlockView = (props: NodeViewProps) => {
  if (props.node.attrs.outstaticBlockName) {
    return <OutstaticBlockView {...props} />
  }

  return <RawMdxBlockView {...props} />
}
