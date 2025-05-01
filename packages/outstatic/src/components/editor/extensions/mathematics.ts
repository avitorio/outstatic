import { Node, mergeAttributes } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import katex from 'katex'

export const Mathematics = Node.create({
  name: 'math',
  group: 'inline',
  inline: true,
  atom: true,
  
  addAttributes() {
    return {
      latex: {
        default: '',
        parseHTML: element => element.getAttribute('data-latex'),
        renderHTML: attributes => {
          return {
            'data-latex': attributes.latex,
          }
        }
      }
    }
  },
  
  parseHTML() {
    return [
      {
        tag: 'span.math-node',
      },
    ]
  },
  
  renderHTML({ node, HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 
      class: 'math-node',
      'data-type': 'math',
    })]
  },
  
  addCommands() {
    return {
      setLatex: attrs => ({ chain }) => {
        return chain()
          .insertContent({
            type: this.name,
            attrs
          })
          .run()
      },
      
      unsetLatex: () => ({ chain }) => {
        return chain()
          .deleteSelection()
          .run()
      }
    }
  },
  
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('mathRenderer'),
        view: () => ({
          update: view => {
            view.dom.querySelectorAll('span.math-node').forEach(element => {
              const latex = element.getAttribute('data-latex')
              if (latex) {
                try {
                  element.innerHTML = ''
                  katex.render(latex, element, {
                    throwOnError: false,
                    displayMode: false
                  })
                } catch (error) {
                  console.error('KaTeX rendering error:', error)
                }
              }
            })
            return true
          }
        })
      })
    ]
  },
  
  // This is crucial for markdown integration
  toMarkdown(state, node) {
    const latex = node.attrs.latex || ''
    state.write('$' + latex + '$')
  },
  
  parseMarkdown() {
    return {
      node: 'math',
      getAttrs: token => ({
        latex: token.content
      })
    }
  }
})