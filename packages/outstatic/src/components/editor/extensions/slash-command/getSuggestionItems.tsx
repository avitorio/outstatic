import {
  Code,
  Edit3,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  List,
  ListOrdered,
  TableIcon,
  Text,
  TextQuote
} from 'lucide-react'
import {
  CommandItemProps,
  CommandProps
} from '@/components/editor/extensions/slash-command'

const items = [
  {
    title: 'Continue writing',
    description: 'Use AI to expand your thoughts.',
    icon: <Edit3 size={18} />
  },
  {
    title: 'Text',
    description: 'Just start typing with plain text.',
    searchTerms: ['p', 'paragraph'],
    icon: <Text size={18} />,
    command: ({ editor, range }: CommandProps) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .toggleNode('paragraph', 'paragraph')
        .run()
    }
  },
  {
    title: 'Heading 1',
    description: 'Big section heading.',
    searchTerms: ['title', 'big', 'large', 'h1'],
    icon: <Heading1 size={18} />,
    command: ({ editor, range }: CommandProps) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode('heading', { level: 1 })
        .run()
    }
  },
  {
    title: 'Heading 2',
    description: 'Medium section heading.',
    searchTerms: ['subtitle', 'medium', 'h2'],
    icon: <Heading2 size={18} />,
    command: ({ editor, range }: CommandProps) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode('heading', { level: 2 })
        .run()
    }
  },
  {
    title: 'Heading 3',
    description: 'Small section heading.',
    searchTerms: ['subtitle', 'small', 'h3'],
    icon: <Heading3 size={18} />,
    command: ({ editor, range }: CommandProps) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode('heading', { level: 3 })
        .run()
    }
  },
  {
    title: 'Bullet List',
    description: 'Create a simple bullet list.',
    searchTerms: ['unordered', 'point'],
    icon: <List size={18} />,
    command: ({ editor, range }: CommandProps) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run()
    }
  },
  {
    title: 'Numbered List',
    description: 'Create a list with numbering.',
    searchTerms: ['ordered'],
    icon: <ListOrdered size={18} />,
    command: ({ editor, range }: CommandProps) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run()
    }
  },
  {
    title: 'Quote',
    description: 'Capture a quote.',
    searchTerms: ['blockquote'],
    icon: <TextQuote size={18} />,
    command: ({ editor, range }: CommandProps) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .toggleNode('paragraph', 'paragraph')
        .toggleBlockquote()
        .run()
  },
  {
    title: 'Code',
    description: 'Capture a code snippet.',
    searchTerms: ['codeblock'],
    icon: <Code size={18} />,
    command: ({ editor, range }: CommandProps) =>
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run()
  },
  {
    title: 'Image',
    description: 'Upload, embed or select from library.',
    searchTerms: ['photo', 'picture', 'media', 'gallery'],
    icon: <ImageIcon size={18} />
  },
  {
    title: 'Table',
    description: 'Insert a table.',
    searchTerms: ['table', 'cell', 'row'],
    icon: <TableIcon size={18} />,
    command: ({ editor, range }: CommandProps) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run()
    }
  }
] as CommandItemProps[]

const filterItems = (
  items: CommandItemProps[],
  search: string
): CommandItemProps[] => {
  return items.filter((item: CommandItemProps) => {
    const titleMatch = item.title.toLowerCase().includes(search)
    const descriptionMatch = item.description.toLowerCase().includes(search)
    const searchTermMatch =
      item.searchTerms &&
      item.searchTerms.some((term: string | any[]) => term.includes(search))

    if (titleMatch || descriptionMatch || searchTermMatch) {
      return true
    }

    return false
  })
}

export const getSuggestionItems = (props: { query: string }) => {
  const { query } = props
  if (typeof query !== 'string' || query.length === 0) {
    return items
  }

  const search = query.toLowerCase()
  const filteredItems = filterItems(items, search)
  return filteredItems
}
