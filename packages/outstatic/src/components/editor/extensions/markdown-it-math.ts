// markdown-it-math.js
// A plugin for markdown-it to parse and render math expressions

import MarkdownIt from 'markdown-it'

const isEscaped = (source: string, position: number) => {
  let backslashCount = 0

  for (let pos = position - 1; source[pos] === '\\'; pos--) {
    backslashCount++
  }

  return backslashCount % 2 === 1
}

const isWhitespace = (character: string | undefined) =>
  character !== undefined && /\s/.test(character)

const isAlphanumeric = (character: string | undefined) =>
  character !== undefined && /[A-Za-z0-9]/.test(character)

const isDigit = (character: string | undefined) =>
  character !== undefined && /[0-9]/.test(character)

const canOpenInlineMath = (source: string, position: number) => {
  const previousCharacter = source[position - 1]
  const nextCharacter = source[position + 1]

  return (
    nextCharacter !== undefined &&
    !isEscaped(source, position) &&
    !isWhitespace(nextCharacter) &&
    !isAlphanumeric(previousCharacter)
  )
}

const canCloseInlineMath = (source: string, position: number) => {
  const previousCharacter = source[position - 1]
  const nextCharacter = source[position + 1]

  return (
    previousCharacter !== undefined &&
    !isEscaped(source, position) &&
    !isWhitespace(previousCharacter) &&
    !isDigit(nextCharacter)
  )
}

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

    if (!canOpenInlineMath(state.src, state.pos)) {
      return false
    }

    let pos = state.pos + options.inlineOpen.length
    let found = false
    const end = state.src.length

    // Find the closing marker
    while (pos < end) {
      if (
        state.src.slice(pos, pos + options.inlineClose.length) !==
        options.inlineClose
      ) {
        pos++
        continue
      }

      if (canCloseInlineMath(state.src, pos)) {
        found = true
        break
      }

      if (canOpenInlineMath(state.src, pos)) {
        return false
      }

      pos++
    }

    // If closing marker not found or nothing between markers
    if (!found || pos === state.pos + options.inlineOpen.length) {
      return false
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
