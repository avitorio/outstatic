import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'

type CodeBlockProps = {
  node: {
    attrs: {
      language: string
    }
  }
  updateAttributes: (attrs: { language: string }) => void
  extension: {
    languages: { [key: string]: string }
    options: {
      lowlight: {
        listLanguages: () => string[]
      }
    }
  }
}

const CodeBlock = ({
  node: {
    attrs: { language: defaultLanguage }
  },
  updateAttributes,
  extension
}: CodeBlockProps) => {
  return (
    <NodeViewWrapper className="relative">
      <select
        contentEditable={false}
        defaultValue={defaultLanguage}
        className="absolute top-2 right-2 bg-white focus:outline-none rounded-sm"
        onChange={(event) => updateAttributes({ language: event.target.value })}
      >
        <option value="null">auto</option>
        <option disabled>—</option>
        {extension.options.lowlight.listLanguages().map((lang, index) => (
          <option key={index} value={lang}>
            {lang}
          </option>
        ))}
      </select>
      <pre className="text-white bg-slate-900 rounded-md p-4">
        <NodeViewContent as="code" />
      </pre>
    </NodeViewWrapper>
  )
}

export default CodeBlock
