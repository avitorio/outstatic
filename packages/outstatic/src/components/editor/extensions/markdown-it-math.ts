// markdown-it-math.js
// A plugin for markdown-it to parse and render math expressions

import MarkdownIt from 'markdown-it'

const markdownItMath = (md: MarkdownIt) => {
  // Default options
  const options = {
    inlineOpen: '$',
    inlineClose: '$'
  }

  // Helper function to create a token
  const createToken = (state: any, type: any, content: any, block = false) => {
    const token = state.push(type, '', 0)
    token.content = content
    token.block = block
    token.meta = { type, name: 'math' }
    token.name = 'math'
    return token
  }

  // Inline math rule
  const inlineRule = (state: any, silent: any) => {
    if (
      state.src.slice(state.pos, state.pos + options.inlineOpen.length) !==
      options.inlineOpen
    ) {
      return false
    }

    let pos = state.pos + options.inlineOpen.length
    let found = false
    let end = state.src.length

    // Find the closing marker
    while (pos < end) {
      if (
        state.src.slice(pos, pos + options.inlineClose.length) ===
        options.inlineClose
      ) {
        found = true
        break
      }
      pos++
    }

    // If closing marker not found or nothing between markers
    if (!found || pos === state.pos + options.inlineOpen.length) {
      if (!silent) {
        state.pending += options.inlineOpen
      }
      state.pos += options.inlineOpen.length
      return true
    }

    // Don't run renderer in silent mode
    if (silent) {
      return true
    }

    const content = state.src.slice(state.pos + options.inlineOpen.length, pos)
    createToken(state, 'math', content)

    state.pos = pos + options.inlineClose.length
    return true
  }

  // Math renderer
  const renderMath = (tokens: any, idx: any) => {
    const token = tokens[idx]
    const content = token.content

    // Important: Use consistent attribute naming for TipTap compatibility
    return `<span 
      class="math-node" 
      data-type="math"
      latex="${md.utils.escapeHtml(content)}"
    />`
  }

  // Register the inline rule
  md.inline.ruler.before('escape', 'math', inlineRule)

  // Register renderer
  md.renderer.rules.math = renderMath
}

export default markdownItMath
