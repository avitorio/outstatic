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
      <div className="absolute top-0 right-6 rounded-b-md border border-t-0 border-gray-600 px-3 py-1">
        <select
          contentEditable={false}
          defaultValue={defaultLanguage}
          className="select-none bg-gradient-to-tr from-primary-300 to-primary-400 bg-clip-text font-medium text-white outline-none text-sm"
          onChange={(event) =>
            updateAttributes({ language: event.target.value })
          }
        >
          <option value="null">auto</option>
          <option disabled>—</option>
          {extension.options.lowlight.listLanguages().map((lang, index) => (
            <option key={index} value={lang}>
              {lang}
            </option>
          ))}
        </select>
      </div>
      <pre className="text-white bg-slate-900 rounded-md p-4 pt-12">
        <NodeViewContent as="code" />
      </pre>
    </NodeViewWrapper>
  )
}

export default CodeBlock
