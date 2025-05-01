import { Extension } from '@tiptap/core'
import { Markdown } from 'tiptap-markdown'
import MarkdownIt from 'markdown-it'
import markdownItKatex from 'markdown-it-katex'

export const MarkdownWithMath = Extension.create({
  name: 'markdownWithMath',
  
  addExtensions() {
    return [
      Markdown.configure({
        html: true,
        tightLists: true,
        bulletListMarker: '-',
        transformPastedText: true,
      }),
    ]
  },
  
  onBeforeCreate() {
    // Create markdown-it instance with KaTeX support
    const md = new MarkdownIt()
    md.use(markdownItKatex)
    
    // Store the original parser functions
    const originalGetMarkdown = this.editor.storage.markdown?.getMarkdown
    
    // Add custom parser with math support
    this.editor.storage.markdown = {
      ...this.editor.storage.markdown,
      
      // Override the getMarkdown method to handle math nodes
      getMarkdown: () => {
        if (originalGetMarkdown) {
          const markdown = originalGetMarkdown.call(this.editor.storage.markdown)
          // If needed, you can add additional processing of the markdown here
          return markdown
        }
        return ''
      }
    }
    
    // Register a paste handler for LaTeX
    this.editor.on('paste', ({ event, view }) => {
      // Get pasted text
      const text = event.clipboardData?.getData('text/plain')
      
      if (text) {
        // Check if text contains LaTeX delimiters
        const latexMatch = text.match(/\$(.*?)\$/g)
        if (latexMatch) {
          // Process LaTeX
          // This is a simple example - you might want more complex handling
          event.preventDefault()
          latexMatch.forEach(match => {
            const latex = match.slice(1, -1) // Remove $ delimiters
            this.editor.commands.setLatex({ latex })
          })
          return true
        }
      }
      return false
    })
  }
})