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
        getAttrs: node => ({
          latex: node.getAttribute('data-latex'),
        }),
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
      
      unsetLatex: () => ({ chain, state }) => {
        const { selection } = state
        const node = selection.$from.node()
        return chain()
          .insertContent(node.attrs.latex || '')
          .deleteSelection()
          .run()
      }
    }
  },
  
  // Handle rendering of LaTeX nodes to KaTeX
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
                  katex.render(latex, element as HTMLElement, {
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
  
  // Add support for transforming to GitHub-style markdown format
  addStorage() {
    return {
      markdown: {
        serialize: (state: any, node: any) => {
          if (node.attrs.latex) {
            state.write(`$\`${node.attrs.latex}$\``)
          }
        }
      }
    }
  }
})