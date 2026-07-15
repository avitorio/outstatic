import { isInSingletonDirectory } from './singleton-paths'

describe('isInSingletonDirectory', () => {
  it('treats root-level Markdown as singleton-directory entries', () => {
    expect(isInSingletonDirectory('about.md', [''])).toBe(true)
    expect(isInSingletonDirectory('post.md', [''])).toBe(true)
  })

  it('classifies documents under a nested singleton directory', () => {
    expect(isInSingletonDirectory('pages/about.md', ['pages'])).toBe(true)
  })

  it('does not classify unrelated or nested files as root singleton entries', () => {
    expect(isInSingletonDirectory('posts/first.md', [''])).toBe(false)
    expect(isInSingletonDirectory('blog/post.md', ['pages'])).toBe(false)
  })
})
