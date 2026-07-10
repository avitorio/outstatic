import { isInSingletonDirectory } from './singleton-paths'

describe('isInSingletonDirectory', () => {
  it('treats root-level Markdown as singleton-directory entries', () => {
    expect(isInSingletonDirectory('about.md', [''])).toBe(true)
    expect(isInSingletonDirectory('post.md', [''])).toBe(true)
  })

  it('classifies documents under a nested singleton directory', () => {
    expect(isInSingletonDirectory('pages/about.md', ['pages'])).toBe(true)
  })
})
