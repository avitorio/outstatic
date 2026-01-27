---
title: 'Type Generation'
status: 'published'
author:
  name: 'Andre Vitorio'
  picture: 'https://avatars.githubusercontent.com/u/1417109?v=4'
slug: 'type-generation'
description: 'Generate TypeScript types from your content schemas'
coverImage: ''
publishedAt: '2026-01-24T12:00:00.000Z'
---

**Type generation is only available for Next.js projects using the `withOutstatic` plugin.**

Outstatic can automatically generate TypeScript types from your content schemas. This gives you full type safety when fetching and working with your content.

## Setup

To enable type generation, use the `withOutstatic` plugin in your `next.config.js`. Types are generated automatically during the build process:

```javascript
// next.config.js
const { withOutstatic } = require('outstatic')

module.exports = withOutstatic({
  // your Next.js config
})
```

Then, add the output path to your `tsconfig.json` include array:

```json
{
  "include": [
    // ... your other includes
    ".outstatic/types/**/*.ts"
  ]
}
```

## Example Generated Files

Here's an example of files the generator creates:

```
./outstatic/types
  index.ts              # Re-exports all types
  collections.ts        # Collection and Singleton type maps
  api.d.ts              # Typed overloads for server functions
  posts.ts              # Types for 'posts' collection
  projects.ts           # Types for 'projects' collection
  _singletons/
    home.ts             # Types for 'home' singleton
    about.ts            # Types for 'about' singleton
```

### Example Generated Types

For a `posts` collection with custom fields:

```typescript
// ./outstatic/types/posts.ts
export type Posts = {
  // Base document fields
  title: string
  status: 'published' | 'draft'
  slug: string
  content: string
  publishedAt: string
  author: {
    name: string
    picture: string
  }
  coverImage: string

  // Custom fields from schema.json
  category: 'tech' | 'lifestyle' | 'news'
  featured: boolean
  tags: Array<{ label: string; value: string }>
}
```

### Type Mapping

The generator converts schema field types to TypeScript:

| Schema Field Type | TypeScript Type |
|-------------------|-----------------|
| `String` | `string` |
| `Text` | `string` |
| `Number` | `number` |
| `Boolean` | `boolean` |
| `Date` | `string` (ISO format) |
| `Image` | `string` (URL) |
| `Tags` | `Array<{ label: string; value: string }>` |
| `Tags` with values | Union type of allowed values |

## Using Generated Types

Once types are generated, you get full type safety when fetching content:

```typescript
import { getDocuments, getDocumentBySlug, getSingletonBySlug } from 'outstatic/server'

// Types are automatically inferred
const posts = getDocuments('posts', ['title', 'slug', 'category'])
// posts is typed as Array<Pick<Posts, 'title' | 'slug' | 'category'>>

const post = getDocumentBySlug('posts', 'my-post', ['title', 'content', 'author'])
// post is typed as Pick<Posts, 'title' | 'content' | 'author'>

const home = getSingletonBySlug('home', ['title', 'description'])
// home is typed based on your home singleton schema
```

### The Collections Type Map

The generated `collections.ts` file includes a type map for all your content:

```typescript
// ./outstatic/types/collections.ts
import type { Posts } from './posts'
import type { Projects } from './projects'
import type { Home } from './_singletons/home'

export interface Collections {
  posts: Posts
  projects: Projects
}

export interface Singletons {
  home: Home
}

export type CollectionName = keyof Collections
export type SingletonName = keyof Singletons
```

## Good to Know

- Types are regenerated whenever you modify a `schema.json` file (when using `--watch`)
- The type generator reads schemas from both Collections and Singletons
- Custom fields defined through the Outstatic dashboard automatically update the schema files
