/** @jest-environment node */

import fsPromises from 'fs/promises'
import { load } from './load'

const post = {
  title: 'Hello World',
  slug: 'hello-world',
  status: 'published',
  collection: 'posts',
  publishedAt: '2024-01-01T00:00:00.000Z',
  __outstatic: {
    hash: 'abc123',
    commit: 'def456',
    path: 'outstatic/content/posts/hello-world.md'
  }
}

describe('load().find()', () => {
  beforeEach(() => {
    jest
      .spyOn(fsPromises, 'readFile')
      .mockImplementation(async (path) =>
        Buffer.from(
          String(path).endsWith('metadata.json')
            ? JSON.stringify({ metadata: [post] })
            : '---\ntitle: Hello World\n---\nPost body\n'
        )
      )
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('returns all metadata fields and content when no projection is given', async () => {
    const db = await load()
    const docs = await db.find({}).toArray()

    expect(docs).toEqual([{ ...post, content: 'Post body\n' }])
  })

  it('returns the full document from first() when no projection is given', async () => {
    const db = await load()
    const doc = await db.find({ slug: 'hello-world' }).first()

    expect(doc).toEqual({ ...post, content: 'Post body\n' })
  })

  it('returns only the requested fields when a projection is given', async () => {
    const db = await load()
    const docs = await db.find({}, ['title', 'slug']).toArray()

    expect(docs).toEqual([{ title: 'Hello World', slug: 'hello-world' }])
  })
})
