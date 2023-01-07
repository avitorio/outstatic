---
title: 'Fetching data'
status: 'published'
author:
  name: 'Jakob Heuser'
  picture: 'https://avatars.githubusercontent.com/u/1795?v=4'
slug: 'fetching-data'
description: ''
coverImage: ''
publishedAt: '2022-10-13T12:28:25.000Z'
---

We've made it easy for you to fetch the data and content you create with Outstatic by providing a simple API. You should use this API on the front end of your Next.js website, inside of `getStaticProps`.

## Fetching collections

To fetch all your collections, without the documents, use the `getCollections` function. It will return an array of strings, each string being the name of a folder under `/outstatic/content/`.

## Fetching documents

Retrieving documents is done with outstatic's JSON database. The `load` method retrieves the JSON database, and you can then `find()` documents matching either Outstatic properties such as `publishedAt` and `collection`, or any custom fields you've defined.

```js
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
```

### The Query Object

Querying for documents is done by passing an object in to `find()`, containing a [mongo-like query object](http://docs.mongodb.org/manual/reference/operator/query/). Under the hood, we use the excellent [sift](https://www.npmjs.com/package/sift) library which supports: $in, $nin, $exists, $gte, $gt, $lte, $lt, $eq, $ne, $mod, $all, $and, $or, $nor, $not, $size, $type, $regex, $where, and $elemMatch.

```js
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

```js
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

```js
// return ALL documents - pretty expensive
await db.find({}).toArray()
```

## Fetch examples

### Fetch a collection

```js
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

```js
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

### Getting paths to use with `getStaticPaths`

The `load` method and `find()` API can also be used for retrieving static paths. In these situations, it's recommended to retrieve as few fields as necessary for next.js to build quickly.

```js
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
