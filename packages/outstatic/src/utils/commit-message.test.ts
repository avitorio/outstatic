import {
  createOutstaticCommitMessage,
  deriveContentCommitAction
} from './commit-message'

describe('createOutstaticCommitMessage', () => {
  it('formats content create draft', () => {
    expect(
      createOutstaticCommitMessage({
        scope: 'content',
        action: 'create',
        status: 'draft',
        label: 'New Post'
      })
    ).toBe('create draft "New Post" [outstatic:content]')
  })

  it('formats content update draft', () => {
    expect(
      createOutstaticCommitMessage({
        scope: 'content',
        action: 'update',
        status: 'draft',
        label: 'Existing Draft'
      })
    ).toBe('update draft "Existing Draft" [outstatic:content]')
  })

  it('formats content update published', () => {
    expect(
      createOutstaticCommitMessage({
        scope: 'content',
        action: 'update',
        status: 'published',
        label: 'Published Post'
      })
    ).toBe('update published "Published Post" [outstatic:content]')
  })

  it('formats publish transition without status', () => {
    expect(
      createOutstaticCommitMessage({
        scope: 'content',
        action: 'publish',
        label: 'Post Title'
      })
    ).toBe('publish "Post Title" [outstatic:content]')
  })

  it('formats unpublish transition without status', () => {
    expect(
      createOutstaticCommitMessage({
        scope: 'content',
        action: 'unpublish',
        label: 'Post Title'
      })
    ).toBe('unpublish "Post Title" [outstatic:content]')
  })

  it('formats content delete draft', () => {
    expect(
      createOutstaticCommitMessage({
        scope: 'content',
        action: 'delete',
        status: 'draft',
        label: 'Draft Post'
      })
    ).toBe('delete draft "Draft Post" [outstatic:content]')
  })

  it('formats content delete published', () => {
    expect(
      createOutstaticCommitMessage({
        scope: 'content',
        action: 'delete',
        status: 'published',
        label: 'Published Post'
      })
    ).toBe('delete published "Published Post" [outstatic:content]')
  })

  it('formats media upload with target', () => {
    expect(
      createOutstaticCommitMessage({
        scope: 'media',
        action: 'upload',
        target: 'media',
        label: 'hero.jpg'
      })
    ).toBe('upload media "hero.jpg" [outstatic:media]')
  })

  it('formats media delete with target', () => {
    expect(
      createOutstaticCommitMessage({
        scope: 'media',
        action: 'delete',
        target: 'media',
        label: 'old-image.png'
      })
    ).toBe('delete media "old-image.png" [outstatic:media]')
  })

  it('formats config update with target only', () => {
    expect(
      createOutstaticCommitMessage({
        scope: 'config',
        action: 'update',
        target: 'collections'
      })
    ).toBe('update collections [outstatic:config]')
  })

  it('formats config update settings', () => {
    expect(
      createOutstaticCommitMessage({
        scope: 'config',
        action: 'update',
        target: 'settings'
      })
    ).toBe('update settings [outstatic:config]')
  })

  it('omits target and label when only action and scope provided', () => {
    expect(
      createOutstaticCommitMessage({ scope: 'config', action: 'update' })
    ).toBe('update [outstatic:config]')
  })

  it('escapes double quotes in labels', () => {
    expect(
      createOutstaticCommitMessage({
        scope: 'content',
        action: 'update',
        status: 'draft',
        label: 'A "quoted" title'
      })
    ).toBe('update draft "A \\"quoted\\" title" [outstatic:content]')
  })

  it('trims whitespace and treats empty-after-trim labels as missing', () => {
    expect(
      createOutstaticCommitMessage({
        scope: 'content',
        action: 'update',
        status: 'draft',
        label: '   '
      })
    ).toBe('update draft [outstatic:content]')
  })

  it('collapses newlines and tabs in labels', () => {
    expect(
      createOutstaticCommitMessage({
        scope: 'content',
        action: 'update',
        status: 'draft',
        label: 'Line one\nLine\ttwo'
      })
    ).toBe('update draft "Line one Line two" [outstatic:content]')
  })

  it('supports config target with label (collection by slug)', () => {
    expect(
      createOutstaticCommitMessage({
        scope: 'config',
        action: 'create',
        target: 'collection',
        label: 'posts'
      })
    ).toBe('create collection "posts" [outstatic:config]')
  })
})

describe('deriveContentCommitAction', () => {
  it('returns create when isCreate is true regardless of statuses', () => {
    expect(deriveContentCommitAction(true, undefined, 'draft')).toBe('create')
    expect(deriveContentCommitAction(true, undefined, 'published')).toBe(
      'create'
    )
    expect(deriveContentCommitAction(true, 'draft', 'published')).toBe('create')
  })

  it('returns publish when transitioning from draft to published', () => {
    expect(deriveContentCommitAction(false, 'draft', 'published')).toBe(
      'publish'
    )
  })

  it('returns unpublish when transitioning from published to draft', () => {
    expect(deriveContentCommitAction(false, 'published', 'draft')).toBe(
      'unpublish'
    )
  })

  it('returns update when status is unchanged (draft to draft)', () => {
    expect(deriveContentCommitAction(false, 'draft', 'draft')).toBe('update')
  })

  it('returns update when status is unchanged (published to published)', () => {
    expect(deriveContentCommitAction(false, 'published', 'published')).toBe(
      'update'
    )
  })

  it('returns update when previousStatus is undefined (existing doc with unknown prior status)', () => {
    expect(deriveContentCommitAction(false, undefined, 'draft')).toBe('update')
    expect(deriveContentCommitAction(false, undefined, 'published')).toBe(
      'update'
    )
  })
})
