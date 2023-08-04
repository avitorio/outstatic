---
title: 'Fetching data'
status: 'published'
author:
  name: 'Jakob Heuser'
  picture: 'https://avatars.githubusercontent.com/u/1795?v=4'
slug: 'fetching-data'
description: ''
coverImage: ''
publishedAt: '2023-07-25T12:28:25.000Z'
---

We've made it easy for you to fetch the data and content you create with Outstatic by providing simple functions and APIs. You should use these on the front end of your Next.js website. They can be used as async functions in the `/app` or `/pages` directories.

## Fetching collections

To fetch all your collections, without the documents, use the `getCollections` function. It will return an array of strings, each string being the name of a folder under `/outstatic/content/`.

## Basic Document Fetching

### Fetching all documents

To fetch all the documents from a collection, you can use the `getDocuments` function as an async function when using the `/app` directory or inside `getStaticProps` or `getServerSideProps` functions in the `/pages` directory. The `getDocuments` function accepts two parameters: the name of the collection as a string, and an array with the fields to be retrieved. It returns an array of Documents sorted by date, with the most recent `publishedAt` documents first.

**App directory example:**

```javascript
// Fetch ALL Documents from the posts collection
// /app/posts/[slug]/page.tsx

import { getDocuments } from 'outstatic/server'

export default async function Index() {
  const posts = await getData()
  return posts.map((post) => <h1>{post.title}</h1>)
}

async function getData() {
  const posts = getDocuments('posts', ['title'])

  return posts
}
```

**Pages directory example:**

```javascript
// Fetch ALL Documents from the posts collection
// /pages/posts/[slug].tsx

import { getDocuments } from 'outstatic/server'

export default function Index({ posts }) {
  return posts.map((post) => <h1>{post.title}</h1>)
}

export const getStaticProps = async () => {
  const posts = getDocuments('posts', ['title'])
  return {
    props: { posts }
  }
}
```

### Fetching documents by slug

Documents can be fetched by slug, this is usually helpful when using Next.js' [Dynamic Routes](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes). The function `getDocumentBySlug` takes three parameters: the name of the collection as a string, the slug of the document, and an array with the fields to be retrieved.

**App directory example:**

```javascript
// Example of a app/posts/[slug]/page.tsx

async function getData(params: { slug: string }) {
  const post = getDocumentBySlug('posts', params.slug, [
    'title',
    'publishedAt',
    'slug',
    'author',
    'content',
    'coverImage'
  ])

  const content = await markdownToHtml(post.content || '')

  return {
    ...post,
    content
  }
}
```

**Pages directory example:**

```javascript
// Example of a /pages/posts/[slug].tsx page

export async function getStaticProps({ params }: Params) {
  const post = getDocumentBySlug('posts', params.slug, [
    'title',
    'publishedAt',
    'slug',
    'author',
    'content',
    'coverImage'
  ])
  const content = await markdownToHtml(post.content || '')

  return {
    props: {
      post: {
        ...post,
        content
      }
    }
  }
}
```

Keep in mind that the content is returned as Markdown. In order to convert it to HTML you should use a library such as [remark](https://www.npmjs.com/package/remark). To see an example of how you can use remark to convert Markdown to html, please take a look at our [Blog Example template](https://github.com/avitorio/outstatic/blob/main/examples/blog/src/lib/markdownToHtml.ts).

### Getting paths to use with `getStaticPaths` or `generateStaticParams`

We provide a simple helper function so you can easily get all the document paths for a specific collection. This is helpful to feed the array of slugs needed for Next.js to statically generate dynamic routes.

```javascript
// Fetching document paths

// /app
export async function generateStaticParams() {
  const posts = getDocumentSlugs('posts')
  return posts.map((slug) => ({ slug }))
}

// /pages
export async function getStaticPaths() {
  return {
    paths: getDocumentPaths('posts'),
    fallback: false
  }
}
```

## Advanced Document Fetching - Metadata DB

Documents can also be retrieved with Outstatic's JSON database. Outstatic creates a `metadata.json` file in the `/outstatic/content` folder, where all the metadata for documents is stored. The `load` method retrieves the JSON database, and you can then `find()` documents matching either Outstatic properties such as `publishedAt` and `collection`, or any custom fields you've defined.

```javascript
import { load } from 'outstatic/server'

export async function getStaticProps({ params }: Params) {
  const db = await load()
  const posts = await db
    .find(query, fields)
    .sort(/* sort */) // chain this to sort the results
    .skip(number) // chain this to skip the first `number` entries
    .limit(number) // chain this to set the max returned items to `number`
    .project(fields) // chain this to update the fields you want returned
    .toArray() // end the chain, returning a Promise of the resulting documents
}

//...
```

### The Query Object

Querying for documents is done by passing an object in to `find()`, containing a [mongo-like query object](http://docs.mongodb.org/manual/reference/operator/query/). Under the hood, we use the excellent [sift](https://www.npmjs.com/package/sift) library which supports: $in, $nin, $exists, $gte, $gt, $lte, $lt, $eq, $ne, $mod, $all, $and, $or, $nor, $not, $size, $type, $regex, $where, and $elemMatch.

```javascript
// find all posts in the "blog" collection
db.find({
  collection: 'blog'
})

// find all posts in the "blog" or "essays" collection
db.find({
  $or: [{ collection: 'blog' }, { collection: 'essays' }]
})
```

### Requesting Fields

When retrieving documents, you can also specify one or more fields you'd like returned as part of the query, or call `.project()` later on if you prefer a different syntax.

```javascript
// as a second argument
db.find(query, ['title', 'collection', 'publishedAt', 'slug'])

// using .project()
db.find(query).project(['title', 'collection', 'publishedAt', 'slug'])
```

### Sorting Results

Outstatic supports [mongo-like sorting](https://www.mongodb.com/docs/drivers/node/current/fundamentals/crud/read-operations/sort/). When sorting, you can pass:

- a string, which will sort the field ascending: `"title"`

- an object, where the key is the field to sort, and the value is `1` to sort ascending or `-1` to sort decending: `{title: 1}`

- an array containing a mix of the above two sorting options: `[{publishedAt: -1}, {title: 1}]`

### Skipping and Limiting

To support pagination, you may add a `.skip(n)` or `.limit(n)` to the API chain. The first will move through the results by `n` entries, while the later ensures only a maximum of `n` entries are returned.

### Running the Query

Finally, once you've specified your query and any additional options, you can call `toArray()` to return the matching documents. Up until now, all our API calls worked on the metadata JSON from outstatic. When you call `toArray()`, Outstatic will retrieve your individual posts and return the set of documents inside of an array.

As a convienence, you can also call `first()` instead, which returns the first result of the `toArray()` call for you.

```javascript
// return ALL documents - pretty expensive
await db.find({}).toArray()
```

## Advanced Fetch examples

### Fetch a collection

```javascript
import { load } from 'outstatic/server'

export async function getStaticProps({ params }: Params) {
  const db = await load()
  const posts = await db
    .find({
      collection: 'posts'
    })
    .project(['title', 'publishedAt', 'slug', 'author', 'coverImage'])
    .toArray()

  return {
    props: {
      posts
    }
  }
}
```

### Fetch by slug

```javascript
import { load } from 'outstatic/server'

export async function getStaticProps({ params }: Params) {
  const db = await load()
  const post = await db
    .find({
      collection: 'posts',
      slug: params.slug
    })
    .project([
      'title',
      'publishedAt',
      'slug',
      'author',
      'content',
      'coverImage'
    ])
    .first()

  const content = await markdownToHtml(post.content ?? '')

  return {
    props: {
      post: {
        ...post,
        content
      }
    }
  }
}
```

### Getting paths to use with `getStaticPaths` or `generateStaticParams`

The `load` method and `find()` API can also be used for retrieving static paths. In these situations, it's recommended to retrieve as few fields as necessary for Next.js to build quickly.

```javascript
// /app
export async function generateStaticParams() {
  const db = await load()
  const posts = await db
    .find({
      collection: 'posts'
    })
    .project(['slug'])
    .toArray()

  return posts
}

// /pages
export async function getStaticPaths() {
  const db = await load()
  const posts = await db
    .find({
      collection: 'posts'
    })
    .project(['slug'])
    .toArray()

  return {
    paths: posts.map((post) => `posts/${[post.slug]}`),
    fallback: false
  }
}
```

## Usage examples:

If you'd like to check out examples of how to use these functions, please refer to our [Example Blog](https://github.com/avitorio/outstatic/tree/main/examples/blog) repository.

